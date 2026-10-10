import { defineTool } from "@lovable.dev/mcp-js";
import { MARKETS, oddsFor, periodOf, priceAt, probUp, targetOf } from "../../market";

export default defineTool({
  name: "list_markets",
  title: "List prediction markets",
  description: "List all Up/Down prediction markets with their live price, round target, odds and time remaining.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
  handler: () => {
    const now = Date.now() / 1000;
    const markets = MARKETS.map((m) => {
      const period = periodOf(m, now);
      const left = Math.max(0, Math.ceil(m.dur - (now - period * m.dur)));
      const target = targetOf(m, period);
      const price = priceAt(m, now);
      const p = probUp(m, price, target, left);
      return {
        id: m.id, name: m.name, symbol: m.symbol, roundSeconds: m.dur, round: period,
        price: +price.toFixed(2), target: +target.toFixed(2), secondsLeft: left,
        upChance: +p.toFixed(3), upOdds: oddsFor(p), downOdds: oddsFor(1 - p),
      };
    });
    return { content: [{ type: "text", text: JSON.stringify(markets, null, 2) }], structuredContent: { markets } };
  },
});
