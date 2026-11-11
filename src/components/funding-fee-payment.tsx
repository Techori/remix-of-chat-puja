import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmFundingPayment, confirmZohoFundingPayment, createFundingPaymentOrder, createZohoFundingPayment, getPaymentOptions } from "@/lib/razorpay.functions";
import { formatPaise, fundingFee, fundingFeeTotalPaise, payerSchema, paymentProviderLabels, paymentProviders, type PaymentProvider } from "@/lib/razorpay-payment";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: "payment.failed", cb: (response: { error?: { description?: string } }) => void) => void };
type ZohoInstance = { requestPaymentMethod: (options: Record<string, unknown>) => Promise<{ payment_id?: string }>; close: () => Promise<void> | void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
    ZPayments?: new (config: Record<string, unknown>) => ZohoInstance;
  }
}

const scripts = new Map<string, Promise<void>>();
function loadScript(src: string) {
  const existing = scripts.get(src);
  if (existing) return existing;
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { scripts.delete(src); reject(new Error("The payment window could not load. Check your connection and try again.")); };
    document.body.appendChild(script);
  });
  scripts.set(src, promise);
  return promise;
}

export function FundingFeePayment() {
  const options = useServerFn(getPaymentOptions);
  const createOrder = useServerFn(createFundingPaymentOrder);
  const confirmRazorpay = useServerFn(confirmFundingPayment);
  const createZoho = useServerFn(createZohoFundingPayment);
  const confirmZoho = useServerFn(confirmZohoFundingPayment);
  const available = useQuery({ queryKey: ["payment-options"], queryFn: () => options(), staleTime: 5 * 60_000 });
  const enabled = paymentProviders.filter(p => available.data?.[p]);
  const [chosen, setChosen] = useState<PaymentProvider | null>(null);
  const provider = chosen && enabled.includes(chosen) ? chosen : enabled[0];
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paidId, setPaidId] = useState<string | null>(null);
  const total = formatPaise(fundingFeeTotalPaise());

  function settle(result: { status: "paid" | "pending"; paymentId: string }) {
    if (result.status === "paid") setPaidId(result.paymentId);
    else setMessage(`Payment received and awaiting confirmation. Keep your payment ID: ${result.paymentId}`);
  }

  async function payWithRazorpay(payer: { name: string; email: string; phone: string }) {
    const [order] = await Promise.all([createOrder({ data: payer }), loadScript("https://checkout.razorpay.com/v1/checkout.js")]);
    if (!window.Razorpay) throw new Error("The payment window could not load. Please try again.");
    const checkout = new window.Razorpay({
      key: order.keyId, order_id: order.orderId, amount: order.amount, currency: order.currency,
      name: "Riloyd", description: "Startup Funding Programme registration fee",
      prefill: { name: payer.name, email: payer.email, contact: payer.phone },
      handler: async (response: RazorpayResponse) => {
        setBusy(true);
        try { settle(await confirmRazorpay({ data: { orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature } })); }
        catch (error) { setMessage(error instanceof Error ? error.message : "The payment could not be verified."); }
        finally { setBusy(false); }
      },
      modal: { ondismiss: () => { setBusy(false); setMessage("Payment was not completed. You can try again."); } },
    });
    checkout.on("payment.failed", response => setMessage(response.error?.description ?? "The payment failed. No fee was recorded; please try again."));
    checkout.open();
  }

  async function payWithZoho(payer: { name: string; email: string; phone: string }) {
    const [session] = await Promise.all([createZoho({ data: payer }), loadScript("https://static.zohocdn.com/zpay/zpay-js/v1/zpayments.js")]);
    if (!window.ZPayments) throw new Error("The payment window could not load. Please try again.");
    const instance = new window.ZPayments({ account_id: session.accountId, domain: "IN", otherOptions: { api_key: session.apiKey } });
    try {
      const result = await instance.requestPaymentMethod({
        amount: session.amount, currency_code: "INR", currency_symbol: "₹", payments_session_id: session.sessionId,
        business: "Riloyd", description: "Startup Funding Programme registration fee", reference_number: session.reference,
        address: { name: payer.name, email: payer.email, phone: payer.phone },
      });
      if (!result.payment_id) throw new Error("The payment was not completed. You can try again.");
      settle(await confirmZoho({ data: { sessionId: session.sessionId, paymentId: result.payment_id } }));
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      setMessage(code === "widget_closed" ? "Payment was not completed. You can try again." : error instanceof Error ? error.message : "The payment failed. Please try again.");
    } finally {
      await instance.close();
      setBusy(false);
    }
  }

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const parsed = payerSchema.safeParse(form);
    if (!parsed.success) { setMessage(parsed.error.issues[0]?.message ?? "Check your details."); return; }
    if (!provider) return;
    setBusy(true);
    try {
      if (provider === "zoho") await payWithZoho(parsed.data);
      else await payWithRazorpay(parsed.data);
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
    {available.isLoading ? <p className="text-xs text-muted-foreground">Checking payment options…</p>
      : enabled.length === 0 ? <p role="status" className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">Online payment will open soon. Please complete the registration form; our team will share payment details.</p>
      : <>
        {enabled.length > 1 && <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-2 gap-2">{enabled.map(p => <button key={p} type="button" role="radio" aria-checked={provider === p} onClick={() => setChosen(p)} className={`min-h-11 rounded-md border px-3 text-sm font-bold ${provider === p ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"}`}>{paymentProviderLabels[p]}</button>)}</div>}
        <div className="grid gap-1.5"><Label htmlFor="pay-name">Full name</Label><Input id="pay-name" value={form.name} onChange={set("name")} autoComplete="name" /></div>
        <div className="grid gap-1.5"><Label htmlFor="pay-email">Email</Label><Input id="pay-email" type="email" value={form.email} onChange={set("email")} autoComplete="email" /></div>
        <div className="grid gap-1.5"><Label htmlFor="pay-phone">Phone</Label><Input id="pay-phone" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" /></div>
        {message && <p role="alert" className="text-xs text-muted-foreground">{message}</p>}
        <Button type="submit" disabled={busy}>{busy ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={16} />}{busy ? "Please wait…" : `Pay ${total}`}</Button>
        <p className="flex items-start gap-2 text-[11px] leading-snug text-muted-foreground"><ShieldCheck className="mt-0.5 shrink-0 text-primary" size={14} />Secured by {provider ? paymentProviderLabels[provider] : "our payment partner"}. Paying the fee does not confirm selection. 50% refund if not selected in screening; T&amp;C apply.</p>
      </>}
  </form>;
}
