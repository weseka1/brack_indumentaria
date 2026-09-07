import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Wrench, Clock, CheckCircle2, BadgeCheck, ShieldCheck, ChevronRight, XCircle, Trash2 } from "lucide-react";
import { useData } from "@/lib/DataProvider";
import { hoyISO } from "@/lib/fechas";
import { fmtARS, fmtFecha } from "@/lib/format";
import type { OrdenServicio, EstadoOrden, CategoriaProducto } from "@/data/types";
import { CATEGORIAS_PRODUCTO } from "@/data/types";
import { PageHeader, EmptyState } from "../components/PageShell";
import { Btn, FilterSelect, SearchInput } from "../components/Controls";
import Select from "@/components/Select";
import Badge from "../components/Badge";
import KpiCard from "../components/KpiCard";
import Modal from "../components/Modal";
import Drawer from "../components/Drawer";
import { ICONO_CATEGORIA } from "../components/ProductoThumb";
import { useToast } from "../components/Toast";
import { estadoOrden, FLUJO_ORDEN } from "../ui/estados";
import { cn } from "../ui/cn";

const TECNICOS = ["Marcos", "Diego"];

const inputCls =
  "h-10 w-full rounded-xl border border-graph/10 bg-graph/[0.04] px-3 text-sm text-graph placeholder:text-graph-400 outline-none transition focus:border-brand/60 focus:ring-2 focus:ring-brand/15";

