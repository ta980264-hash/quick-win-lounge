import { createFileRoute } from "@tanstack/react-router";
import { TradingScreen } from "@/components/TradingScreen";
import { MARKETS } from "@/lib/market";

export const Route = createFileRoute("/markets/")({
  head: () => ({ meta: [
    { title: "Prediction Markets — TP LOTTERY" },
    { name: "description", content: "Trade Up or Down on Micro Volatx, Alpha Dynamic and Prime Macro with live candlestick charts." },
    { property: "og:title", content: "Prediction Markets — TP LOTTERY" },
    { property: "og:description", content: "Live candlesticks, positions and round history for 30s, 1m and 5m prediction markets." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Markets,
});

function Markets() {
  const m = MARKETS[0];
  if (!m) return null;
  return <TradingScreen m={m} />;
}
