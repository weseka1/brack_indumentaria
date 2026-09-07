import { useMemo, useRef, useState, useEffect } from "react";
import {
  Sparkles, Send, Loader2, Copy, Check, KeyRound, Package, Wrench, Inbox, AlertTriangle,
} from "lucide-react";
import { useData } from "@/lib/DataProvider";
import { useToast } from "../components/Toast";
import { PageHeader } from "../components/PageShell";
import { chatCopiloto } from "@/lib/asistente";
import { hoyISO } from "@/lib/fechas";

// ── Copiloto interno de Brack ─────────────────────────────────────────────────
// Chat para Marcos y su equipo que responde SOBRE LOS DATOS REALES del provider:
// pedidos, órdenes de service, stock, consultas y mayorista. El contexto se arma
// por request (JSON compacto en el system), así siempre lee el estado actual.
// Endpoint: chatCopiloto (VITE_CHAT_URL → edge function Supabase, o /api/chat).

const SUGERIDOS = [
  "Resumime el día",
  "¿Qué pedidos hay que preparar hoy?",
  "¿Cuánto vendimos esta semana y por qué canal?",
  "Redactame la respuesta para la consulta de Andrea por la No Frost",
  "¿Qué órdenes de service están para entregar?",
];

type Msg = { role: "user" | "assistant"; content: string };

