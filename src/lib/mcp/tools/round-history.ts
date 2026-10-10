import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { MARKETS, closeOf, periodOf, resultOf, targetOf } from "../../market";

export default defineTool({
  name: "get_round_history",
  title: "Get round history",
  description: "Get recent finished rounds for one market: target, closing price and whether it closed Up or Down.",
  inputSchema: {
    market: z.enum(["micro", "alpha", "prime"]).describe("Market id: micro (Micro Volatx 30s), alpha (Alpha Dynamic 1m), prime (Prime Macro 5m)."),
    limit: z.number().int().min(1).max(50).default(10).describe("How many recent rounds to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
  handler: ({ market, limit }) => {
    const m = MARKETS.find((x) => x.id === market);
    if (!m) throw new ToolError(`Unknown market ${market}`);
    const current = periodOf(m, Date.now() / 1000);
    const rounds = Array.from({ length: limit }, (_, i) => {
      const p = current - 1 - i;
      return { round: p, target: +targetOf(m, p).toFixed(2), close: +closeOf(m, p).toFixed(2), result: resultOf(m, p) };
    });
    return { content: [{ type: "text", text: JSON.stringify({ market: m.name, rounds }, null, 2) }], structuredContent: { market: m.name, rounds } };
  },
});
