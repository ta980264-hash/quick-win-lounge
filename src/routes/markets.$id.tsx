import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BetSheet, MyPositions, PriceChart, marketIcon, useMarketState, useNow } from "@/components/markets";
import { MARKETS, fmtClock, fmtPrice, resultOf, roundLabel, closeOf, type Side } from "@/lib/market";

export const Route = createFileRoute("/markets/$id")({
  loader: ({ params }) => {
    const m = MARKETS.find((x) => x.id === params.id);
    if (!m) throw notFound();
    return { id: m.id, name: m.name, tag: m.tag };
  },
  head: ({ loaderData }) => ({ meta: loaderData ? [
    { title: `${loaderData.name} (${loaderData.tag}) — TP LOTTERY` },
    { name: "description", content: `Predict whether ${loaderData.name} closes Up or Down each ${loaderData.tag} round.` },
    { property: "og:title", content: `${loaderData.name} — TP LOTTERY` },
    { property: "og:description", content: `Up/Down prediction market with ${loaderData.tag} rounds.` },
  ] : [{ title: "Market not found" }, { name: "robots", content: "noindex" }] }),
  component: MarketDetail,
});

function MarketDetail() {
  const { id } = Route.useLoaderData();
  const m = MARKETS.find((x) => x.id === id)!;
  const now = useNow(250);
  const st = useMarketState(m, now);
  const [bet, setBet] = useState<{ m: typeof m; side: Side } | null>(null);
  const [tab, setTab] = useState<"history" | "mine">("history");
  const Icon = marketIcon[m.id];
  const diff = st.price - st.target;
  const pct = (st.left / m.dur) * 100;
  const history = Array.from({ length: 12 }, (_, i) => st.period - 1 - i);

  return (
    <AppShell title={m.name} back nav={false}>
      <div className="space-y-4 pb-24">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-red shadow-red"><Icon className="h-6 w-6 text-primary-foreground" /></div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{m.symbol} · Round {roundLabel(m, st.period)}</p>
            <p className="font-display text-3xl font-bold tabular-nums">${fmtPrice(st.price)}</p>
            <p className={`text-sm font-semibold tabular-nums ${diff >= 0 ? "text-win-green" : "text-win-red"}`}>{diff >= 0 ? "▲" : "▼"} {fmtPrice(Math.abs(diff))} vs target</p>
          </div>
          <div className="relative ml-auto grid h-16 w-16 shrink-0 place-items-center">
            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90"><circle cx="18" cy="18" r="16" fill="none" stroke="var(--secondary)" strokeWidth="3" /><circle cx="18" cy="18" r="16" fill="none" stroke={st.locked ? "var(--primary)" : "var(--gold)"} strokeWidth="3" strokeDasharray={`${pct} 100`} pathLength={100} strokeLinecap="round" /></svg>
            <span className="text-sm font-bold tabular-nums">{fmtClock(st.left)}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-gradient-card p-4">
          <PriceChart m={m} now={now} />
          <div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>Target <b className="text-gold tabular-nums">${fmtPrice(st.target)}</b></span><span>${(st.vol / 1000).toFixed(2)}K Vol.</span></div>
        </div>

        <div className="overflow-hidden rounded-full bg-secondary">
          <div className="flex h-8 text-xs font-bold">
            <div className="flex items-center bg-win-green/80 pl-3 transition-all duration-500" style={{ width: `${st.pUp * 100}%` }}>UP {Math.round(st.pUp * 100)}%</div>
            <div className="flex flex-1 items-center justify-end bg-win-red/80 pr-3">{Math.round((1 - st.pUp) * 100)}% DOWN</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["history", "mine"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-xl py-2 text-sm font-semibold ${tab === t ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>{t === "history" ? "Round history" : "My positions"}</button>
          ))}
        </div>
        {tab === "history" ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card text-sm">
            {history.map((p) => {
              const r = resultOf(m, p);
              return (
                <div key={p} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-border px-4 py-2.5 last:border-0">
                  <span className="truncate font-mono text-xs text-muted-foreground">{roundLabel(m, p)}</span>
                  <span className="text-xs tabular-nums">${fmtPrice(closeOf(m, p))}</span>
                  <span className={`flex w-16 items-center justify-end gap-1 text-xs font-bold ${r === "up" ? "text-win-green" : "text-win-red"}`}>{r === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}{r.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        ) : <MyPositions marketId={m.id} />}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto grid max-w-md grid-cols-2 gap-3 border-t border-border bg-surface/95 p-4 backdrop-blur">
        <button disabled={st.locked} onClick={() => setBet({ m, side: "up" })} className="rounded-xl bg-win-green py-3 font-bold text-primary-foreground active:scale-95 disabled:opacity-40">Up · {st.upOdds.toFixed(2)}x</button>
        <button disabled={st.locked} onClick={() => setBet({ m, side: "down" })} className="rounded-xl bg-win-red py-3 font-bold text-primary-foreground active:scale-95 disabled:opacity-40">Down · {st.downOdds.toFixed(2)}x</button>
      </div>
      <BetSheet bet={bet} onClose={() => setBet(null)} />
    </AppShell>
  );
}
