import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, UserPlus, Pencil, Trash2, ShoppingCart, Wrench, Package, ChevronRight } from "lucide-react";
import { useData } from "@/lib/DataProvider";
import type { Cliente, TipoCliente } from "@/data/types";
import { fmtARS, fmtFecha } from "@/lib/format";
import { hoyISO } from "@/lib/fechas";
import { PageHeader, EmptyState } from "../components/PageShell";
import { SearchInput, Segmented, Btn } from "../components/Controls";
import Select from "@/components/Select";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import Drawer from "../components/Drawer";
import { useToast } from "../components/Toast";
import { tipoCliente, estadoPedido, estadoOrden } from "../ui/estados";

const INP = "h-10 w-full rounded-xl border border-graph/15 bg-paper-100 px-3 text-sm text-graph outline-none transition placeholder:text-graph-400 focus:border-brand/60 focus:bg-white focus:ring-2 focus:ring-brand/15";

const BLANK = { nombre: "", tipo: "minorista", telefono: "", email: "", localidad: "Bahía Blanca", notas: "" };
type FormState = typeof BLANK;

function toForm(c: Cliente): FormState {
  return { nombre: c.nombre, tipo: c.tipo, telefono: c.telefono, email: c.email, localidad: c.localidad, notas: c.notas ?? "" };
}

function datosDesdeForm(form: FormState) {
  return {
    nombre: form.nombre.trim(),
    tipo: form.tipo as TipoCliente,
    telefono: form.telefono.trim(),
    email: form.email.trim(),
    localidad: form.localidad.trim(),
    notas: form.notas.trim(),
  };
}

