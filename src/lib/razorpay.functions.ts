import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fundingFeeTotalPaise, payerSchema, paymentResultSchema } from "./razorpay-payment";

export const createFundingPaymentOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => payerSchema.parse(input))
  .handler(async ({ data }) => {
    const { limitSubmission } = await import("./submissions.server");
    const { razorpayCredentials, razorpayRequest } = await import("./razorpay.server");
    const { keyId } = razorpayCredentials();
    await limitSubmission(data.email);
    const amount = fundingFeeTotalPaise();
    const receipt = `FP-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
    const order = await razorpayRequest<{ id: string; amount: number; currency: string }>("/orders", {
      method: "POST",
      body: { amount, currency: "INR", receipt, notes: { programme: "Startup Funding Programme", payer_email: data.email } },
    });
    if (order.amount !== amount || order.currency !== "INR") throw new Error("The payment could not be prepared. Please try again.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("programme_payments").insert({
      programme: "funding_programme", payer_name: data.name, payer_email: data.email, payer_phone: data.phone,
      amount_paise: amount, currency: "INR", razorpay_order_id: order.id,
    });
    if (error) throw new Error("The payment could not be prepared. Please try again.");
    return { orderId: order.id, keyId, amount, currency: "INR" as const };
  });

export const confirmFundingPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => paymentResultSchema.parse(input))
  .handler(async ({ data }) => {
    const { razorpayCredentials, razorpayRequest, hmacSha256Hex, constantTimeEqual } = await import("./razorpay.server");
    const { keySecret } = razorpayCredentials();
    const expected = await hmacSha256Hex(keySecret, `${data.orderId}|${data.paymentId}`);
    if (!constantTimeEqual(expected, data.signature)) throw new Error("The payment could not be verified. If money was deducted, contact us with your payment ID.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("programme_payments").select("id,amount_paise,status").eq("razorpay_order_id", data.orderId).maybeSingle();
    if (error || !row) throw new Error("The payment could not be matched. Contact us with your payment ID.");
    const payment = await razorpayRequest<{ order_id: string; amount: number; currency: string; status: string }>(`/payments/${data.paymentId}`);
    if (payment.order_id !== data.orderId || payment.amount !== row.amount_paise || payment.currency !== "INR") throw new Error("The payment details do not match. Contact us with your payment ID.");
    if (payment.status !== "captured") return { status: "pending" as const, paymentId: data.paymentId };
    const { error: updateError } = await supabaseAdmin.from("programme_payments")
      .update({ status: "paid", razorpay_payment_id: data.paymentId, paid_at: new Date().toISOString() }).eq("id", row.id);
    if (updateError) throw new Error("Your payment was received but could not be recorded. Contact us with your payment ID.");
    return { status: "paid" as const, paymentId: data.paymentId };
  });

async function requireAdmin(context: { supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: boolean | null; error: unknown }> }; userId: string }) {
  const { data: admin, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!admin || error) throw new Error("Admin access required.");
}

export const listProgrammePayments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ page: z.number().int().min(0).max(10000) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { data: rows, error, count } = await context.supabase.from("programme_payments").select("*", { count: "exact" })
      .order("created_at", { ascending: false }).range(data.page * 20, data.page * 20 + 19);
    if (error) throw new Error("Payments could not be loaded.");
    return { rows: rows ?? [], count: count ?? 0 };
  });

export const refreshProgrammePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orderId: z.string().regex(/^order_[A-Za-z0-9]{6,40}$/) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { data: row, error } = await context.supabase.from("programme_payments").select("id,amount_paise,status").eq("razorpay_order_id", data.orderId).maybeSingle();
    if (error || !row) throw new Error("Payment not found.");
    const { razorpayRequest } = await import("./razorpay.server");
    const payments = await razorpayRequest<{ items: { id: string; amount: number; currency: string; status: string }[] }>(`/orders/${data.orderId}/payments`);
    const captured = payments.items.find(p => p.status === "captured" && p.amount === row.amount_paise && p.currency === "INR");
    const failed = payments.items.length > 0 && payments.items.every(p => p.status === "failed");
    const next = captured ? "paid" : failed ? "failed" : row.status;
    if (next !== row.status) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: updateError } = await supabaseAdmin.from("programme_payments").update(captured
        ? { status: "paid", razorpay_payment_id: captured.id, paid_at: new Date().toISOString() }
        : { status: next }).eq("id", row.id);
      if (updateError) throw new Error("Payment status could not be saved.");
    }
    return { status: next };
  });
