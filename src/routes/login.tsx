import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { btnPrimary, inputCls } from "@/components/Sheet";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Log in or Register — TP LOTTERY" },
    { name: "description", content: "Sign in to TP LOTTERY with your email address." },
    { property: "og:title", content: "Log in — TP LOTTERY" },
    { property: "og:description", content: "Sign in to TP LOTTERY with your email address." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Login,
});

function Login() {
  const { login } = useStore();
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast.error("Enter a valid email"); return; }
    if (pw.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (mode === "register" && pw !== pw2) { toast.error("Passwords do not match"); return; }
    setBusy(true);
    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin + "/login" } });
        if (error) throw error;
        if (!data.session) { toast.success("Check your email to confirm your account, then log in."); setMode("login"); return; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
      }
      login(email.toLowerCase());
      toast.success("Welcome!");
      nav({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      <div className="bg-gradient-red px-6 pb-10 pt-12">
        <h1 className="text-4xl font-bold tracking-wide text-primary-foreground">TP LOTTERY</h1>
        <p className="mt-1 text-sm text-primary-foreground/80">{mode === "login" ? "Log in with your email" : "Create your account"}</p>
      </div>
      <div className="-mt-5 rounded-t-3xl bg-background px-6 pt-6">
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-card p-1">
          {(["login", "register"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-lg py-2 text-sm font-semibold ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{m === "login" ? "Log in" : "Register"}</button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-semibold"><span className="mb-2 flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value.trim())} placeholder="you@example.com" className={inputCls} />
          </label>
          <label className="block text-sm font-semibold"><span className="mb-2 flex items-center gap-2"><Lock className="h-4 w-4 text-primary" />Password</span>
            <div className="relative">
              <input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" className={inputCls} />
              <button type="button" onClick={() => setShow(!show)} aria-label="Toggle password" className="absolute right-3 top-3 text-muted-foreground">{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
            </div>
          </label>
          {mode === "register" && <input type={show ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Confirm password" className={inputCls} />}
          <button disabled={busy} className={btnPrimary}>{busy ? "Please wait…" : mode === "login" ? "Log in" : "Register"}</button>
        </form>
      </div>
    </div>
  );
}
