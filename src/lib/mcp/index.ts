import { defineMcp } from "@lovable.dev/mcp-js";
import listMarkets from "./tools/list-markets";
import roundHistory from "./tools/round-history";

export default defineMcp({
  name: "tp-lottery-hub",
  title: "TP Lottery Hub",
  version: "0.1.0",
  instructions:
    "Read-only tools for TP Lottery Hub's simulated Up/Down prediction markets (Micro Volatx 30s, Alpha Dynamic 1m, Prime Macro 5m). Use list_markets for live prices and odds, and get_round_history for past results. Player balances and trades are not available.",
  tools: [listMarkets, roundHistory],
});
