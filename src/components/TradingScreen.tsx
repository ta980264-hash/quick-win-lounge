import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Clock3, TrendingDown, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { CandlestickChart } from "@/components/CandlestickChart";
import { BetSheet, MyPositions, marketIcon, useMarketState, useNow } from "@/components/markets";
import { MARKETS, fmtClock, fmtPrice, resultOf, roundLabel, closeOf, type Market, type Side } from "@/lib/market";
import { useStore } from "@/lib/store";

const TABS = [{ id: "position", label: "Position" }, { id: "mine", label: "My History" }, { id: "game", label: "Game History" }] as const;

export function TradingScreen({ m }: { m: Market }) {
  const now = useNow(250);
  const st = useMarketState(m, now);
  const { bets } = useStore();
  const [bet, setBet] = useState<{ m: Market; side: Side } | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("position");
  const diff = st.price - st.target;
  const history = Array.from({ length: 12 }, (_, i) => st.period - 1 - i);
  const openCount = bets.filter((b) => b.kind === m.id && !b.settled).length;

  return <AppShell title="Prediction Markets" back nav={false}>
    <div className="pb-20">
      <div className="grid grid-cols-3 gap-2" aria-label="Select market">
        {MARKETS.map((market) => {
          const Icon = marketIcon[market.id];
          const active = market.id === m.id;
          return <Button key={market.id} asChild variant={active ? "default" : "secondary"} className="h-[96px] min-w-0 px-1.5 shadow-none">
            <Link to="/markets/$id" params={{ id: market.id }} aria-current={active ? "page" : undefined} className="flex flex-col gap-1">
              <Icon className="mb-1" />
              <span className="whitespace-normal text-center text-[11px] font-semibold leading-4">{market.name}</span>
              <span className={`text-xs ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{market.tag}</span>
            </Link>
          </Button>;
        })}
      </div>

      <section className="mt-4 border-y border-border py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{m.symbol}</span><span className="h-1.5 w-1.5 rounded-full bg-win-green" />Live<span className="rounded bg-secondary px-1.5 py-0.5">Demo</span></div>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">${fmtPrice(st.price)}</p>
            <p className={`text-xs font-semibold tabular-nums ${diff >= 0 ? "text-win-green" : "text-win-red"}`}>{diff >= 0 ? "+" : "−"}{fmtPrice(Math.abs(diff))} vs target</p>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground"><Clock3 className="h-3 w-3" />{st.locked ? "Closing" : "Closes in"}</p>
            <p className={`mt-1 font-display text-3xl font-bold tabular-nums ${st.locked ? "text-primary" : "text-gold"}`}>{fmtClock(st.left)}</p>
            <p className="text-[10px] text-muted-foreground">{roundLabel(m, st.period)}</p>
          </div>
        </div>
        <div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>Target <b className="font-semibold text-gold">${fmtPrice(st.target)}</b></span><span>${(st.vol / 1000).toFixed(2)}K Vol.</span></div>
      </section>

      <div className="-mx-4 mt-2"><CandlestickChart key={m.id} m={m} now={now} target={st.target} /></div>
      <div className="my-3 flex items-center gap-3 text-[11px] font-semibold tabular-nums">
        <span className="text-win-green">Up {Math.round(st.pUp * 100)}%</span>
        <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-win-red"><div className="bg-win-green" style={{ width: `${st.pUp * 100}%` }} /></div>
        <span className="text-win-red">Down {Math.round((1 - st.pUp) * 100)}%</span>
      </div>

      <div role="tablist" aria-label="Trading records" className="grid grid-cols-3 border-b border-border">
        {TABS.map((t) => <Button key={t.id} role="tab" aria-selected={tab === t.id} variant="ghost" onClick={() => setTab(t.id)} className={`h-12 rounded-none border-b-2 px-0 text-xs hover:bg-transparent ${tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}>{t.label}{t.id === "position" && openCount > 0 ? ` (${openCount})` : ""}</Button>)}
      </div>
      <div role="tabpanel" aria-label={TABS.find((t) => t.id === tab)?.label} className="mt-3">
        {tab === "game" ? <div className="text-xs">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_64px] gap-3 border-b border-border py-2 text-muted-foreground"><span>Round</span><span>Close price</span><span className="text-right">Result</span></div>
          {history.map((p) => {
            const r = resultOf(m, p);
            return <div key={p} className="grid grid-cols-[minmax(0,1fr)_auto_64px] items-center gap-3 border-b border-border py-3">
              <span className="truncate font-mono text-[10px] text-muted-foreground">{roundLabel(m, p)}</span>
              <span className="tabular-nums">${fmtPrice(closeOf(m, p))}</span>
              <span className={`flex items-center justify-end gap-1 font-bold ${r === "up" ? "text-win-green" : "text-win-red"}`}>{r === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}{r.toUpperCase()}</span>
            </div>;
          })}
        </div> : <MyPositions marketId={m.id} status={tab === "position" ? "open" : "settled"} />}
      </div>
    </div>
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto grid max-w-md grid-cols-2 gap-3 border-t border-border bg-surface/95 p-4 backdrop-blur">
      <Button disabled={st.locked} onClick={() => setBet({ m, side: "up" })} className="h-12 bg-win-green font-bold text-primary-foreground hover:bg-win-green/90"><TrendingUp />Up · {st.upOdds.toFixed(2)}x</Button>
      <Button disabled={st.locked} onClick={() => setBet({ m, side: "down" })} className="h-12 bg-win-red font-bold text-primary-foreground hover:bg-win-red/90"><TrendingDown />Down · {st.downOdds.toFixed(2)}x</Button>
    </div>
    <BetSheet bet={bet} onClose={() => setBet(null)} />
  </AppShell>;
}