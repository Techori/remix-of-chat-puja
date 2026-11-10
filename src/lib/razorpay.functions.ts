import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fundingFeeTotalPaise, payerSchema, paymentResultSchema, zohoResultSchema } from "./razorpay-payment";

// Which online methods are ready; exposes only booleans, never credentials.
export const getPaymentOptions = createServerFn({ method: "GET" }).handler(async () => {
  const { zohoConfigured } = await import("./zoho-payments.server");
  return { razorpay: Boolean(process.env["RAZORPAY_KEY_ID"] && process.env["RAZORPAY_KEY_SECRET"]), zoho: zohoConfigured() };
});

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
      body: { amount, currency: "INR", receipt, notes: { programme: "Startup Funding Programme" } },
    });
    if (order.amount !== amount || order.currency !== "INR") throw new Error("The payment could not be prepared. Please try again.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("programme_payments").insert({
      programme: "funding_programme", provider: "razorpay", payer_name: data.name, payer_email: data.email, payer_phone: data.phone,
      amount_paise: amount, currency: "INR", provider_reference: order.id,
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
    const { data: row, error } = await supabaseAdmin.from("programme_payments").select("id,amount_paise").eq("provider", "razorpay").eq("provider_reference", data.orderId).maybeSingle();
    if (error || !row) throw new Error("The payment could not be matched. Contact us with your payment ID.");
    const payment = await razorpayRequest<{ order_id: string; amount: number; currency: string; status: string }>(`/payments/${data.paymentId}`);
    if (payment.order_id !== data.orderId || payment.amount !== row.amount_paise || payment.currency !== "INR") throw new Error("The payment details do not match. Contact us with your payment ID.");
    if (payment.status !== "captured") return { status: "pending" as const, paymentId: data.paymentId };
    const { error: updateError } = await supabaseAdmin.from("programme_payments")
      .update({ status: "paid", provider_payment_id: data.paymentId, paid_at: new Date().toISOString() }).eq("id", row.id);
    if (updateError) throw new Error("Your payment was received but could not be recorded. Contact us with your payment ID.");
    return { status: "paid" as const, paymentId: data.paymentId };
  });

export const createZohoFundingPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => payerSchema.parse(input))
  .handler(async ({ data }) => {
    const { limitSubmission } = await import("./submissions.server");
    const { zohoCredentials, zohoRequest } = await import("./zoho-payments.server");
    const { accountId, apiKey } = zohoCredentials();
    await limitSubmission(data.email);
    const amount = fundingFeeTotalPaise();
    const rupees = (amount / 100).toFixed(2);
    const reference = `FP-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
    const created = await zohoRequest<{ payments_session: { payments_session_id: string; amount: string; currency: string } }>("/paymentsessions", {
      method: "POST",
      body: { amount: Number(rupees), currency: "INR", description: "Startup Funding Programme registration fee", reference_number: reference, meta_data: [{ key: "programme", value: "funding_programme" }] },
    });
    const session = created.payments_session;
    const { rupeesToPaise } = await import("./zoho-payments.server");
    if (rupeesToPaise(session.amount) !== amount || session.currency !== "INR") throw new Error("The payment could not be prepared. Please try again.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("programme_payments").insert({
      programme: "funding_programme", provider: "zoho", payer_name: data.name, payer_email: data.email, payer_phone: data.phone,
      amount_paise: amount, currency: "INR", provider_reference: session.payments_session_id,
    });
    if (error) throw new Error("The payment could not be prepared. Please try again.");
    return { sessionId: session.payments_session_id, accountId, apiKey, amount: rupees, reference };
  });

export const confirmZohoFundingPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => zohoResultSchema.parse(input))
  .handler(async ({ data }) => {
    const { zohoRequest, rupeesToPaise } = await import("./zoho-payments.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("programme_payments").select("id,amount_paise").eq("provider", "zoho").eq("provider_reference", data.sessionId).maybeSingle();
    if (error || !row) throw new Error("The payment could not be matched. Contact us with your payment ID.");
    // Status is confirmed with Zoho directly, so a forged browser response cannot mark a payment as paid.
    const { payment } = await zohoRequest<{ payment: { payments_session_id: string; amount: string; currency: string; status: string } }>(`/payments/${data.paymentId}`);
    if (payment.payments_session_id !== data.sessionId || rupeesToPaise(payment.amount) !== row.amount_paise || payment.currency !== "INR") throw new Error("The payment details do not match. Contact us with your payment ID.");
    if (payment.status !== "succeeded") return { status: "pending" as const, paymentId: data.paymentId };
    const { error: updateError } = await supabaseAdmin.from("programme_payments")
      .update({ status: "paid", provider_payment_id: data.paymentId, paid_at: new Date().toISOString() }).eq("id", row.id);
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
    const { data: rows, error, count } = await context.supabase.from("programme_payments")
      .select("id,provider,payer_name,payer_email,payer_phone,amount_paise,currency,provider_reference,provider_payment_id,status,created_at,paid_at", { count: "exact" })
      .order("created_at", { ascending: false }).range(data.page * 20, data.page * 20 + 19);
    if (error) throw new Error("Payments could not be loaded.");
    return { rows: rows ?? [], count: count ?? 0 };
  });

export const refreshProgrammePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { data: row, error } = await context.supabase.from("programme_payments").select("id,provider,provider_reference,amount_paise,status").eq("id", data.id).maybeSingle();
    if (error || !row?.provider_reference) throw new Error("Payment not found.");
    let paidId: string | null = null;
    let failed = false;
    if (row.provider === "zoho") {
      const { zohoRequest, rupeesToPaise } = await import("./zoho-payments.server");
      const { payments_session: session } = await zohoRequest<{ payments_session: { amount: string; currency: string; status: string; payments?: { payment_id: string; status: string }[] } }>(`/paymentsessions/${row.provider_reference}`);
      const success = session.payments?.find(p => p.status === "succeeded");
      if (success && rupeesToPaise(session.amount) === row.amount_paise && session.currency === "INR") paidId = success.payment_id;
      failed = !success && (session.payments?.length ?? 0) > 0 && (session.payments ?? []).every(p => p.status === "failed");
    } else {
      const { razorpayRequest } = await import("./razorpay.server");
      const payments = await razorpayRequest<{ items: { id: string; amount: number; currency: string; status: string }[] }>(`/orders/${row.provider_reference}/payments`);
      const captured = payments.items.find(p => p.status === "captured" && p.amount === row.amount_paise && p.currency === "INR");
      if (captured) paidId = captured.id;
      failed = !captured && payments.items.length > 0 && payments.items.every(p => p.status === "failed");
    }
    const next = paidId ? "paid" : failed ? "failed" : row.status;
    if (next !== row.status) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: updateError } = await supabaseAdmin.from("programme_payments")
        .update(paidId ? { status: "paid", provider_payment_id: paidId, paid_at: new Date().toISOString() } : { status: next }).eq("id", row.id);
      if (updateError) throw new Error("Payment status could not be saved.");
    }
    return { status: next };
  });
