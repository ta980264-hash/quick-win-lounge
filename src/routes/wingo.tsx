import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GameRoom } from "@/components/GameRoom";

export const Route = createFileRoute("/wingo")({
  head: () => ({ meta: [
    { title: "Win Go — TP LOTTERY" },
    { name: "description", content: "Predict green, violet, red, numbers or big/small in 1, 3 and 5 minute rounds." },
    { property: "og:title", content: "Win Go — TP LOTTERY" },
    { property: "og:description", content: "Color prediction game with 1, 3 and 5 minute rounds." },
  ] }),
  component: () => <AppShell title="Win Go" back nav={false}><GameRoom kind="wingo" /></AppShell>,
});