export default function Service() {
  const { push } = useToast();
  const { ordenes, addOrden, updateOrden, deleteOrden } = useData();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("abiertas");
  const [selId, setSelId] = useState<string | null>(null);

  const sel = selId ? ordenes.find((o) => o.id === selId) ?? null : null;

  const cambiarEstado = (id: string, estado: EstadoOrden) => {
    updateOrden(id, { estado });
    push(`Orden movida a "${estadoOrden[estado].label}"`, "info");
  };

  const eliminar = (o: OrdenServicio) => {
    if (!window.confirm(`¿Eliminar la orden ${o.id} de ${o.cliente}? No se puede deshacer.`)) return;
    deleteOrden(o.id);
    setSelId(null);
    push("Orden eliminada", "success");
  };

  const abiertas = ordenes.filter((o) => !["entregada", "cancelada"].includes(o.estado));
  const enTaller = ordenes.filter((o) => ["ingresada", "diagnostico", "reparacion"].includes(o.estado)).length;
  const esperandoOk = ordenes.filter((o) => o.estado === "presupuestada").length;
  const listas = ordenes.filter((o) => o.estado === "lista").length;

  const filtradas = useMemo(() => {
    return [...ordenes]
      .filter((o) => {
        if (filtroEstado === "abiertas") return !["entregada", "cancelada"].includes(o.estado);
        if (filtroEstado === "todas") return true;
        return o.estado === filtroEstado;
      })
      .filter((o) => (q ? `${o.cliente} ${o.equipo} ${o.id}`.toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => +new Date(b.fechaISO) - +new Date(a.fechaISO));
  }, [ordenes, filtroEstado, q]);

  return (
    <div>
      <PageHeader
        title="Service"
        subtitle={`El taller de siempre, ordenado: ${abiertas.length} órdenes abiertas`}
        actions={
          <Btn variant="primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> Nueva orden
          </Btn>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="En el taller" value={`${enTaller}`} icon={Wrench} accent="brand" hint="ingresadas, en diagnóstico o reparación" />
        <KpiCard label="Esperando el OK" value={`${esperandoOk}`} icon={Clock} accent="amber" hint="presupuesto pasado al cliente" />
        <KpiCard label="Listas para entregar" value={`${listas}`} icon={CheckCircle2} accent="sea" hint="avisar al cliente" />
      </div>

      {/* toolbar */}
      <div className="pcard mb-5 flex flex-wrap items-center gap-2.5 p-3">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar por cliente, equipo u orden…" className="min-w-[220px] flex-1" />
        <FilterSelect
          value={filtroEstado}
          onChange={setFiltroEstado}
          options={[
            { value: "abiertas", label: "Abiertas" },
            { value: "todas", label: "Todas" },
            ...FLUJO_ORDEN.map((e) => ({ value: e, label: estadoOrden[e].label })),
            { value: "cancelada", label: "Canceladas" },
          ]}
        />
      </div>

      {filtradas.length === 0 ? (
        <EmptyState msg="No hay órdenes con esos filtros." />
      ) : (
        <div className="pcard overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-graph/[0.07] bg-graph/[0.03] text-left text-xs font-semibold uppercase tracking-wide text-graph-400">
                  <th className="px-5 py-3">Orden</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Equipo</th>
                  <th className="px-5 py-3">Técnico</th>
                  <th className="px-5 py-3 text-right">Presupuesto</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Vínculo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graph/[0.07]">
                {filtradas.map((o) => {
                  const e = estadoOrden[o.estado];
                  const Icon = ICONO_CATEGORIA[o.categoria] ?? Wrench;
                  return (
                    <tr key={o.id} onClick={() => setSelId(o.id)} className="cursor-pointer transition hover:bg-graph/[0.03]">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-graph">{o.id}</p>
                        <p className="text-xs text-graph-400">{fmtFecha(o.fechaISO)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-graph">{o.cliente}</p>
                        <p className="text-xs text-graph-400">{o.contacto}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-2 text-graph-500">
                          <Icon size={15} className="shrink-0 text-graph-400" />
                          <span className="line-clamp-1">{o.equipo}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-graph-500">{o.tecnico}</td>
                      <td className="px-5 py-3.5 text-right font-display font-semibold text-graph">
                        {o.presupuesto ? fmtARS(o.presupuesto) : <span className="font-sans text-xs font-normal text-graph-400">Pendiente</span>}
                      </td>
                      <td className="px-5 py-3.5"><Badge tone={e.tone} dot>{e.label}</Badge></td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-center justify-end gap-1.5">
                          {o.compradoEnAder && <BadgeCheck size={16} className="text-brand" aria-label="Comprado en Brack" />}
                          {o.enGarantia && <ShieldCheck size={16} className="text-sea" aria-label="En garantía" />}
                          <ChevronRight size={15} className="text-graph-400" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== Detalle de la orden ===== */}
      <OrdenDrawer
        orden={sel}
        onClose={() => setSelId(null)}
        onUpdate={(id, patch) => { updateOrden(id, patch); push("Orden actualizada", "success"); }}
        onEstado={cambiarEstado}
        onDelete={eliminar}
      />

      {/* ===== Alta manual ===== */}
      <NuevaOrden
        open={open}
        onClose={() => setOpen(false)}
        nextId={"OS-" + (ordenes.reduce((m, o) => Math.max(m, Number(o.id.replace(/\D/g, "")) || 0), 2200) + 1)}
        onCrear={async (o) => { await addOrden(o); setOpen(false); push(`Orden ${o.id} ingresada`, "success"); }}
      />
    </div>
  );
}

/* ===================== Drawer de la orden ===================== */

function OrdenDrawer({
  orden,
  onClose,
  onUpdate,
  onEstado,
  onDelete,
}: {
  orden: OrdenServicio | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<OrdenServicio>) => void;
  onEstado: (id: string, estado: EstadoOrden) => void;
  onDelete: (o: OrdenServicio) => void;
}) {
  const [f, setF] = useState({ diagnostico: "", presupuesto: "", senia: "", tecnico: "", entregaEstimadaISO: "", notas: "" });
  const [cargadaDe, setCargadaDe] = useState<string | null>(null);

  // Rehidratar el form cuando cambia la orden seleccionada.
  if (orden && cargadaDe !== orden.id) {
    setF({
      diagnostico: orden.diagnostico ?? "",
      presupuesto: orden.presupuesto != null ? String(orden.presupuesto) : "",
      senia: orden.senia != null ? String(orden.senia) : "",
      tecnico: orden.tecnico,
      entregaEstimadaISO: orden.entregaEstimadaISO ?? "",
      notas: orden.notas ?? "",
    });
    setCargadaDe(orden.id);
  }

  if (!orden) return <Drawer open={false} onClose={onClose}><span /></Drawer>;
  const o = orden;
  const e = estadoOrden[o.estado];
  const idx = FLUJO_ORDEN.indexOf(o.estado as (typeof FLUJO_ORDEN)[number]);
  const siguiente = idx >= 0 && idx < FLUJO_ORDEN.length - 1 ? FLUJO_ORDEN[idx + 1] : null;

  const cambios =
    f.diagnostico.trim() !== (o.diagnostico ?? "").trim() ||
    (f.presupuesto === "" ? undefined : Number(f.presupuesto)) !== o.presupuesto ||
    (f.senia === "" ? undefined : Number(f.senia)) !== o.senia ||
    f.tecnico !== o.tecnico ||
    (f.entregaEstimadaISO || undefined) !== o.entregaEstimadaISO ||
    f.notas.trim() !== (o.notas ?? "").trim();

  const guardar = () => {
    onUpdate(o.id, {
      diagnostico: f.diagnostico.trim() || undefined,
      presupuesto: f.presupuesto === "" ? undefined : Number(f.presupuesto),
      senia: f.senia === "" ? undefined : Number(f.senia),
      tecnico: f.tecnico,
      entregaEstimadaISO: f.entregaEstimadaISO || undefined,
      notas: f.notas.trim() || undefined,
    });
  };

  return (
    <Drawer open onClose={onClose}>
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2 pr-10">
          <h2 className="font-display text-xl font-semibold text-graph">{o.id}</h2>
          <Badge tone={e.tone} dot>{e.label}</Badge>
        </div>
        <p className="mt-1 text-sm text-graph-400">Ingresada el {fmtFecha(o.fechaISO)}</p>

        {/* vínculo venta ↔ service — el candado que las cadenas no tienen */}
        {(o.compradoEnAder || o.enGarantia) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {o.compradoEnAder && (
              o.pedidoId ? (
                <Link
                  to="/panel/pedidos"
                  title="Ver el pedido original en Pedidos"
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-[11px] font-semibold text-brand-700 ring-1 ring-inset ring-brand/20 transition hover:bg-brand/15"
                >
                  <BadgeCheck size={13} /> Comprado en Brack · {o.pedidoId}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-[11px] font-semibold text-brand-700 ring-1 ring-inset ring-brand/20">
                  <BadgeCheck size={13} /> Comprado en Brack
                </span>
              )
            )}
            {o.enGarantia && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sea/10 px-3 py-1 text-[11px] font-semibold text-sea ring-1 ring-inset ring-sea/25">
                <ShieldCheck size={13} /> En garantía — sin cargo
              </span>
            )}
          </div>
        )}

        {/* cliente + equipo */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-graph/[0.07] bg-graph/[0.03] px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-graph-400">Cliente</p>
            <p className="mt-0.5 font-medium text-graph">{o.cliente}</p>
            <p className="text-xs text-graph-400">{o.contacto}</p>
          </div>
          <div className="rounded-xl border border-graph/[0.07] bg-graph/[0.03] px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-graph-400">Equipo</p>
            <p className="mt-0.5 font-medium text-graph">{o.equipo}</p>
            <p className="text-xs capitalize text-graph-400">{CATEGORIAS_PRODUCTO.find((c) => c.key === o.categoria)?.label ?? o.categoria}</p>
          </div>
        </div>

        {/* falla */}
        <div className="mt-4 rounded-xl border border-graph/[0.07] bg-graph/[0.03] p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-graph-400">Falla reportada</p>
          <p className="mt-1 text-sm leading-relaxed text-graph">{o.falla}</p>
        </div>

        {/* trabajo del técnico */}
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-graph-400">Diagnóstico del técnico</span>
            <textarea
              value={f.diagnostico}
              onChange={(ev) => setF((s) => ({ ...s, diagnostico: ev.target.value }))}
              rows={2}
              placeholder="Qué se encontró al revisar el equipo…"
              className="w-full resize-y rounded-xl border border-graph/15 bg-paper-100 p-3 text-sm text-graph outline-none transition placeholder:text-graph-400 focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
            />
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-graph-400">Presupuesto (ARS)</span>
              <input value={f.presupuesto} onChange={(ev) => setF((s) => ({ ...s, presupuesto: ev.target.value.replace(/[^\d]/g, "") }))} inputMode="numeric" placeholder="—" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-graph-400">Seña (ARS)</span>
              <input value={f.senia} onChange={(ev) => setF((s) => ({ ...s, senia: ev.target.value.replace(/[^\d]/g, "") }))} inputMode="numeric" placeholder="—" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-graph-400">Técnico</span>
              <Select value={f.tecnico} onChange={(v) => setF((s) => ({ ...s, tecnico: v }))} options={TECNICOS.map((t) => ({ value: t, label: t }))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-graph-400">Entrega estimada</span>
              <input type="date" value={f.entregaEstimadaISO} onChange={(ev) => setF((s) => ({ ...s, entregaEstimadaISO: ev.target.value }))} className={inputCls} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-graph-400">Notas internas</span>
            <textarea
              value={f.notas}
              onChange={(ev) => setF((s) => ({ ...s, notas: ev.target.value }))}
              rows={2}
              placeholder="Avisos, repuestos pedidos, arreglos con el cliente…"
              className="w-full resize-y rounded-xl border border-graph/15 bg-paper-100 p-3 text-sm text-graph outline-none transition placeholder:text-graph-400 focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
            />
          </label>
          {cambios && (
            <Btn variant="primary" onClick={guardar} className="h-9 px-3 text-xs">Guardar cambios</Btn>
          )}
        </div>

        {/* flujo de estados */}
        {o.estado !== "cancelada" && o.estado !== "entregada" && (
          <div className="mt-5 border-t border-graph/[0.07] pt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-graph-400">Flujo de la orden</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {FLUJO_ORDEN.map((paso, i) => (
                <span
                  key={paso}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold",
                    i < idx && "bg-graph/[0.05] text-graph-400",
                    i === idx && "bg-brand text-white",
                    i > idx && "bg-graph/[0.03] text-graph-400 ring-1 ring-inset ring-graph/10"
                  )}
                >
                  {i < idx && <CheckCircle2 size={11} />}
                  {estadoOrden[paso].label}
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {siguiente && (
                <Btn variant="primary" onClick={() => onEstado(o.id, siguiente as EstadoOrden)} className="h-9 px-3 text-xs">
                  Pasar a "{estadoOrden[siguiente].label}" <ChevronRight size={14} />
                </Btn>
              )}
              <Select
                value={o.estado}
                onChange={(v) => onEstado(o.id, v as EstadoOrden)}
                options={[...FLUJO_ORDEN.map((s) => ({ value: s as string, label: estadoOrden[s].label })), { value: "cancelada", label: "Cancelada" }]}
                size="sm"
                className="w-44"
                triggerClassName="font-medium text-graph-500"
              />
              <button
                onClick={() => onEstado(o.id, "cancelada")}
                className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg border border-graph/15 px-3 text-xs font-semibold text-graph-400 transition hover:border-red-400/40 hover:text-red-600"
              >
                <XCircle size={13} /> Cancelar orden
              </button>
            </div>
          </div>
        )}
        {(o.estado === "cancelada" || o.estado === "entregada") && (
          <div className="mt-5 flex items-center justify-between border-t border-graph/[0.07] pt-4">
            <Btn variant="ghost" onClick={() => onEstado(o.id, "ingresada")} className="h-9 px-3 text-xs">Reabrir orden</Btn>
            <button
              onClick={() => onDelete(o)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-graph-400 transition hover:bg-red-500/10 hover:text-red-600"
            >
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        )}
      </div>
    </Drawer>
  );
}

/* ===================== Alta manual ===================== */

function NuevaOrden({ open, onClose, nextId, onCrear }: { open: boolean; onClose: () => void; nextId: string; onCrear: (o: OrdenServicio) => Promise<void> }) {
  const { push } = useToast();
  const vacio = {
    cliente: "", contacto: "", equipo: "", categoria: "heladera" as CategoriaProducto,
    falla: "", tecnico: "Marcos", compradoEnAder: false, pedidoId: "", enGarantia: false,
  };
  const [f, setF] = useState(vacio);
  const set = (k: keyof typeof f, v: any) => setF((p) => ({ ...p, [k]: v }));

  const crear = async () => {
    if (!f.cliente.trim() || !f.equipo.trim()) { push("Poné al menos el cliente y el equipo", "info"); return; }
    const o: OrdenServicio = {
      id: nextId,
      fechaISO: hoyISO(),
      cliente: f.cliente.trim(),
      contacto: f.contacto.trim(),
      equipo: f.equipo.trim(),
      categoria: f.categoria,
      falla: f.falla.trim() || "A revisar en el taller.",
      estado: "ingresada",
      tecnico: f.tecnico,
      compradoEnAder: f.compradoEnAder,
      ...(f.compradoEnAder && f.pedidoId.trim() ? { pedidoId: f.pedidoId.trim().toUpperCase() } : {}),
      enGarantia: f.compradoEnAder ? f.enGarantia : false,
    };
    await onCrear(o);
    setF(vacio);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva orden de service"
      subtitle="El equipo entra al taller con su orden de trabajo"
      size="lg"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" onClick={crear}>Ingresar orden</Btn>
        </>
      }
    >
      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); crear(); }}>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-graph-400">Cliente</span>
          <input className={inputCls} placeholder="Nombre o comercio" value={f.cliente} onChange={(e) => set("cliente", e.target.value)} autoFocus />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-graph-400">Contacto</span>
          <input className={inputCls} placeholder="Teléfono o mail" value={f.contacto} onChange={(e) => set("contacto", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-graph-400">Equipo</span>
          <input className={inputCls} placeholder='Ej: "Heladera Gafa HGF-357 blanca"' value={f.equipo} onChange={(e) => set("equipo", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-graph-400">Categoría</span>
          <Select
            value={f.categoria}
            onChange={(v) => set("categoria", v as CategoriaProducto)}
            options={CATEGORIAS_PRODUCTO.map((c) => ({ value: c.key, label: c.label }))}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-graph-400">Falla reportada</span>
          <textarea className={inputCls + " h-auto resize-y py-2.5"} rows={2} placeholder="Lo que cuenta el cliente…" value={f.falla} onChange={(e) => set("falla", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-graph-400">Técnico</span>
          <Select value={f.tecnico} onChange={(v) => set("tecnico", v)} options={TECNICOS.map((t) => ({ value: t, label: t }))} />
        </label>
        <div className="rounded-xl border border-graph/[0.07] bg-graph/[0.02] p-3 sm:col-span-2">
          <button type="button" onClick={() => set("compradoEnAder", !f.compradoEnAder)} className="flex min-h-[40px] w-full items-center justify-between text-sm text-graph">
            <span className="flex items-center gap-2"><BadgeCheck size={15} className="text-brand" /> El equipo se compró en Brack</span>
            <span className={`relative h-5 w-9 rounded-full transition ${f.compradoEnAder ? "bg-brand" : "bg-graph/15"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${f.compradoEnAder ? "left-[18px]" : "left-0.5"}`} />
            </span>
          </button>
          {f.compradoEnAder && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-graph-400">Pedido original (opcional)</span>
                <input className={inputCls} placeholder="PED-1055" value={f.pedidoId} onChange={(e) => set("pedidoId", e.target.value)} />
              </label>
              <button type="button" onClick={() => set("enGarantia", !f.enGarantia)} className="flex min-h-[40px] items-center justify-between self-end rounded-lg px-1 py-1.5 text-sm text-graph">
                <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-sea" /> Cubierta por garantía</span>
                <span className={`relative ml-3 h-5 w-9 shrink-0 rounded-full transition ${f.enGarantia ? "bg-sea" : "bg-graph/15"}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${f.enGarantia ? "left-[18px]" : "left-0.5"}`} />
                </span>
              </button>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
