import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Clock, ShieldCheck } from "lucide-react";
import { useStore, money } from "@/lib/store";
import { BottomSheet, btnPrimary } from "./Sheet";
import { blockHeight, colorsOf, isBig, payout, periodLabel, resultFor, selLabel, trxHash, type BetSel, type GameKind } from "@/lib/game";

const DURS = [60, 180, 300];
const dot: Record<string, string> = { green: "bg-win-green", red: "bg-win-red", violet: "bg-win-violet" };

function numBall(n: number) {
  if (n === 0) return "bg-violet-red";
  if (n === 5) return "bg-violet-green";
  return n % 2 ? "bg-win-green" : "bg-win-red";
}

export function GameRoom({ kind }: { kind: GameKind }) {
  const store = useStore();
  const [dur, setDur] = useState(60);
  const [now, setNow] = useState(() => Date.now());
  const [sel, setSel] = useState<BetSel | null>(null);
  const [tab, setTab] = useState<"history" | "mine">("history");

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, []);
  const period = Math.floor(now / 1000 / dur);
  const left = dur - (Math.floor(now / 1000) % dur);
  const locked = left <= 5;

  const lastSettled = useRef<string>("");
  useEffect(() => {
    const key = `${dur}-${period}`;
    if (lastSettled.current === key) return;
    lastSettled.current = key;
    const prev = period - 1;
    const r = resultFor(kind, dur, prev);
    const won = store.settle(kind, dur, prev, r, (b) => payout(b.sel, resultFor(kind, dur, b.period), b.amount));
    if (won > 0) toast.success(`You won ${money(won)}!`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, dur, kind]);

  const history = Array.from({ length: 10 }, (_, i) => { const p = period - 1 - i; return { p, n: resultFor(kind, dur, p) }; });
  const mine = store.bets.filter((b) => b.kind === kind).slice(0, 20);
  const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(left % 60).padStart(2, "0");

  const pick = (s: BetSel) => { if (locked) return toast.error("Betting closed for this period"); setSel(s); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {DURS.map((d) => (
          <button key={d} onClick={() => setDur(d)} className={`flex flex-col items-center gap-1 rounded-xl py-3 text-sm font-semibold transition ${d === dur ? "bg-gradient-red shadow-red text-primary-foreground" : "bg-card text-muted-foreground"}`}>
            <Clock className="h-5 w-5" />{kind === "trx" ? "TRX " : "Win Go "}{d / 60} Min
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-gradient-card border border-border p-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Period</p>
          <p className="truncate font-mono text-sm font-semibold">{periodLabel(dur, period)}</p>
          <div className="mt-2 flex gap-1">{history.slice(0, 5).map((h) => (
            <span key={h.p} className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold text-primary-foreground ${numBall(h.n)}`}>{h.n}</span>
          ))}</div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Time remaining</p>
          <div className="mt-1 flex gap-1 font-display text-3xl font-bold">
            {(mm + ":" + ss).split("").map((c, i) => (
              <span key={i} className={c === ":" ? "" : `rounded-md px-1.5 ${locked ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{c}</span>
            ))}
          </div>
        </div>
      </div>

      {kind === "trx" && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-win-green" />Latest TRX block verification</div>
          <p className="text-xs text-muted-foreground">Block #{blockHeight(dur, period - 1)}</p>
          <p className="break-all font-mono text-xs">{trxHash(dur, period - 1, history[0].n).slice(0, -1)}<span className="rounded bg-primary px-1 text-primary-foreground">{history[0].n}</span></p>
          <p className="mt-1 text-[11px] text-muted-foreground">Result = last digit of the block hash.</p>
        </div>
      )}

      <div className={`relative space-y-3 rounded-2xl border border-border bg-card p-4 ${locked ? "opacity-60" : ""}`}>
        {locked && <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl font-display text-5xl font-bold text-primary">{ss}</div>}
        <div className="grid grid-cols-3 gap-2">
          {(["green", "violet", "red"] as const).map((c) => (
            <button key={c} onClick={() => pick({ t: "color", v: c })} className={`rounded-xl py-3 font-bold capitalize text-primary-foreground ${dot[c]} active:scale-95`}>{c}</button>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2 rounded-xl bg-secondary p-3">
          {Array.from({ length: 10 }, (_, n) => (
            <button key={n} onClick={() => pick({ t: "num", v: n })} className={`aspect-square rounded-full font-display text-2xl font-bold text-primary-foreground ${numBall(n)} active:scale-90`}>{n}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 overflow-hidden rounded-full">
          <button onClick={() => pick({ t: "size", v: "big" })} className="bg-gold py-3 font-bold text-background">Big</button>
          <button onClick={() => pick({ t: "size", v: "small" })} className="bg-primary py-3 font-bold text-primary-foreground">Small</button>
        </div>
      </div>

      <div>
        <div className="mb-2 grid grid-cols-2 gap-2">
          {(["history", "mine"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-xl py-2 text-sm font-semibold ${tab === t ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>{t === "history" ? "Game history" : "My bets"}</button>
          ))}
        </div>
        {tab === "history" ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card text-sm">
            <div className={`grid ${kind === "trx" ? "grid-cols-[1.6fr_1fr_0.8fr_1fr_0.8fr]" : "grid-cols-[2fr_0.8fr_1fr_0.8fr]"} bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground`}>
              <span>Period</span>{kind === "trx" && <span>Hash</span>}<span className="text-center">No.</span><span className="text-center">Size</span><span className="text-center">Color</span>
            </div>
            {history.map((h) => (
              <div key={h.p} className={`grid ${kind === "trx" ? "grid-cols-[1.6fr_1fr_0.8fr_1fr_0.8fr]" : "grid-cols-[2fr_0.8fr_1fr_0.8fr]"} items-center border-t border-border px-3 py-2`}>
                <span className="truncate font-mono text-xs">{periodLabel(dur, h.p).slice(-8)}</span>
                {kind === "trx" && <span className="truncate font-mono text-[10px] text-muted-foreground">**{trxHash(dur, h.p, h.n).slice(-4)}</span>}
                <span className={`text-center font-display text-xl font-bold ${h.n === 0 || h.n === 5 ? "text-win-violet" : h.n % 2 ? "text-win-green" : "text-win-red"}`}>{h.n}</span>
                <span className="text-center text-xs">{isBig(h.n) ? "Big" : "Small"}</span>
                <span className="flex justify-center gap-1">{colorsOf(h.n).map((c) => <span key={c} className={`h-3 w-3 rounded-full ${dot[c]}`} />)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {!mine.length && <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">No bets yet</p>}
            {mine.map((b) => (
              <div key={b.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-card p-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">{selLabel(b.sel)} · {money(b.amount)}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{periodLabel(b.dur, b.period)}</p>
                </div>
                <span className={`text-sm font-bold ${!b.settled ? "text-muted-foreground" : b.won ? "text-win-green" : "text-primary"}`}>
                  {!b.settled ? "Pending" : b.won ? `+${money(b.won)}` : `Lost (${b.result})`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <BetSheet sel={sel} onClose={() => setSel(null)} onConfirm={(amount) => {
        if (!sel) return;
        if (Math.floor(Date.now() / 1000 / dur) !== period || locked) { toast.error("Period closed"); return setSel(null); }
        if (!store.placeBet({ kind, dur, period, sel, amount })) return toast.error("Insufficient balance");
        toast.success(`Bet placed: ${selLabel(sel)} · ${money(amount)}`);
        setSel(null);
      }} />
    </div>
  );
}

function BetSheet({ sel, onClose, onConfirm }: { sel: BetSel | null; onClose: () => void; onConfirm: (amt: number) => void }) {
  const [base, setBase] = useState(10);
  const [qty, setQty] = useState(1);
  const [mult, setMult] = useState(1);
  const total = base * qty * mult;
  return (
    <BottomSheet open={!!sel} onClose={onClose} title={sel ? `Select ${selLabel(sel)}` : ""}>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Balance</p>
          <div className="grid grid-cols-4 gap-2">{[1, 10, 100, 1000].map((v) => (
            <button key={v} onClick={() => setBase(v)} className={`rounded-lg py-2 font-semibold ${base === v ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{v}</button>
          ))}</div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Quantity</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-9 w-9 rounded-lg bg-primary font-bold text-primary-foreground">−</button>
            <input value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))} className="w-14 rounded-lg bg-secondary py-2 text-center" />
            <button onClick={() => setQty(qty + 1)} className="h-9 w-9 rounded-lg bg-primary font-bold text-primary-foreground">+</button>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-1.5">{[1, 5, 10, 20, 50, 100].map((m) => (
          <button key={m} onClick={() => setMult(m)} className={`rounded-lg py-1.5 text-sm font-semibold ${mult === m ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>X{m}</button>
        ))}</div>
        <button className={btnPrimary} onClick={() => onConfirm(total)}>Total {money(total)} · Confirm</button>
      </div>
    </BottomSheet>
  );
}
