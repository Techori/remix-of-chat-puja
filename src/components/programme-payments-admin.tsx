import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { listProgrammePayments, refreshProgrammePayment } from "@/lib/razorpay.functions";
import { formatPaise, paymentProviderLabels, type PaymentProvider } from "@/lib/razorpay-payment";

export function ProgrammePaymentsAdmin() {
  const [page, setPage] = useState(0);
  const list = useServerFn(listProgrammePayments);
  const refresh = useServerFn(refreshProgrammePayment);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin-programme-payments", page], queryFn: () => list({ data: { page } }) });
  const mutation = useMutation({
    mutationFn: (id: string) => refresh({ data: { id } }),
    onSuccess: async result => { await queryClient.invalidateQueries({ queryKey: ["admin-programme-payments"] }); toast.success(`Status: ${result.status}`); },
    onError: error => toast.error(error.message),
  });
  const count = query.data?.count ?? 0;
  return <section className="mt-8">
    <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold">Funding Programme payments</h2>
      <Button variant="outline" size="sm" onClick={() => void query.refetch()}><RefreshCw size={14} /> Reload</Button></div>
    <p className="mt-1 text-xs text-muted-foreground">{count} payment attempts · "created" means the payer opened checkout but payment is not confirmed yet.</p>
    {query.isLoading ? <p className="mt-6 text-sm text-muted-foreground">Loading payments…</p>
      : query.error ? <p role="alert" className="mt-6 text-sm">{query.error.message}</p>
      : count === 0 ? <p className="mt-6 text-sm text-muted-foreground">No payments yet.</p>
      : <div className="mt-4 overflow-x-auto rounded-md border border-border"><table className="w-full min-w-[860px] text-left text-sm">
        <thead className="bg-surface text-xs uppercase text-muted-foreground"><tr><th className="p-3">Date</th><th className="p-3">Payer</th><th className="p-3">Amount</th><th className="p-3">Method</th><th className="p-3">Status</th><th className="p-3">Payment ID</th><th className="p-3" /></tr></thead>
        <tbody>{query.data?.rows.map(row => <tr key={row.id} className="border-t border-border align-top">
          <td className="p-3 text-xs">{new Date(row.created_at).toLocaleString("en-IN")}</td>
          <td className="p-3"><p className="font-semibold">{row.payer_name}</p><p className="text-xs text-muted-foreground">{row.payer_email} · {row.payer_phone}</p></td>
          <td className="p-3 font-semibold">{formatPaise(row.amount_paise)}</td>
          <td className="p-3 text-xs">{paymentProviderLabels[row.provider as PaymentProvider] ?? row.provider}</td>
          <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${row.status === "paid" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{row.status}</span></td>
          <td className="p-3 font-mono text-xs">{row.provider_payment_id ?? "—"}<p className="text-muted-foreground">{row.provider_reference}</p></td>
          <td className="p-3">{row.status !== "paid" && <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate(row.id)}>Check status</Button>}</td>
        </tr>)}</tbody></table></div>}
    {count > 20 && <div className="mt-4 flex items-center gap-2"><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></Button><span className="text-xs">Page {page + 1}</span><Button size="sm" variant="outline" disabled={(page + 1) * 20 >= count} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></Button></div>}
  </section>;
}
