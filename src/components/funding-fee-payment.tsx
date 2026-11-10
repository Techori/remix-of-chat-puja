import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmFundingPayment, createFundingPaymentOrder } from "@/lib/razorpay.functions";
import { formatPaise, fundingFee, fundingFeeTotalPaise, payerSchema } from "@/lib/razorpay-payment";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: "payment.failed", cb: (response: { error?: { description?: string } }) => void) => void };
declare global {
  interface Window { Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance }
}

let checkoutScript: Promise<void> | null = null;
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  checkoutScript ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { checkoutScript = null; reject(new Error("The payment window could not load. Check your connection and try again.")); };
    document.body.appendChild(script);
  });
  return checkoutScript;
}

export function FundingFeePayment() {
  const createOrder = useServerFn(createFundingPaymentOrder);
  const confirmPayment = useServerFn(confirmFundingPayment);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paidId, setPaidId] = useState<string | null>(null);
  const total = formatPaise(fundingFeeTotalPaise());

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const parsed = payerSchema.safeParse(form);
    if (!parsed.success) { setMessage(parsed.error.issues[0]?.message ?? "Check your details."); return; }
    setBusy(true);
    try {
      const [order] = await Promise.all([createOrder({ data: parsed.data }), loadCheckout()]);
      if (!window.Razorpay) throw new Error("The payment window could not load. Please try again.");
      const checkout = new window.Razorpay({
        key: order.keyId, order_id: order.orderId, amount: order.amount, currency: order.currency,
        name: "Riloyd", description: "Startup Funding Programme registration fee",
        prefill: { name: parsed.data.name, email: parsed.data.email, contact: parsed.data.phone },
        handler: async (response: RazorpayResponse) => {
          setBusy(true);
          try {
            const result = await confirmPayment({ data: { orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature } });
            if (result.status === "paid") setPaidId(result.paymentId);
            else setMessage(`Payment received and awaiting confirmation. Keep your payment ID: ${result.paymentId}`);
          } catch (error) { setMessage(error instanceof Error ? error.message : "The payment could not be verified."); }
          finally { setBusy(false); }
        },
        modal: { ondismiss: () => { setBusy(false); setMessage("Payment was not completed. You can try again."); } },
      });
      checkout.on("payment.failed", response => setMessage(response.error?.description ?? "The payment failed. No fee was recorded; please try again."));
      checkout.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Payment could not start. Please try again.");
      setBusy(false);
    }
  }

  if (paidId) return <div role="status" className="mt-6 rounded-md border border-primary/40 bg-primary/10 p-5 text-sm">
    <p className="flex items-center gap-2 font-bold"><CheckCircle2 className="text-primary" size={18} /> Payment successful — {total}</p>
    <p className="mt-2 text-muted-foreground">Payment ID: <span className="font-mono font-semibold text-foreground">{paidId}</span>. Please also complete the registration form. Payment does not confirm selection.</p>
  </div>;

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: event.target.value }));
  return <form onSubmit={pay} className="mt-6 grid gap-3 rounded-md border border-border bg-background p-5" aria-label="Pay registration fee online">
    <p className="flex items-center gap-2 text-sm font-extrabold"><CreditCard className="text-primary" size={18} /> Pay registration fee online</p>
    <p className="text-xs text-muted-foreground">₹{fundingFee.amount.toLocaleString("en-IN")}/- + {fundingFee.gstPercent}% GST = <b className="text-foreground">{total}</b> · UPI, cards, netbanking</p>
    <div className="grid gap-1.5"><Label htmlFor="pay-name">Full name</Label><Input id="pay-name" value={form.name} onChange={set("name")} autoComplete="name" /></div>
    <div className="grid gap-1.5"><Label htmlFor="pay-email">Email</Label><Input id="pay-email" type="email" value={form.email} onChange={set("email")} autoComplete="email" /></div>
    <div className="grid gap-1.5"><Label htmlFor="pay-phone">Phone</Label><Input id="pay-phone" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" /></div>
    {message && <p role="alert" className="text-xs text-muted-foreground">{message}</p>}
    <Button type="submit" disabled={busy}>{busy ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={16} />}{busy ? "Please wait…" : `Pay ${total}`}</Button>
    <p className="flex items-start gap-2 text-[11px] leading-snug text-muted-foreground"><ShieldCheck className="mt-0.5 shrink-0 text-primary" size={14} />Secured by Razorpay. Paying the fee does not confirm selection. 50% refund if not selected in screening; T&amp;C apply.</p>
  </form>;
}
