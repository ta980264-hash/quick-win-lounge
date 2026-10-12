import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNow } from "@/components/markets";
import { MARKETS, fmtPrice, priceAt, targetOf, periodOf, resultOf } from "@/lib/market";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Admin Dashboard — TP LOTTERY" },
    { name: "description", content: "Admin tools for users, transaction requests and market monitoring." },
    { property: "og:title", content: "Admin Dashboard — TP LOTTERY" },
    { property: "og:description", content: "Manage users and review deposit and withdrawal requests." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Admin,
});

type Profile = { id: string; email: string | null; created_at: string };
type Req = { id: string; email: string | null; type: string; amount: number; method: string | null; status: string; created_at: string };

function Admin() {
  const [state, setState] = useState<"loading" | "denied" | "ok">("loading");
  const [tab, setTab] = useState<"users" | "requests" | "markets">("requests");
  const [users, setUsers] = useState<Profile[]>([]);
  const [reqs, setReqs] = useState<Req[]>([]);

  const load = async () => {
    const [u, r] = await Promise.all([
      supabase.from("profiles").select("id,email,created_at").order("created_at", { ascending: false }),
      supabase.from("transaction_requests").select("id,email,type,amount,method,status,created_at").order("created_at", { ascending: false }).limit(200),
    ]);
    setUsers(u.data ?? []); setReqs((r.data ?? []) as Req[]);
  };

  useEffect(() => { (async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setState("denied"); return; }
    const { data: ok } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
    if (!ok) { setState("denied"); return; }
    setState("ok"); load();
  })(); }, []);

  const decide = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("transaction_requests").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(`Request ${status}`); load(); }
  };

  if (state === "loading") return <div className="min-h-screen bg-background" />;
  if (state === "denied") return <div className="mx-auto max-w-md p-6 text-center"><p className="mb-4 text-lg font-bold">Admins only</p><Link to="/login" className="text-primary underline">Log in</Link></div>;

  return <div className="mx-auto min-h-screen max-w-3xl bg-background p-4">
    <div className="mb-4 flex items-center justify-between"><h1 className="text-2xl font-bold">Admin <span className="text-primary">Dashboard</span></h1><Link to="/" className="text-sm text-muted-foreground">Back to app</Link></div>
    <div className="mb-4 grid grid-cols-3 gap-2">
      {(["requests", "users", "markets"] as const).map((t) => <Button key={t} variant={tab === t ? "default" : "secondary"} onClick={() => setTab(t)} className="capitalize">{t}</Button>)}
    </div>

    {tab === "users" && <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{users.length} registered users</p>
      {users.map((u) => <div key={u.id} className="flex justify-between rounded-xl bg-card p-3 text-sm"><span className="truncate">{u.email}</span><span className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</span></div>)}
    </div>}

    {tab === "requests" && <div className="space-y-2">
      {reqs.length === 0 && <p className="text-sm text-muted-foreground">No requests yet.</p>}
      {reqs.map((r) => <div key={r.id} className="rounded-xl bg-card p-3 text-sm">
        <div className="flex justify-between"><span className="font-semibold capitalize">{r.type} · ₹{Number(r.amount).toLocaleString()}</span><span className={r.status === "approved" ? "text-win-green" : r.status === "rejected" ? "text-win-red" : "text-gold"}>{r.status}</span></div>
        <p className="text-xs text-muted-foreground">{r.email} · {r.method} · {new Date(r.created_at).toLocaleString()}</p>
        {r.status === "pending" && <div className="mt-2 grid grid-cols-2 gap-2"><Button size="sm" onClick={() => decide(r.id, "approved")}>Approve</Button><Button size="sm" variant="secondary" onClick={() => decide(r.id, "rejected")}>Reject</Button></div>}
      </div>)}
    </div>}

    {tab === "markets" && <MarketsView />}
  </div>;
}

function MarketsView() {
  const now = useNow(1000);
  return <div className="space-y-2">
    <p className="text-xs text-muted-foreground">View only — prices follow the fixed simulation and cannot be steered.</p>
    {MARKETS.map((m) => {
      const p = periodOf(m, now);
      const price = priceAt(m, now); const target = targetOf(m, p);
      const last = Array.from({ length: 10 }, (_, i) => resultOf(m, p - 1 - i));
      return <div key={m.id} className="rounded-xl bg-card p-3 text-sm">
        <div className="flex justify-between"><span className="font-semibold">{m.name} ({m.tag})</span><span className={price >= target ? "text-win-green" : "text-win-red"}>${fmtPrice(price)}</span></div>
        <p className="text-xs text-muted-foreground">Target ${fmtPrice(target)}</p>
        <div className="mt-2 flex gap-1">{last.map((r, i) => <span key={i} className={`h-3 w-3 rounded-full ${r === "up" ? "bg-win-green" : "bg-win-red"}`} />)}</div>
      </div>;
    })}
  </div>;
}
