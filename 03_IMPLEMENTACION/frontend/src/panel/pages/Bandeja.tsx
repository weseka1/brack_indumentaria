import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, UserPlus, Package, Trash2, Pencil, Check, X, Inbox, ClipboardList } from "lucide-react";
import { useData } from "@/lib/DataProvider";
import type { EstadoLead, Lead } from "@/data/types";
import { desde } from "@/lib/format";
import { PageHeader, EmptyState } from "../components/PageShell";
import { FilterSelect, Segmented } from "../components/Controls";
import Badge from "../components/Badge";
import Select from "@/components/Select";
import ChannelIcon from "../components/ChannelIcon";
import BandejaConversaciones from "../components/BandejaConversaciones";
import { useToast } from "../components/Toast";
import { estadoLead, ESTADOS_LEAD, interesLead, canalLabel } from "../ui/estados";
import { cn } from "../ui/cn";

const RESPONSABLES = ["Sin asignar", "Marcos", "Vendedor", "Diego"];

/* La config de la IA vive en el Asistente (localStorage). La bandeja la lee para
   mostrar el estado real de los canales — no inventa conexiones. */
function leerConfigIA(): { nombre: string; activa: boolean; canales: Record<string, boolean> } {
  try {
    const raw = localStorage.getItem("brack_ia_config") ?? localStorage.getItem("yague_ia_config");
    if (raw) {
      const cfg = JSON.parse(raw);
      return {
        nombre: cfg?.nombre || "Camila",
        activa: cfg?.activa !== false,
        canales: cfg?.canales && typeof cfg.canales === "object" ? cfg.canales : { web: true },
      };
    }
  } catch { /* noop */ }
  // Por defecto solo el chat de la propia web está conectado (el único que el sistema controla).
  return { nombre: "Camila", activa: true, canales: { web: true } };
}

