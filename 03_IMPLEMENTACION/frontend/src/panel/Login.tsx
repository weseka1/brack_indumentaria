import { MARCA } from "@/marca";
import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2, ArrowRight, KeyRound } from "lucide-react";
import { usePanelAuth, DEMO_EMAIL, DEMO_PASS } from "./auth";

export default function Login() {
  const { authed, signIn } = usePanelAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (authed) return <Navigate to="/panel" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    const r = await signIn(email, pass);
    setBusy(false);
    if (r.ok) nav("/panel"); else setErr(r.error || "No pudimos entrar.");
  };

  const inp = "h-11 w-full rounded-xl border border-graph/15 bg-paper-100 pl-10 pr-3 text-sm text-graph outline-none transition placeholder:text-graph-400 focus:border-brand/60 focus:bg-white focus:ring-2 focus:ring-brand/15";

  return (
    <div className="panel-bg flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-paper-100 p-2.5 shadow-[0_14px_34px_-16px_rgba(22,22,26,0.35)] ring-1 ring-graph/[0.06]">
            <img src={MARCA.logo} alt={MARCA.nombre} className="h-full w-full object-contain" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-graph">Brack <span className="text-brand">Refrigeración</span></h1>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest2 text-brand">Electro y service · Bahía Blanca</p>
        </div>

        <form onSubmit={submit} className="pcard space-y-4 p-6">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-graph-400">Email</label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graph-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={DEMO_EMAIL} className={inp} autoFocus autoComplete="username" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-graph-400">Contraseña</label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graph-400" />
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" className={inp} autoComplete="current-password" />
            </div>
          </div>

          {err && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}

          <button type="submit" disabled={busy}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60">
            {busy ? <Loader2 size={17} className="animate-spin" /> : <>Entrar <ArrowRight size={16} /></>}
          </button>

          <div className="rounded-xl bg-graph/[0.03] px-3 py-2.5 ring-1 ring-inset ring-graph/[0.06]">
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-graph-400">
              <KeyRound size={12} className="text-brand" /> Acceso de demo: <b className="font-semibold text-graph-500">{DEMO_EMAIL}</b> · {DEMO_PASS}
            </p>
            <p className="mt-1 text-center text-[10.5px] leading-snug text-graph-400">{MARCA.demo.nota}</p>
          </div>
        </form>

        <p className="mt-5 text-center text-[11px] text-graph-400">{MARCA.nombre} · {MARCA.direccion}</p>
      </div>
    </div>
  );
}
