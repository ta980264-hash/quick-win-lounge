import { money, type Tx } from "@/lib/store";

export function TxList({ txs }: { txs: Tx[] }) {
  if (!txs.length) return <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">No records yet</p>;
  return (
    <div className="space-y-2">
      {txs.map((t) => (
        <div key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-card p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold capitalize">{t.type} · <span className="font-normal text-muted-foreground">{t.note}</span></p>
            <p className="text-xs text-muted-foreground">{new Date(t.at).toLocaleString()}</p>
          </div>
          <span className={`font-bold ${t.amount >= 0 ? "text-win-green" : "text-primary"}`}>{t.amount >= 0 ? "+" : "−"}{money(Math.abs(t.amount))}</span>
        </div>
      ))}
    </div>
  );
}