export default function Asistente() {
  const data = useData();
  const { kpis, pedidos, ordenes, productos, leads, revendedores, getProducto } = data;
  const { push } = useToast();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sinBackend, setSinBackend] = useState(false);
  const [err, setErr] = useState("");
  const [copiado, setCopiado] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  // ── Contexto por request: el estado REAL del negocio, compacto ──────────────
  const buildSystem = (): string => {
    const abiertos = ["nuevo", "confirmado", "preparando"];
    const vivas = ["ingresada", "diagnostico", "presupuestada", "reparacion", "lista"];

    const contexto = {
      fecha: hoyISO(),
      kpis,
      pedidosActivos: pedidos
        .filter((p) => abiertos.includes(p.estado))
        .map((p) => ({
          id: p.id,
          cliente: p.cliente,
          items: p.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(", "),
          total: p.total,
          estado: p.estado,
          canal: p.canal,
        })),
      ordenesService: ordenes
        .filter((o) => vivas.includes(o.estado))
        .map((o) => ({
          id: o.id,
          cliente: o.cliente,
          equipo: o.equipo,
          falla: o.falla,
          estado: o.estado,
          tecnico: o.tecnico,
          ...(o.presupuesto ? { presupuesto: o.presupuesto } : {}),
          ...(o.enGarantia ? { enGarantia: true } : {}),
        })),
      stockBajo: productos
        .filter((p) => p.publicado && p.stock <= 1)
        .map((p) => ({ id: p.id, nombre: p.nombre, stock: p.stock, precio: p.precio })),
      consultasNuevas: leads
        .filter((l) => l.estado === "nueva")
        .map((l) => ({
          nombre: l.nombre,
          interes: l.interes,
          canal: l.canal,
          ...(l.productoId ? { producto: getProducto(l.productoId)?.nombre ?? l.productoId } : {}),
          notas: l.notas,
        })),
      revendedores: revendedores.map((r) => ({ razon: r.razon, saldo: r.saldoCuenta })),
    };

    return `Sos el copiloto interno de Brack Indumentaria (venta de electrodomésticos nuevos y reacondicionados + service técnico con 30 años de oficio, Santa Fe 85, Bahía Blanca). Hablás con Marcos y su equipo, NUNCA con clientes.
Respondés en criollo profesional: directo, corto y con números concretos sacados de los datos. Usá listas solo si ordenan la respuesta. Sin emojis.
Si te piden redactar una respuesta para un cliente, escribila en formal argentino (de usted), cálida y humana, lista para copiar y pegar, firmada "Marcos, Brack Indumentaria".
No inventes NADA: todo sale del JSON de abajo. Si un dato no está, decilo y sugerí dónde verlo en el panel. Los montos están en pesos argentinos (ARS): formatealos como $1.234.567.

DATOS EN VIVO DEL PANEL (JSON):
${JSON.stringify(contexto)}`;
  };

  const enviar = async (textoDirecto?: string) => {
    const q = (textoDirecto ?? input).trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next);
    setInput("");
    setErr("");
    setBusy(true);
    try {
      const text = await chatCopiloto(buildSystem(), next.slice(-16));
      setMsgs([...next, { role: "assistant", content: text || "(sin respuesta)" }]);
      setSinBackend(false);
    } catch (e: any) {
      if (e?.message === "SIN_BACKEND") setSinBackend(true);
      else setErr(e?.message || "No se pudo conectar con el copiloto.");
    } finally {
      setBusy(false);
    }
  };

  const copiar = async (texto: string, i: number) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(i);
      push("Respuesta copiada", "success");
      setTimeout(() => setCopiado(null), 1800);
    } catch {
      push("No se pudo copiar", "info");
    }
  };

  // Pulso del negocio: lo que el copiloto está leyendo ahora mismo.
  const pulso = useMemo(
    () => [
      { icon: Package, label: "Pedidos activos", value: kpis.pedidosActivos },
      { icon: Wrench, label: "Service abiertas", value: kpis.serviceAbiertas },
      { icon: Inbox, label: "Consultas nuevas", value: kpis.consultasNuevas },
      { icon: AlertTriangle, label: "Stock bajo", value: kpis.stockBajo },
    ],
    [kpis]
  );

  return (
    <div>
      <PageHeader
        title="Copiloto IA"
        subtitle="El asistente interno del equipo. Lee los datos reales del panel en el momento: pedidos, service, stock, consultas y mayorista."
      />

      {/* lo que está leyendo ahora */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {pulso.map((m) => (
          <div key={m.label} className="pcard p-4">
            <m.icon size={16} className="text-brand" />
            <p className="mt-2 font-display text-2xl font-semibold text-graph">{m.value}</p>
            <p className="text-xs font-medium text-graph-500">{m.label}</p>
          </div>
        ))}
      </div>

      {/* aviso elegante si no hay backend configurado */}
      {sinBackend && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-graph/[0.08] bg-graph/[0.02] p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
            <KeyRound size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-graph">El copiloto necesita el backend configurado</p>
            <p className="mt-0.5 text-sm text-graph-500">
              Falta la ANTHROPIC_API_KEY en el servidor o la edge function (Supabase secrets). La pantalla ya queda
              lista: apenas se carga la clave en el deploy, responde acá con los datos reales del panel.
            </p>
          </div>
        </div>
      )}

      {/* chat */}
      <div className="pcard mx-auto flex min-h-[420px] max-w-3xl flex-col overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-graph/[0.08] px-5 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">
            <Sparkles size={17} />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-graph">Copiloto de Brack</p>
            <p className="text-[11px] text-graph-400">Responde con los números del panel · redacta respuestas listas para enviar</p>
          </div>
        </div>

        <div ref={scrollRef} className="max-h-[52vh] min-h-[260px] flex-1 space-y-3 overflow-y-auto bg-graph/[0.015] px-4 py-4 md:px-5">
          {msgs.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm text-graph-500">
                Preguntale por ventas, pedidos, service o stock. También redacta respuestas para clientes.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGERIDOS.map((s) => (
                  <button
                    key={s}
                    onClick={() => enviar(s)}
                    className="rounded-full border border-graph/15 px-3.5 py-2 text-xs font-medium text-graph-500 transition hover:border-brand hover:text-brand"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "user" ? (
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-brand px-3.5 py-2 text-sm leading-relaxed text-white">
                  {m.content}
                </div>
              ) : (
                <div className="group max-w-[85%]">
                  <div className="whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-graph/10 bg-paper-100 px-3.5 py-2 text-sm leading-relaxed text-graph">
                    {m.content}
                  </div>
                  <button
                    onClick={() => copiar(m.content, i)}
                    className="mt-1 inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-medium text-graph-400 opacity-0 transition hover:text-graph group-hover:opacity-100"
                  >
                    {copiado === i ? <Check size={12} className="text-sea" /> : <Copy size={12} />}
                    {copiado === i ? "Copiado" : "Copiar"}
                  </button>
                </div>
              )}
            </div>
          ))}

          {busy && (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm border border-graph/10 bg-paper-100 px-3.5 py-2 text-sm text-graph-400">
                <Loader2 size={14} className="animate-spin text-brand" /> Pensando con los datos del panel…
              </div>
            </div>
          )}

          {err && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
        </div>

        {/* sugeridos rápidos cuando ya hay charla */}
        {msgs.length > 0 && !busy && (
          <div className="flex gap-1.5 overflow-x-auto border-t border-graph/[0.06] px-4 py-2 [scrollbar-width:none]">
            {SUGERIDOS.map((s) => (
              <button
                key={s}
                onClick={() => enviar(s)}
                className="shrink-0 rounded-full border border-graph/12 px-3 py-1.5 text-[11px] font-medium text-graph-400 transition hover:border-brand hover:text-brand"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-graph/[0.08] px-4 py-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") enviar();
            }}
            aria-label="Preguntale al copiloto"
            placeholder="Preguntá por ventas, pedidos, service, stock…"
            className="h-11 min-w-0 flex-1 rounded-xl border border-graph/15 bg-paper-100 px-3 text-sm text-graph outline-none transition placeholder:text-graph-400 focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
          />
          <button
            onClick={() => enviar()}
            disabled={busy || !input.trim()}
            aria-label="Enviar"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand text-white transition hover:bg-brand-600 disabled:opacity-40"
          >
            <Send size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
