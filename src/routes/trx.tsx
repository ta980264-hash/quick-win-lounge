import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GameRoom } from "@/components/GameRoom";

export const Route = createFileRoute("/trx")({
  head: () => ({ meta: [
    { title: "TRX Win Go — TP LOTTERY" },
    { name: "description", content: "Win Go with TRX block hash verification for transparent results." },
    { property: "og:title", content: "TRX Win Go — TP LOTTERY" },
    { property: "og:description", content: "Hash-verified color prediction game." },
  ] }),
  component: () => <AppShell title="TRX Win Go" back nav={false}><GameRoom kind="trx" /></AppShell>,
});
