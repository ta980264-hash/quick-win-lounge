import { useEffect, useRef, useState } from "react";
import type { IChartApi, ISeriesApi, IPriceLine, UTCTimestamp } from "lightweight-charts";
import { priceAt, type Market } from "@/lib/market";

// The chart parser expects RGB colors; resolve the existing OKLCH theme tokens.
function themeColor(token: string) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Chart colors unavailable");
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

export function CandlestickChart({ m, now, target }: { m: Market; now: number; target: number }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ chart: IChartApi; series: ISeriesApi<"Candlestick">; volume: ISeriesApi<"Histogram">; target: IPriceLine; green: string; red: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const step = m.dur === 30 ? 1 : m.dur === 60 ? 2 : 10;

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    setReady(false);
    setFailed(false);
    import("lightweight-charts").then(({ createChart, CandlestickSeries, HistogramSeries, ColorType, LineStyle }) => {
      if (disposed || !host.current) return;
      const green = themeColor("--win-green"), red = themeColor("--win-red");
      const chart = createChart(host.current, {
        autoSize: true,
        localization: { locale: "en-US" },
        layout: { background: { type: ColorType.Solid, color: themeColor("--background") }, textColor: themeColor("--muted-foreground"), fontFamily: "Manrope", fontSize: 10, attributionLogo: true },
        grid: { vertLines: { color: themeColor("--surface") }, horzLines: { color: themeColor("--surface") } },
        rightPriceScale: { borderColor: themeColor("--border"), scaleMargins: { top: 0.08, bottom: 0.25 } },
        timeScale: { borderColor: themeColor("--border"), timeVisible: true, secondsVisible: true, rightOffset: 3, barSpacing: 6 },
      });
      const series = chart.addSeries(CandlestickSeries, { upColor: green, downColor: red, borderVisible: false, wickUpColor: green, wickDownColor: red, priceFormat: { type: "price", precision: 2, minMove: 0.01 } });
      const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "", lastValueVisible: false, priceLineVisible: false });
      volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      const line = series.createPriceLine({ price: target, color: themeColor("--gold"), lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: "Target" });
      api.current = { chart, series, volume, target: line, green, red };
      setReady(true);
      cleanup = () => { api.current = null; chart.remove(); };
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; cleanup(); };
  }, [m.id]);

  useEffect(() => {
    const current = api.current;
    if (!current || !ready) return;
    const bucket = Math.floor(now / step) * step;
    const candles = Array.from({ length: 60 }, (_, i) => {
      const start = bucket - (59 - i) * step;
      const end = Math.min(start + step, now);
      const samples = Array.from({ length: Math.ceil((end - start) * 4) + 1 }, (_, j) => priceAt(m, Math.min(end, start + j / 4)));
      return { time: start as UTCTimestamp, open: priceAt(m, start), high: Math.max(...samples), low: Math.min(...samples), close: priceAt(m, end) };
    });
    current.series.setData(candles);
    current.volume.setData(candles.map((c) => ({ time: c.time, value: Math.abs(c.close - c.open) / m.base * 1000000 + 20, color: c.close >= c.open ? current.green : current.red })));
    current.target.applyOptions({ price: target });
  }, [m, now, target, ready, step]);

  return <div className="relative h-[310px] w-full" aria-label={`${m.name} candlestick chart`}>
    <div ref={host} className="h-full w-full" />
    {!ready && <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">{failed ? "Chart unavailable" : "Loading chart…"}</div>}
  </div>;
}