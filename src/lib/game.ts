export type GameKind = "wingo" | "trx";
export type BetSel =
  | { t: "color"; v: "green" | "red" | "violet" }
  | { t: "num"; v: number }
  | { t: "size"; v: "big" | "small" };

export function seeded(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function resultFor(kind: GameKind, dur: number, period: number) {
  return seeded(`${kind}-${dur}-${period}`) % 10;
}

export function colorsOf(n: number): ("green" | "red" | "violet")[] {
  if (n === 0) return ["red", "violet"];
  if (n === 5) return ["green", "violet"];
  return n % 2 ? ["green"] : ["red"];
}
export const isBig = (n: number) => n >= 5;

export function payout(sel: BetSel, n: number, amount: number) {
  if (sel.t === "num") return sel.v === n ? amount * 9 : 0;
  if (sel.t === "size") return (sel.v === "big") === isBig(n) ? amount * 2 : 0;
  const c = colorsOf(n);
  if (!c.includes(sel.v)) return 0;
  if (sel.v === "violet") return amount * 4.5;
  return c.includes("violet") ? amount * 1.5 : amount * 2;
}

export function periodLabel(dur: number, period: number) {
  const d = new Date(period * dur * 1000);
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `${ymd}${dur}${String(period % 100000).padStart(5, "0")}`;
}

export function trxHash(dur: number, period: number, n: number) {
  let s = "";
  let x = seeded(`hash-${dur}-${period}`);
  for (let i = 0; i < 15; i++) {
    x = Math.imul(x ^ (x >>> 13), 1597334677) >>> 0;
    s += (x % 16).toString(16);
  }
  return `0000000${s}${n}`;
}
export const blockHeight = (dur: number, period: number) => 60000000 + ((period * dur) / 3 | 0) % 9000000;

export function selLabel(s: BetSel) {
  if (s.t === "num") return `Number ${s.v}`;
  return s.v[0].toUpperCase() + s.v.slice(1);
}
