import { createFileRoute, notFound } from "@tanstack/react-router";
import { TradingScreen } from "@/components/TradingScreen";
import { MARKETS } from "@/lib/market";

export const Route = createFileRoute("/markets/$id")({
  loader: ({ params }) => {
    const m = MARKETS.find((x) => x.id === params.id);
    if (!m) throw notFound();
    return m;
  },
  head: ({ loaderData }) => ({ meta: loaderData ? [
    { title: `${loaderData.name} (${loaderData.tag}) — TP LOTTERY` },
    { name: "description", content: `Trade Up or Down on ${loaderData.name} with live candlesticks and ${loaderData.tag} round results.` },
    { property: "og:title", content: `${loaderData.name} — TP LOTTERY` },
    { property: "og:description", content: `Candlestick trading and Up/Down predictions with ${loaderData.tag} rounds.` },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] : [{ title: "Market not found — TP LOTTERY" }, { name: "robots", content: "noindex" }] }),
  component: MarketDetail,
});

function MarketDetail() {
  const m = Route.useLoaderData();
  return <TradingScreen m={m} />;
}