export default function Bandeja() {
  const { conversaciones, conversacionesNoLeidas, leads } = useData();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"conversaciones" | "consultas">("conversaciones");
  const ia = useMemo(leerConfigIA, []);

  const teEsperan = conversaciones.filter((c) => c.estado === "vos").length;
  const consultasNuevas = leads.filter((l) => l.estado === "nueva").length;

  return (
    <div>
      <PageHeader
        title="Bandeja"
        subtitle="Todo lo que entra por WhatsApp, Instagram, la web, el mail y el teléfono, ordenado en un solo lugar."
      />

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap gap-1.5 rounded-2xl border border-graph/[0.08] bg-graph/[0.02] p-1.5">
        {([
          { key: "conversaciones", label: "Conversaciones", Icon: Inbox, count: conversacionesNoLeidas },
          { key: "consultas", label: "Consultas", Icon: ClipboardList, count: consultasNuevas },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
              tab === t.key
                ? "bg-brand text-white shadow-[0_8px_18px_-8px_rgba(223,10,10,0.6)]"
                : "text-graph-500 hover:bg-graph/[0.05] hover:text-graph"
            )}
          >
            <t.Icon size={16} /> {t.label}
            {t.count > 0 && (
              <span className={cn("min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold", tab === t.key ? "bg-white/25 text-white" : "bg-brand text-white")}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "conversaciones" && (
        <div className="space-y-4">
          <div className="pcard flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-graph">
                {teEsperan
                  ? `${teEsperan} ${teEsperan === 1 ? "conversación te espera" : "conversaciones te esperan"}`
                  : "Ninguna conversación te espera"}
              </h2>
              <p className="mt-0.5 max-w-2xl text-sm text-graph-500">
                {ia.nombre} responde sola en los canales conectados y te deriva lo que necesita una persona, con el motivo.
                {conversacionesNoLeidas > 0 && <b className="text-graph"> {conversacionesNoLeidas} sin leer.</b>}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sea/10 px-3 py-1 text-[11px] font-semibold text-sea ring-1 ring-inset ring-sea/25">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sea" /> En vivo
            </span>
          </div>

          <BandejaConversaciones
            iaNombre={ia.nombre}
            iaActiva={ia.activa}
            canalesConectados={ia.canales}
            irACanales={() => navigate("/panel/asistente")}
          />
        </div>
      )}

      {tab === "consultas" && <Consultas />}
    </div>
  );
}

/* ===================== Consultas (leads de todos los canales) ===================== */

function Consultas() {
  const { push } = useToast();
  const { leads, getProducto, updateLead, deleteLead } = useData();
  const [estado, setEstado] = useState("todos");
  const [canal, setCanal] = useState("todos");
  const [interes, setInteres] = useState("todos");
  const [editNota, setEditNota] = useState<string | null>(null);
  const [notaDraft, setNotaDraft] = useState("");

  const setEstadoLead_ = (id: string, nuevo: EstadoLead) => {
    updateLead(id, { estado: nuevo });
    push(`Consulta movida a "${estadoLead[nuevo].label}"`, "info");
  };
  const setAsignado = (id: string, asignado: string) => {
    updateLead(id, { asignado });
    push(asignado === "Sin asignar" ? "Consulta sin asignar" : `Consulta asignada a ${asignado}`, "success");
  };
  const eliminar = (l: Lead) => {
    if (window.confirm(`¿Eliminar la consulta de ${l.nombre}? No se puede deshacer.`)) {
      deleteLead(l.id);
      push("Consulta eliminada", "success");
    }
  };
  const empezarNota = (l: Lead) => { setEditNota(l.id); setNotaDraft(l.notas); };
  const guardarNota = (l: Lead) => {
    updateLead(l.id, { notas: notaDraft.trim() });
    setEditNota(null);
    push("Nota guardada", "success");
  };

  const filtrados = useMemo(
    () =>
      leads
        .filter((l) => (estado === "todos" ? true : l.estado === estado))
        .filter((l) => (canal === "todos" ? true : l.canal === canal))
        .filter((l) => (interes === "todos" ? true : l.interes === interes))
        .sort((a, b) => +new Date(b.fechaISO) - +new Date(a.fechaISO)),
    [leads, estado, canal, interes]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: leads.length };
    ESTADOS_LEAD.forEach((e) => (c[e] = leads.filter((l) => l.estado === e).length));
    return c;
  }, [leads]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={estado}
          onChange={setEstado}
          options={[
            { value: "todos", label: "Todas", count: counts.todos },
            ...ESTADOS_LEAD.map((e) => ({ value: e, label: estadoLead[e].label, count: counts[e] })),
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            value={interes}
            onChange={setInteres}
            options={[
              { value: "todos", label: "Interés: todos" },
              { value: "producto", label: "Producto" },
              { value: "service", label: "Service" },
              { value: "mayorista", label: "Mayorista" },
            ]}
          />
          <FilterSelect
            value={canal}
            onChange={setCanal}
            options={[
              { value: "todos", label: "Canal: todos" },
              { value: "web", label: "Web propia" },
              { value: "whatsapp", label: "WhatsApp" },
              { value: "instagram", label: "Instagram" },
              { value: "mail", label: "Mail" },
              { value: "telefono", label: "Teléfono" },
            ]}
          />
        </div>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState msg="No hay consultas con esos filtros." />
      ) : (
        <div className="space-y-3">
          {filtrados.map((l) => {
            const prod = l.productoId ? getProducto(l.productoId) : null;
            const e = estadoLead[l.estado];
            const inte = interesLead[l.interes];
            const urgente = l.estado === "nueva" && l.asignado === "Sin asignar";
            const editando = editNota === l.id;
            return (
              <div
                key={l.id}
                className={cn(
                  "pcard p-4 transition",
                  urgente && "border-brand/40 ring-1 ring-inset ring-brand/20"
                )}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <ChannelIcon canal={l.canal} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-graph">{l.nombre}</p>
                        {inte && <Badge tone={inte.tone}>{inte.label}</Badge>}
                        {urgente && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-bold text-brand">
                            <AlertCircle size={11} /> Sin asignar
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-graph-400">
                        {l.contacto} · {canalLabel[l.canal]} · {desde(l.fechaISO)}
                      </p>

                      {editando ? (
                        <div className="mt-2">
                          <textarea
                            value={notaDraft}
                            onChange={(ev) => setNotaDraft(ev.target.value)}
                            rows={2}
                            autoFocus
                            className="w-full resize-y rounded-xl border border-brand/40 bg-paper-100 p-2.5 text-sm text-graph outline-none focus:ring-2 focus:ring-brand/15"
                          />
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <button onClick={() => guardarNota(l)} className="inline-flex h-8 items-center gap-1 rounded-lg bg-brand px-2.5 text-[11px] font-bold text-white transition hover:bg-brand-600">
                              <Check size={12} /> Guardar
                            </button>
                            <button onClick={() => setEditNota(null)} className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold text-graph-400 transition hover:bg-graph/[0.06] hover:text-graph">
                              <X size={12} /> Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1.5 text-sm text-graph-500">
                          {l.notas}
                          <button
                            onClick={() => empezarNota(l)}
                            title="Editar la nota"
                            className="ml-1.5 inline-flex h-6 w-6 -translate-y-px items-center justify-center rounded-md text-graph-400 transition hover:bg-graph/[0.06] hover:text-graph"
                          >
                            <Pencil size={12} />
                          </button>
                        </p>
                      )}

                      {prod && (
                        <Link
                          to={`/producto/${prod.id}`}
                          title="Ver el producto publicado"
                          className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-graph/[0.06] px-2 py-0.5 text-xs font-medium text-graph-500 transition hover:bg-brand/10 hover:text-brand-700"
                        >
                          <Package size={11} className="text-brand" /> {prod.nombre}
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* controles */}
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Badge tone={e.tone} dot>{e.label}</Badge>
                    <Select
                      value={l.estado}
                      onChange={(v) => setEstadoLead_(l.id, v as EstadoLead)}
                      options={ESTADOS_LEAD.map((s) => ({ value: s, label: estadoLead[s].label }))}
                      size="sm"
                      align="right"
                      className="w-36"
                      triggerClassName="font-medium text-graph-500"
                    />
                    <div className="relative w-44">
                      <UserPlus size={13} className="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-graph-400" />
                      <Select
                        value={l.asignado}
                        onChange={(v) => setAsignado(l.id, v)}
                        options={RESPONSABLES.map((r) => ({ value: r, label: r }))}
                        size="sm"
                        align="right"
                        triggerClassName="pl-7 font-medium text-graph-500"
                      />
                    </div>
                    <button
                      onClick={() => eliminar(l)}
                      title="Eliminar consulta"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-graph/10 text-graph-400 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
