import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Truck, Store, XCircle, RotateCcw, StickyNote } from "lucide-react";
import { useData } from "@/lib/DataProvider";
import type { EstadoPedido, Pedido } from "@/data/types";
import { fmtARS, fmtFecha } from "@/lib/format";
import { PageHeader } from "../components/PageShell";
import Badge from "../components/Badge";
import Drawer from "../components/Drawer";
import { Btn } from "../components/Controls";
import { useToast } from "../components/Toast";
import { estadoPedido, FLUJO_PEDIDO, canalPedido, medioPagoLabel } from "../ui/estados";
import { cn } from "../ui/cn";
import { useDragScroll } from "../ui/useDragScroll";

const colHeader: Record<string, string> = {
  nuevo: "border-t-brand",
  confirmado: "border-t-sky-500",
  preparando: "border-t-amber-500",
  entregado: "border-t-sea",
  cancelado: "border-t-graph/25",
};

/** "1× Heladera Eslabón de Lujo… +2 más" */
function resumenItems(p: Pedido): string {
  const [primero, ...resto] = p.items;
  if (!primero) return "Sin items";
  const base = `${primero.cantidad}× ${primero.nombre}`;
  return resto.length ? `${base} · +${resto.length} más` : base;
}

export default function Pedidos() {
  const { push } = useToast();
  const { pedidos, updatePedido, getRevendedor } = useData();
  const scrollRef = useDragScroll<HTMLDivElement>();
  const [verCancelados, setVerCancelados] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);
  const [notaDraft, setNotaDraft] = useState("");

  // El drawer resuelve el pedido EN VIVO desde el contexto → refleja cambios al instante.
  const sel = selId ? pedidos.find((p) => p.id === selId) ?? null : null;

  const mover = (id: string, dir: -1 | 1) => {
    const p = pedidos.find((x) => x.id === id);
    if (!p || p.estado === "cancelado") return;
    const idx = FLUJO_PEDIDO.indexOf(p.estado as (typeof FLUJO_PEDIDO)[number]);
    const next = Math.min(Math.max(idx + dir, 0), FLUJO_PEDIDO.length - 1);
    if (next === idx) return;
    updatePedido(id, { estado: FLUJO_PEDIDO[next] as EstadoPedido });
    push(`Pedido movido a "${estadoPedido[FLUJO_PEDIDO[next]].label}"`, "info");
  };

  const cancelar = (p: Pedido) => {
    if (!window.confirm(`¿Cancelar el pedido ${p.id} de ${p.cliente}?`)) return;
    updatePedido(p.id, { estado: "cancelado" });
    push("Pedido cancelado", "info");
  };
  const reactivar = (p: Pedido) => {
    updatePedido(p.id, { estado: "nuevo" });
    push(`Pedido ${p.id} reactivado como "Nuevo"`, "success");
  };

  const abrirDetalle = (p: Pedido) => { setSelId(p.id); setNotaDraft(p.notas ?? ""); };
  const guardarNota = () => {
    if (!sel) return;
    updatePedido(sel.id, { notas: notaDraft.trim() });
    push("Notas guardadas", "success");
  };

  const activos = pedidos.filter((p) => p.estado !== "cancelado");
  const cancelados = pedidos.filter((p) => p.estado === "cancelado");
  const enJuego = useMemo(
    () => activos.filter((p) => p.estado !== "entregado").reduce((a, p) => a + p.total, 0),
    [activos]
  );

  const columnas: string[] = verCancelados ? [...FLUJO_PEDIDO, "cancelado"] : [...FLUJO_PEDIDO];

  return (
    <div>
      <PageHeader
        title="Pedidos"
        subtitle={`${activos.length} pedidos · ${fmtARS(enJuego, { short: true })} por entregar`}
        actions={
          cancelados.length > 0 ? (
            <Btn variant="ghost" onClick={() => setVerCancelados((v) => !v)}>
              <XCircle size={15} /> Cancelados ({cancelados.length}) {verCancelados ? "· ocultar" : ""}
            </Btn>
          ) : undefined
        }
      />

      <div ref={scrollRef} className="no-scrollbar flex cursor-grab select-none gap-4 overflow-x-auto pb-4">
        {columnas.map((etapa) => {
          const cards = pedidos.filter((p) => p.estado === etapa);
          const suma = cards.reduce((a, p) => a + p.total, 0);
          const esCancelado = etapa === "cancelado";
          return (
            <div key={etapa} className="flex w-72 shrink-0 flex-col">
              <div className={cn("rounded-t-xl border border-b-0 border-graph/[0.07] border-t-2 bg-graph/[0.04] px-3 pt-3", colHeader[etapa])}>
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-semibold text-graph">{estadoPedido[etapa].label}{esCancelado ? "s" : ""}</span>
                  <span className="rounded-full bg-graph/[0.08] px-2 py-0.5 text-xs font-bold text-graph-400">{cards.length}</span>
                </div>
                <p className="mt-0.5 pb-2 text-xs font-medium text-graph-400">{fmtARS(suma, { short: true })}</p>
              </div>

              <div className="flex-1 space-y-2.5 rounded-b-xl border border-t-0 border-graph/[0.07] bg-graph/[0.02] p-2.5">
                {cards.length === 0 && (
                  <p className="py-6 text-center text-xs text-graph-400">Sin pedidos</p>
                )}
                {cards.map((p) => {
                  const idx = FLUJO_PEDIDO.indexOf(p.estado as (typeof FLUJO_PEDIDO)[number]);
                  const c = canalPedido[p.canal];
                  return (
                    <div
                      key={p.id}
                      onClick={() => abrirDetalle(p)}
                      className={cn("pcard cursor-pointer p-3 transition hover:border-graph/[0.14]", esCancelado && "opacity-70")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-graph-400">{p.id}</p>
                          <p className="line-clamp-1 text-sm font-semibold text-graph">{p.cliente}</p>
                        </div>
                        {c && <Badge tone={c.tone}>{c.label}</Badge>}
                      </div>

                      <p className="mt-2 line-clamp-2 text-xs leading-snug text-graph-500">{resumenItems(p)}</p>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-display text-base font-semibold text-graph">{fmtARS(p.total, { short: true })}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-graph-400">
                          {p.entrega === "envio" ? <Truck size={12} /> : <Store size={12} />}
                          {p.entrega === "envio" ? "Envío" : "Retiro"}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between border-t border-graph/[0.07] pt-2">
                        <span className="truncate text-[11px] text-graph-400">{fmtFecha(p.fechaISO)}</span>
                        {esCancelado ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); reactivar(p); }}
                            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-graph-400 transition hover:bg-graph/5 hover:text-brand"
                          >
                            <RotateCcw size={12} /> Reactivar
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              disabled={idx === 0}
                              onClick={(e) => { e.stopPropagation(); mover(p.id, -1); }}
                              className="grid h-9 w-9 place-items-center rounded-md text-graph-400 transition hover:bg-graph/5 hover:text-graph disabled:opacity-25"
                              aria-label="Atrás"
                            >
                              <ChevronLeft size={15} />
                            </button>
                            <button
                              disabled={idx === FLUJO_PEDIDO.length - 1}
                              onClick={(e) => { e.stopPropagation(); mover(p.id, 1); }}
                              className="grid h-9 w-9 place-items-center rounded-md text-graph-400 transition hover:bg-graph/5 hover:text-graph disabled:opacity-25"
                              aria-label="Avanzar"
                            >
                              <ChevronRight size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== Detalle del pedido ===== */}
      <Drawer open={!!sel} onClose={() => setSelId(null)}>
        {sel && (
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2 pr-10">
              <h2 className="font-display text-xl font-semibold text-graph">{sel.id}</h2>
              <Badge tone={estadoPedido[sel.estado].tone} dot>{estadoPedido[sel.estado].label}</Badge>
              {canalPedido[sel.canal] && <Badge tone={canalPedido[sel.canal].tone}>{canalPedido[sel.canal].label}</Badge>}
            </div>
            <p className="mt-1 text-sm text-graph-400">{fmtFecha(sel.fechaISO)}</p>

            {/* cliente */}
            <div className="mt-5 rounded-xl border border-graph/[0.07] bg-graph/[0.03] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-graph-400">Cliente</p>
              <p className="mt-1 font-semibold text-graph">{sel.cliente}</p>
              <p className="text-sm text-graph-500">{sel.contacto}</p>
              {sel.revendedorId && (
                <p className="mt-1.5 text-xs text-amber-700">
                  Pedido del portal mayorista · {getRevendedor(sel.revendedorId)?.razon ?? sel.revendedorId}
                </p>
              )}
            </div>

            {/* items */}
            <div className="mt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-graph-400">Items</p>
              <div className="overflow-hidden rounded-xl border border-graph/[0.07]">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-graph/[0.07]">
                    {sel.items.map((it, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-graph">{it.nombre}</p>
                          <p className="text-xs text-graph-400">{it.cantidad} × {fmtARS(it.precioUnit)}</p>
                        </td>
                        <td className="px-3 py-2.5 text-right font-display font-semibold text-graph">
                          {fmtARS(it.cantidad * it.precioUnit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-graph/[0.03]">
                      <td className="px-3 py-2.5 font-semibold text-graph">Total</td>
                      <td className="px-3 py-2.5 text-right font-display text-base font-semibold text-graph">{fmtARS(sel.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* entrega + pago */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-graph/[0.07] bg-graph/[0.03] px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-graph-400">
                  {sel.entrega === "envio" ? <Truck size={13} /> : <Store size={13} />} Entrega
                </p>
                <p className="mt-0.5 text-sm font-medium text-graph">
                  {sel.entrega === "envio" ? "Envío a domicilio" : "Retiro por el local"}
                </p>
                {sel.direccion && <p className="text-xs text-graph-400">{sel.direccion}</p>}
              </div>
              <div className="rounded-xl border border-graph/[0.07] bg-graph/[0.03] px-3 py-2.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-graph-400">Medio de pago</p>
                <p className="mt-0.5 text-sm font-medium text-graph">{medioPagoLabel[sel.medioPago] ?? sel.medioPago}</p>
                {sel.cuotas && <p className="text-xs text-graph-400">{sel.cuotas} cuotas sin interés de {fmtARS(Math.round(sel.total / sel.cuotas))}</p>}
              </div>
            </div>

            {/* notas */}
            <div className="mt-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-graph-400">
                <StickyNote size={12} /> Notas internas
              </p>
              <textarea
                value={notaDraft}
                onChange={(e) => setNotaDraft(e.target.value)}
                rows={3}
                placeholder="Coordinación de entrega, aclaraciones del pago…"
                className="w-full resize-y rounded-xl border border-graph/15 bg-paper-100 p-3 text-sm text-graph outline-none transition placeholder:text-graph-400 focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
              />
              {notaDraft.trim() !== (sel.notas ?? "").trim() && (
                <Btn variant="primary" onClick={guardarNota} className="mt-2 h-9 px-3 text-xs">Guardar notas</Btn>
              )}
            </div>

            {/* estado */}
            {sel.estado !== "cancelado" ? (
              <div className="mt-5 border-t border-graph/[0.07] pt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-graph-400">Mover de estado</p>
                <div className="flex flex-wrap items-center gap-2">
                  {FLUJO_PEDIDO.map((e) => (
                    <button
                      key={e}
                      onClick={() => { if (e !== sel.estado) { updatePedido(sel.id, { estado: e as EstadoPedido }); push(`Pedido movido a "${estadoPedido[e].label}"`, "info"); } }}
                      className={cn(
                        "inline-flex h-9 items-center rounded-lg border px-3 text-xs font-semibold transition",
                        e === sel.estado
                          ? "border-transparent bg-brand text-white"
                          : "border-graph/15 text-graph-500 hover:border-brand/40 hover:text-brand"
                      )}
                    >
                      {estadoPedido[e].label}
                    </button>
                  ))}
                  <button
                    onClick={() => cancelar(sel)}
                    className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg border border-graph/15 px-3 text-xs font-semibold text-graph-400 transition hover:border-red-400/40 hover:text-red-600"
                  >
                    <XCircle size={13} /> Cancelar pedido
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 border-t border-graph/[0.07] pt-4">
                <Btn variant="ghost" onClick={() => reactivar(sel)}>
                  <RotateCcw size={15} /> Reactivar como "Nuevo"
                </Btn>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
