import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Store, Plus, Pencil, Wallet, AlertTriangle, Percent, ChevronRight, ShoppingCart, ExternalLink } from "lucide-react";
import { useData } from "@/lib/DataProvider";
import type { Revendedor } from "@/data/types";
import { fmtARS, fmtFecha } from "@/lib/format";
import { hoyISO } from "@/lib/fechas";
import { PageHeader, EmptyState } from "../components/PageShell";
import { Btn, SearchInput } from "../components/Controls";
import Badge from "../components/Badge";
import KpiCard from "../components/KpiCard";
import Modal from "../components/Modal";
import Drawer from "../components/Drawer";
import { useToast } from "../components/Toast";
import { estadoPedido } from "../ui/estados";
import { cn } from "../ui/cn";

const INP = "h-10 w-full rounded-xl border border-graph/15 bg-paper-100 px-3 text-sm text-graph outline-none transition placeholder:text-graph-400 focus:border-brand/60 focus:bg-white focus:ring-2 focus:ring-brand/15";

function Switch({ on, onChange, title }: { on: boolean; onChange: (v: boolean) => void; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => { e.stopPropagation(); onChange(!on); }}
      className={cn("relative h-5 w-9 shrink-0 rounded-full transition", on ? "bg-sea" : "bg-graph/20")}
    >
      <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", on ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}

const BLANK = {
  razon: "", contacto: "", telefono: "", email: "", localidad: "",
  usuario: "", descuentoPct: "15", compraMinima: "400000", saldoCuenta: "0", activo: true,
};
type FormState = typeof BLANK;

function toForm(r: Revendedor): FormState {
  return {
    razon: r.razon, contacto: r.contacto, telefono: r.telefono, email: r.email, localidad: r.localidad,
    usuario: r.usuario, descuentoPct: String(r.descuentoPct), compraMinima: String(r.compraMinima),
    saldoCuenta: String(r.saldoCuenta), activo: r.activo,
  };
}

export default function Mayorista() {
  const { push } = useToast();
  const { revendedores, pedidos, addRevendedor, updateRevendedor } = useData();
  const [q, setQ] = useState("");
  const [selId, setSelId] = useState<string | null>(null);
  const [modal, setModal] = useState<"alta" | "editar" | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const setF = (k: keyof FormState, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const sel = selId ? revendedores.find((r) => r.id === selId) ?? null : null;

  const activos = revendedores.filter((r) => r.activo).length;
  const deudaTotal = revendedores.reduce((a, r) => a + Math.min(r.saldoCuenta, 0), 0);
  const pedidosMayoristas = pedidos.filter((p) => p.canal === "mayorista");

  const filtrados = useMemo(
    () =>
      revendedores
        .filter((r) => (q ? `${r.razon} ${r.contacto} ${r.localidad} ${r.usuario}`.toLowerCase().includes(q.toLowerCase()) : true))
        .sort((a, b) => +new Date(b.ultimaCompraISO) - +new Date(a.ultimaCompraISO)),
    [revendedores, q]
  );

  const abrirAlta = () => { setForm(BLANK); setModal("alta"); };
  const abrirEdicion = (r: Revendedor) => { setForm(toForm(r)); setSelId(r.id); setModal("editar"); };

  const validar = (): boolean => {
    if (!form.razon.trim()) { push("Poné la razón social del revendedor", "info"); return false; }
    if (!form.usuario.trim()) { push("Poné el usuario del portal (con eso entra a su lista)", "info"); return false; }
    return true;
  };

  const datos = () => ({
    razon: form.razon.trim(),
    contacto: form.contacto.trim(),
    telefono: form.telefono.trim(),
    email: form.email.trim(),
    localidad: form.localidad.trim(),
    usuario: form.usuario.trim().toLowerCase().replace(/\s+/g, ""),
    descuentoPct: Math.min(90, Math.max(0, Number(form.descuentoPct) || 0)),
    compraMinima: Math.max(0, Number(form.compraMinima) || 0),
    saldoCuenta: Number(form.saldoCuenta) || 0,
    activo: form.activo,
  });

  const crear = async () => {
    if (!validar()) return;
    const maxNum = revendedores.reduce((m, r) => Math.max(m, Number(r.id.replace(/\D/g, "")) || 0), 0);
    const r: Revendedor = {
      id: "REV-" + String(maxNum + 1).padStart(2, "0"),
      ...datos(),
      ultimaCompraISO: hoyISO(),
    };
    await addRevendedor(r);
    setModal(null);
    push(`${r.razon} dado de alta. Ya puede entrar al portal con "${r.usuario}".`, "success");
  };

  const guardarEdicion = async () => {
    if (!sel || !validar()) return;
    await updateRevendedor(sel.id, datos());
    setModal(null);
    push("Revendedor actualizado", "success");
  };

  const toggleActivo = (r: Revendedor, v: boolean) => {
    updateRevendedor(r.id, { activo: v });
    push(v ? `${r.razon} activado: puede volver a comprar` : `${r.razon} suspendido: no puede entrar al portal`, "info");
  };

  const pedidosDe = sel ? pedidos.filter((p) => p.revendedorId === sel.id) : [];

  return (
    <div>
      <PageHeader
        title="Mayorista"
        subtitle="Cada revendedor entra al portal con su usuario y ve SU lista de precios, sin pedirla por WhatsApp."
        actions={
          <Btn variant="primary" onClick={abrirAlta}>
            <Plus size={16} /> Nuevo revendedor
          </Btn>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Revendedores activos" value={`${activos}`} icon={Store} accent="brand" hint={`de ${revendedores.length} en total`} />
        <KpiCard label="Cuenta corriente" value={fmtARS(deudaTotal, { short: true })} icon={Wallet} accent={deudaTotal < 0 ? "red" : "sea"} hint={deudaTotal < 0 ? "saldo a cobrar" : "sin deuda"} />
        <KpiCard label="Pedidos mayoristas" value={`${pedidosMayoristas.length}`} icon={ShoppingCart} accent="amber" hint="entrados por el portal" />
      </div>

      <div className="pcard mb-5 flex flex-wrap items-center gap-2.5 p-3">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar por razón social, contacto o usuario…" className="min-w-[220px] flex-1" />
        <Link to="/mayorista" className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-graph/15 px-3 text-xs font-semibold text-graph-500 transition hover:border-brand/40 hover:text-brand">
          <ExternalLink size={13} /> Ver el portal
        </Link>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState msg="No hay revendedores con esa búsqueda." />
      ) : (
        <div className="pcard overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-graph/[0.07] bg-graph/[0.03] text-left text-xs font-semibold uppercase tracking-wide text-graph-400">
                  <th className="px-5 py-3">Revendedor</th>
                  <th className="px-5 py-3">Localidad</th>
                  <th className="px-5 py-3">Usuario del portal</th>
                  <th className="px-5 py-3 text-center">Descuento</th>
                  <th className="px-5 py-3 text-right">Compra mínima</th>
                  <th className="px-5 py-3 text-right">Cta. corriente</th>
                  <th className="px-5 py-3">Última compra</th>
                  <th className="px-5 py-3 text-center">Activo</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graph/[0.07]">
                {filtrados.map((r) => {
                  const debe = r.saldoCuenta < 0;
                  return (
                    <tr key={r.id} onClick={() => { setSelId(r.id); setModal(null); }} className={cn("cursor-pointer transition hover:bg-graph/[0.03]", !r.activo && "opacity-60")}>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-graph">{r.razon}</p>
                        <p className="text-xs text-graph-400">{r.contacto} · {r.telefono}</p>
                      </td>
                      <td className="px-5 py-3.5 text-graph-500">{r.localidad}</td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-lg bg-graph/[0.05] px-2 py-1 font-mono text-xs text-graph-500 ring-1 ring-inset ring-graph/10">{r.usuario}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 font-display font-semibold text-graph"><Percent size={12} className="text-brand" />{r.descuentoPct}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-graph-500">{fmtARS(r.compraMinima, { short: true })}</td>
                      <td className={cn("px-5 py-3.5 text-right font-display font-semibold", debe ? "text-red-700" : "text-graph")}>
                        <span className="inline-flex items-center gap-1">{debe && <AlertTriangle size={12} />}{fmtARS(r.saldoCuenta)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-graph-400">{fmtFecha(r.ultimaCompraISO)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <Switch on={r.activo} onChange={(v) => toggleActivo(r, v)} title={r.activo ? "Suspender acceso" : "Activar acceso"} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); abrirEdicion(r); }}
                          title="Editar condiciones"
                          className="inline-grid h-9 w-9 place-items-center rounded-lg text-graph-400 transition hover:bg-graph/[0.06] hover:text-brand"
                        >
                          <Pencil size={15} />
                        </button>
                        <ChevronRight size={15} className="ml-1 inline text-graph-400" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== Ficha del revendedor + sus pedidos ===== */}
      <Drawer open={!!sel && modal === null} onClose={() => setSelId(null)}>
        {sel && (
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2 pr-10">
              <h2 className="font-display text-xl font-semibold text-graph">{sel.razon}</h2>
              {sel.activo ? <Badge tone="green" dot>Activo</Badge> : <Badge tone="neutral" dot>Suspendido</Badge>}
            </div>
            <p className="mt-1 text-sm text-graph-400">{sel.contacto} · {sel.localidad}</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Mini label="Usuario del portal" value={sel.usuario} mono />
              <Mini label="Descuento sobre lista" value={`${sel.descuentoPct}%`} />
              <Mini label="Compra mínima" value={fmtARS(sel.compraMinima)} />
              <Mini label="Cuenta corriente" value={fmtARS(sel.saldoCuenta)} alerta={sel.saldoCuenta < 0} />
              <Mini label="Teléfono" value={sel.telefono || "—"} />
              <Mini label="Email" value={sel.email || "—"} />
            </div>

            <div className="mt-5">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-graph-400">
                <ShoppingCart size={12} /> Sus pedidos ({pedidosDe.length})
              </p>
              {pedidosDe.length === 0 ? (
                <p className="rounded-xl bg-graph/[0.02] px-3 py-2.5 text-sm text-graph-400">Todavía no hizo pedidos por el portal.</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-graph/[0.07]">
                  <ul className="divide-y divide-graph/[0.07]">
                    {pedidosDe.map((p) => (
                      <li key={p.id}>
                        <Link to="/panel/pedidos" className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-graph/[0.03]">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-graph">{p.id} · {fmtARS(p.total, { short: true })}</p>
                            <p className="truncate text-xs text-graph-400">{fmtFecha(p.fechaISO)} · {p.items.reduce((a, it) => a + it.cantidad, 0)} unidades</p>
                          </div>
                          <Badge tone={estadoPedido[p.estado].tone} dot>{estadoPedido[p.estado].label}</Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end border-t border-graph/[0.07] pt-4">
              <Btn variant="primary" onClick={() => abrirEdicion(sel)} className="h-9 px-3 text-xs">
                <Pencil size={14} /> Editar condiciones
              </Btn>
            </div>
          </div>
        )}
      </Drawer>

      {/* ===== Alta / edición ===== */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === "alta" ? "Nuevo revendedor" : `Editar ${sel?.razon ?? ""}`}
        subtitle={modal === "alta"
          ? "Con el alta, el revendedor ya puede entrar al portal y ver su lista con su descuento."
          : "El descuento define su lista: precio de lista menos su porcentaje."}
        size="lg"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn variant="primary" onClick={modal === "alta" ? crear : guardarEdicion}>
              {modal === "alta" ? "Dar de alta" : "Guardar cambios"}
            </Btn>
          </>
        }
      >
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); (modal === "alta" ? crear : guardarEdicion)(); }}>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-graph-400">Razón social</span>
            <input className={INP} placeholder="Ej: Electro Mitre" value={form.razon} onChange={(e) => setF("razon", e.target.value)} autoFocus />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-graph-400">Contacto</span>
            <input className={INP} placeholder="Nombre de la persona" value={form.contacto} onChange={(e) => setF("contacto", e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-graph-400">Localidad</span>
            <input className={INP} placeholder="Ej: Punta Alta" value={form.localidad} onChange={(e) => setF("localidad", e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-graph-400">Teléfono</span>
            <input className={INP} placeholder="291 …" value={form.telefono} onChange={(e) => setF("telefono", e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-graph-400">Email</span>
            <input className={INP} placeholder="compras@…" value={form.email} onChange={(e) => setF("email", e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-graph-400">Usuario del portal</span>
            <input className={INP} placeholder="electromitre" value={form.usuario} onChange={(e) => setF("usuario", e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-graph-400">Descuento sobre lista (%)</span>
            <input className={INP} inputMode="numeric" placeholder="20" value={form.descuentoPct} onChange={(e) => setF("descuentoPct", e.target.value.replace(/[^\d]/g, ""))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-graph-400">Compra mínima (ARS)</span>
            <input className={INP} inputMode="numeric" placeholder="500000" value={form.compraMinima} onChange={(e) => setF("compraMinima", e.target.value.replace(/[^\d]/g, ""))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-graph-400">Saldo cta. cte. (negativo = debe)</span>
            <input className={INP} inputMode="numeric" placeholder="0" value={form.saldoCuenta} onChange={(e) => setF("saldoCuenta", e.target.value.replace(/[^\d-]/g, ""))} />
          </label>
          <div className="flex min-h-[44px] items-center justify-between self-end rounded-xl border border-graph/[0.07] bg-graph/[0.02] px-3 py-2 text-sm text-graph">
            Acceso al portal habilitado
            <Switch on={form.activo} onChange={(v) => setF("activo", v)} />
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Mini({ label, value, mono, alerta }: { label: string; value: string; mono?: boolean; alerta?: boolean }) {
  return (
    <div className="rounded-xl border border-graph/[0.07] bg-graph/[0.03] px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-graph-400">{label}</p>
      <p className={cn("mt-0.5 truncate text-sm font-medium", mono && "font-mono text-[13px]", alerta ? "text-red-700" : "text-graph")}>{value}</p>
    </div>
  );
}