export default function Clientes() {
  const { push } = useToast();
  const { clientes: allClientes, pedidos, ordenes, addCliente, updateCliente, deleteCliente } = useData();
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [selId, setSelId] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [nuevo, setNuevo] = useState(false);
  const [form, setForm] = useState<FormState>(BLANK);
  const [notaDraft, setNotaDraft] = useState("");
  const setF = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // La ficha resuelve el cliente EN VIVO desde el contexto.
  const sel = selId ? allClientes.find((c) => c.id === selId) ?? null : null;
  useEffect(() => { if (sel) setNotaDraft(sel.notas ?? ""); }, [sel?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const guardarCliente = () => {
    if (!form.nombre.trim()) { push("Poné al menos el nombre del cliente", "info"); return; }
    const c: Cliente = {
      id: "CLI-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
      ...datosDesdeForm(form),
      equipos: [],
      comprasARS: 0,
      operaciones: 0,
      desdeISO: hoyISO(),
    };
    addCliente(c);
    push("Cliente agregado", "success");
    setForm(BLANK); setNuevo(false);
  };

  const empezarEdicion = () => {
    if (!sel) return;
    setForm(toForm(sel));
    setEditando(true);
  };

  const guardarEdicion = () => {
    if (!sel) return;
    if (!form.nombre.trim()) { push("Poné al menos el nombre del cliente", "info"); return; }
    updateCliente(sel.id, datosDesdeForm(form));
    setEditando(false);
    push("Cambios guardados", "success");
  };

  const guardarNota = () => {
    if (!sel) return;
    updateCliente(sel.id, { notas: notaDraft.trim() });
    push("Notas guardadas", "success");
  };

  const borrarCliente = () => {
    if (!sel) return;
    if (!window.confirm(`¿Eliminar a ${sel.nombre} de la cartera de clientes?`)) return;
    deleteCliente(sel.id);
    push("Cliente eliminado", "success");
    setSelId(null); setEditando(false);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: allClientes.length };
    (["minorista", "mayorista", "service"] as const).forEach(
      (t) => (c[t] = allClientes.filter((x) => x.tipo === t).length)
    );
    return c;
  }, [allClientes]);

  const filtrados = useMemo(
    () =>
      allClientes
        .filter((c) => (tipo === "todos" ? true : c.tipo === tipo))
        .filter((c) => (q ? `${c.nombre} ${c.localidad} ${c.email} ${c.telefono}`.toLowerCase().includes(q.toLowerCase()) : true))
        .sort((a, b) => b.comprasARS - a.comprasARS),
    [allClientes, q, tipo]
  );

  // Historial cruzado REAL: los pedidos y órdenes de este cliente, desde el provider.
  const pedidosDe = sel ? pedidos.filter((p) => p.clienteId === sel.id) : [];
  const ordenesDe = sel ? ordenes.filter((o) => o.clienteId === sel.id) : [];

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={`${allClientes.length} clientes · venta y service, una sola historia`}
        actions={
          <Btn variant="primary" onClick={() => { setForm(BLANK); setNuevo(true); }}>
            <UserPlus size={16} /> Nuevo cliente
          </Btn>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={tipo}
          onChange={setTipo}
          options={[
            { value: "todos", label: "Todos", count: counts.todos },
            { value: "minorista", label: "Minoristas", count: counts.minorista },
            { value: "mayorista", label: "Mayoristas", count: counts.mayorista },
            { value: "service", label: "Service", count: counts.service },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Buscar cliente…" className="w-full sm:w-72" />
      </div>

      {filtrados.length === 0 ? (
        <EmptyState msg="No hay clientes con esos filtros." />
      ) : (
        <div className="pcard overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-graph/[0.07] bg-graph/[0.03] text-left text-xs font-semibold uppercase tracking-wide text-graph-400">
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Localidad</th>
                  <th className="px-5 py-3 text-right">Compras</th>
                  <th className="px-5 py-3 text-center">Operaciones</th>
                  <th className="px-5 py-3">Desde</th>
                  <th className="px-5 py-3 text-right" aria-label="Abrir" />
                </tr>
              </thead>
              <tbody className="divide-y divide-graph/[0.07]">
                {filtrados.map((c) => {
                  const t = tipoCliente[c.tipo];
                  return (
                    <tr key={c.id} onClick={() => { setSelId(c.id); setEditando(false); }} className="cursor-pointer transition hover:bg-graph/[0.03]">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-graph/[0.06] font-display text-sm font-semibold text-graph ring-1 ring-inset ring-graph/10">
                            {c.nombre.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                          </span>
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-semibold text-graph">{c.nombre}</p>
                            <p className="text-xs text-graph-400">{c.telefono || c.email || c.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><Badge tone={t.tone}>{t.label}</Badge></td>
                      <td className="px-5 py-3.5 text-graph-500">{c.localidad}</td>
                      <td className="px-5 py-3.5 text-right font-display font-semibold text-graph">{c.comprasARS ? fmtARS(c.comprasARS, { short: true }) : "—"}</td>
                      <td className="px-5 py-3.5 text-center text-graph-500">{c.operaciones}</td>
                      <td className="px-5 py-3.5 text-graph-400">{new Date(c.desdeISO + "T12:00:00").getFullYear()}</td>
                      <td className="px-5 py-3.5 text-right"><ChevronRight size={15} className="inline text-graph-400" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== Ficha del cliente ===== */}
      <Drawer open={!!sel} onClose={() => { setSelId(null); setEditando(false); }}>
        {sel && (
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2 pr-10">
              <h2 className="font-display text-xl font-semibold text-graph">{sel.nombre}</h2>
              <Badge tone={tipoCliente[sel.tipo].tone}>{tipoCliente[sel.tipo].label}</Badge>
            </div>
            <p className="mt-1 text-sm text-graph-400">Cliente desde {fmtFecha(sel.desdeISO)}</p>

            {!editando ? (
              <>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Info icon={<Phone size={14} />} label="Teléfono" value={sel.telefono || "—"} />
                  <Info icon={<Mail size={14} />} label="Email" value={sel.email || "—"} />
                  <Info icon={<MapPin size={14} />} label="Localidad" value={sel.localidad || "—"} />
                  <Info icon={<ShoppingCart size={14} />} label="Compras históricas" value={sel.comprasARS ? fmtARS(sel.comprasARS) : "—"} />
                </div>

                {/* equipos que le vendimos — el dato de oro cuando llama por una reparación */}
                <div className="mt-4 rounded-xl border border-graph/[0.07] bg-graph/[0.03] p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-graph-400">
                    <Package size={12} className="text-brand" /> Equipos comprados en Brack
                  </p>
                  {sel.equipos.length === 0 ? (
                    <p className="text-sm text-graph-400">Todavía no le vendimos equipos.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {sel.equipos.map((eq, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-graph">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> {eq}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* historial cruzado */}
                <div className="mt-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-graph-400">
                    <ShoppingCart size={12} /> Sus pedidos ({pedidosDe.length})
                  </p>
                  {pedidosDe.length === 0 ? (
                    <p className="rounded-xl bg-graph/[0.02] px-3 py-2.5 text-sm text-graph-400">Sin pedidos registrados.</p>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-graph/[0.07]">
                      <ul className="divide-y divide-graph/[0.07]">
                        {pedidosDe.map((p) => (
                          <li key={p.id}>
                            <Link to="/panel/pedidos" className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-graph/[0.03]">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-graph">{p.id} · {fmtARS(p.total, { short: true })}</p>
                                <p className="truncate text-xs text-graph-400">{fmtFecha(p.fechaISO)} · {p.items.length} item{p.items.length === 1 ? "" : "s"}</p>
                              </div>
                              <Badge tone={estadoPedido[p.estado].tone} dot>{estadoPedido[p.estado].label}</Badge>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-graph-400">
                    <Wrench size={12} /> Sus órdenes de service ({ordenesDe.length})
                  </p>
                  {ordenesDe.length === 0 ? (
                    <p className="rounded-xl bg-graph/[0.02] px-3 py-2.5 text-sm text-graph-400">Sin órdenes registradas.</p>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-graph/[0.07]">
                      <ul className="divide-y divide-graph/[0.07]">
                        {ordenesDe.map((o) => (
                          <li key={o.id}>
                            <Link to="/panel/service" className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-graph/[0.03]">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-graph">{o.id} · {o.equipo}</p>
                                <p className="truncate text-xs text-graph-400">{fmtFecha(o.fechaISO)} · Técnico: {o.tecnico}</p>
                              </div>
                              <Badge tone={estadoOrden[o.estado].tone} dot>{estadoOrden[o.estado].label}</Badge>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* notas */}
                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-graph-400">Notas</p>
                  <textarea
                    value={notaDraft}
                    onChange={(e) => setNotaDraft(e.target.value)}
                    rows={3}
                    placeholder="Preferencias, historial, de dónde lo conocemos…"
                    className="w-full resize-y rounded-xl border border-graph/15 bg-paper-100 p-3 text-sm text-graph outline-none transition placeholder:text-graph-400 focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
                  />
                  {notaDraft.trim() !== (sel.notas ?? "").trim() && (
                    <Btn variant="primary" onClick={guardarNota} className="mt-2 h-9 px-3 text-xs">Guardar notas</Btn>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-graph/[0.07] pt-4">
                  <button
                    onClick={borrarCliente}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-graph-400 transition hover:bg-red-500/10 hover:text-red-600"
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                  <Btn variant="primary" onClick={empezarEdicion} className="h-9 px-3 text-xs">
                    <Pencil size={14} /> Editar datos
                  </Btn>
                </div>
              </>
            ) : (
              <div className="mt-4">
                <ClienteForm form={form} setF={setF} />
                <div className="mt-4 flex items-center justify-end gap-2 border-t border-graph/[0.07] pt-4">
                  <Btn variant="ghost" onClick={() => setEditando(false)}>Cancelar</Btn>
                  <Btn variant="primary" onClick={guardarEdicion}>Guardar cambios</Btn>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ===== Alta de cliente ===== */}
      <Modal
        open={nuevo}
        onClose={() => setNuevo(false)}
        title="Nuevo cliente"
        subtitle="Cargá los datos básicos. Los equipos comprados se van sumando solos con cada venta."
        size="lg"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setNuevo(false)}>Cancelar</Btn>
            <Btn variant="primary" onClick={guardarCliente}>Guardar cliente</Btn>
          </>
        }
      >
        <ClienteForm form={form} setF={setF} />
      </Modal>
    </div>
  );
}

// Formulario reutilizable de alta y edición de cliente.
function ClienteForm({ form, setF }: { form: FormState; setF: (k: keyof FormState, v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nombre o comercio" full>
          <input value={form.nombre} onChange={(e) => setF("nombre", e.target.value)} placeholder="Ej: Marta Iturria / Kiosco El Paso" className={INP} autoFocus />
        </Field>
        <Field label="Tipo de cliente">
          <Select
            value={form.tipo}
            onChange={(v) => setF("tipo", v)}
            options={[
              { value: "minorista", label: "Minorista" },
              { value: "mayorista", label: "Mayorista" },
              { value: "service", label: "Service" },
            ]}
          />
        </Field>
        <Field label="Localidad">
          <input value={form.localidad} onChange={(e) => setF("localidad", e.target.value)} placeholder="Ej: Bahía Blanca" className={INP} />
        </Field>
        <Field label="Teléfono">
          <input value={form.telefono} onChange={(e) => setF("telefono", e.target.value)} placeholder="Ej: 291 436-4529" className={INP} />
        </Field>
        <Field label="Email">
          <input value={form.email} onChange={(e) => setF("email", e.target.value)} placeholder="cliente@mail.com" className={INP} />
        </Field>
      </div>
      <Field label="Notas" full>
        <textarea value={form.notas} onChange={(e) => setF("notas", e.target.value)} rows={3} placeholder="Datos sueltos, preferencias, de dónde lo conocemos…" className={INP + " h-auto resize-y py-2.5"} />
      </Field>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-graph-400">{label}</span>
      {children}
    </label>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-graph/[0.07] bg-graph/[0.03] px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-graph-400">
        {icon} {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium text-graph">{value}</p>
    </div>
  );
}
