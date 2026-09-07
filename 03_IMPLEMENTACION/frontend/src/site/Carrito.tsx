import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Minus, Plus, ShoppingCart, Trash2, Truck, Store } from "lucide-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { VisualProducto } from "./components/PlacaProducto";
import { useLenis } from "./lib/useLenis";
import { useSEO } from "./lib/seo";
import { useData } from "@/lib/DataProvider";
import { useCart } from "./context/CartContext";
import { valorCuota, precioEfectivo } from "@/data/types";
import type { Pedido, MedioPago } from "@/data/types";
import { fmtARS } from "@/lib/format";
import { hoyISO } from "@/lib/fechas";

type Entrega = "retiro" | "envio";
type Pago = "efectivo" | "transferencia" | "cuotas";

// Nº de pedido correlativo con los que ya viven en el panel (PED-1058 → PED-1059).
function proximoNumeroPedido(pedidos: Pedido[]): string {
  const max = pedidos.reduce((a, p) => {
    const n = Number(String(p.id).replace(/\D/g, ""));
    return Number.isFinite(n) && n > a ? n : a;
  }, 1000);
  return `PED-${max + 1}`;
}

export default function Carrito() {
  useLenis();
  useSEO({
    titulo: "Carrito · Brack Indumentaria",
    descripcion: "Revise su pedido y elija cómo pagar: efectivo con 10% de descuento, transferencia o 6 cuotas sin interés.",
    path: "/carrito",
  });
  const { productos, pedidos, addPedido } = useData();
  const { items, quitar, setCantidad, vaciar } = useCart();
  const navigate = useNavigate();

  const lineas = useMemo(
    () =>
      items
        .map((it) => ({ ...it, p: productos.find((x) => x.id === it.productoId) }))
        .filter((x): x is typeof x & { p: NonNullable<typeof x.p> } => Boolean(x.p)),
    [items, productos]
  );

  const [f, setF] = useState({ nombre: "", contacto: "", direccion: "" });
  const [entrega, setEntrega] = useState<Entrega>("retiro");
  const [pago, setPago] = useState<Pago>("cuotas");
  const [error, setError] = useState("");
  const [confirmado, setConfirmado] = useState<string | null>(null);

  const totalLista = lineas.reduce((a, x) => a + x.p.precio * x.cantidad, 0);
  const totalEfectivo = lineas.reduce((a, x) => a + precioEfectivo(x.p) * x.cantidad, 0);
  const total = pago === "efectivo" ? totalEfectivo : totalLista;

  const confirmar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineas.length) return;
    if (!f.nombre.trim() || !f.contacto.trim()) {
      setError("Complete su nombre y un contacto para coordinar el pedido.");
      return;
    }
    if (entrega === "envio" && !f.direccion.trim()) {
      setError("Indique la dirección de entrega.");
      return;
    }
    setError("");

    const medioPago: MedioPago =
      pago === "efectivo" ? "efectivo" : pago === "transferencia" ? "transferencia" : "tarjeta_cuotas";
    const id = proximoNumeroPedido(pedidos);
    const pedido: Pedido = {
      id,
      fechaISO: hoyISO(),
      cliente: f.nombre.trim(),
      contacto: f.contacto.trim(),
      items: lineas.map((x) => ({
        productoId: x.p.id,
        nombre: x.p.nombre,
        cantidad: x.cantidad,
        precioUnit: pago === "efectivo" ? precioEfectivo(x.p) : x.p.precio,
      })),
      total,
      medioPago,
      ...(pago === "cuotas" ? { cuotas: 6 } : {}),
      entrega,
      ...(entrega === "envio" ? { direccion: f.direccion.trim() } : {}),
      estado: "nuevo",
      canal: "web",
      notas:
        entrega === "retiro"
          ? "Pedido de la tienda web. Retira por Santa Fe 85."
          : "Pedido de la tienda web. Coordinar envío e instalación.",
    };
    addPedido(pedido);
    vaciar();
    setConfirmado(id);
    window.scrollTo(0, 0);
  };

  // ── Pantalla de éxito ──
  if (confirmado) {
    return (
      <div className="min-h-screen bg-paper text-graph">
        <div className="grain" />
        <Navbar variant="solid" />
        <div className="container-x grid min-h-[75vh] place-items-center py-28">
          <div className="w-full max-w-lg rounded-2xl border border-graph/10 bg-paper-100 p-10 text-center shadow-soft">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sea-50 text-sea">
              <Check size={30} />
            </span>
            <h1 className="mt-5 font-display text-3xl tracking-tight text-graph">Pedido recibido</h1>
            <p className="mt-3 text-graph-500">
              Su pedido quedó registrado con el número{" "}
              <span className="font-display font-semibold text-graph">{confirmado}</span>.
              Nos comunicamos a la brevedad para confirmar el pago y coordinar la entrega.
            </p>
            <p className="mt-5 rounded-xl bg-paper-200 px-4 py-3 text-xs leading-relaxed text-graph-500">
              Sitio de demostración: no se procesó ningún pago real. El pedido ya está visible
              en el panel interno de Brack, donde el equipo lo gestiona.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to="/tienda" className="btn-primary">Seguir mirando la tienda</Link>
              <button onClick={() => navigate("/")} className="btn-ghost">Volver al inicio</button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-graph">
      <div className="grain" />
      <Navbar variant="solid" />

      <header className="container-x pt-32 pb-8">
        <p className="eyebrow flex items-center gap-2"><ShoppingCart size={15} /> Su pedido</p>
        <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-graph md:text-5xl">Carrito</h1>
      </header>

      <section className="container-x pb-24">
        {lineas.length === 0 ? (
          <div className="rounded-2xl border border-graph/10 bg-paper-100 py-24 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-graph/5 text-graph-400">
              <ShoppingCart size={28} />
            </span>
            <p className="mt-5 font-display text-2xl text-graph">El carrito está vacío</p>
            <p className="mt-2 text-graph-500">Los productos que agregue van a aparecer acá.</p>
            <Link to="/tienda" className="btn-primary mt-7">Ver la tienda</Link>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            {/* Ítems */}
            <div className="overflow-hidden rounded-2xl border border-graph/10 bg-paper-100">
              {lineas.map((x, i) => (
                <div
                  key={x.p.id}
                  className={`flex flex-wrap items-center gap-4 p-5 sm:flex-nowrap ${i > 0 ? "border-t border-graph/10" : ""}`}
                >
                  <Link to={`/producto/${x.p.id}`} className="h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-graph/10">
                    <VisualProducto p={x.p} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/producto/${x.p.id}`} className="block truncate font-display text-[15px] font-medium text-graph hover:text-brand">
                      {x.p.nombre}
                    </Link>
                    <p className="mt-0.5 text-xs text-graph-500">
                      {fmtARS(x.p.precio)} · {x.p.cuotas} cuotas de {fmtARS(valorCuota(x.p))}
                    </p>
                    {x.p.stock === 1 && <p className="mt-0.5 text-xs font-medium text-brand">Última unidad</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-full border border-graph/15">
                      <button
                        onClick={() => setCantidad(x.p.id, x.cantidad - 1)}
                        aria-label="Restar una unidad"
                        className="grid h-10 w-10 place-items-center rounded-l-full text-graph-500 transition hover:text-brand"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-graph">{x.cantidad}</span>
                      <button
                        onClick={() => setCantidad(x.p.id, Math.min(x.cantidad + 1, Math.max(x.p.stock, 1)))}
                        aria-label="Sumar una unidad"
                        className="grid h-10 w-10 place-items-center rounded-r-full text-graph-500 transition hover:text-brand disabled:opacity-40"
                        disabled={x.cantidad >= x.p.stock}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <button
                      onClick={() => quitar(x.p.id)}
                      aria-label="Quitar del carrito"
                      className="grid h-10 w-10 place-items-center rounded-full text-graph-400 transition hover:bg-graph/5 hover:text-brand"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="w-full text-right font-display text-base font-semibold text-graph sm:w-28">
                    {fmtARS(x.p.precio * x.cantidad)}
                  </p>
                </div>
              ))}
            </div>

            {/* Checkout de UN paso */}
            <form onSubmit={confirmar} className="rounded-2xl border border-graph/10 bg-paper-100 p-6 shadow-soft md:p-7">
              <h2 className="font-display text-xl font-semibold tracking-tight text-graph">Finalizar pedido</h2>

              <div className="mt-5 space-y-4">
                <Campo label="Nombre y apellido" placeholder="Su nombre" value={f.nombre} onChange={(v) => setF({ ...f, nombre: v })} />
                <Campo label="WhatsApp o correo" placeholder="+54 9 291 ..." value={f.contacto} onChange={(v) => setF({ ...f, contacto: v })} />
              </div>

              {/* Entrega */}
              <p className="mt-6 text-[11px] uppercase tracking-widest2 text-graph-400">Entrega</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Radio
                  activo={entrega === "retiro"}
                  onClick={() => setEntrega("retiro")}
                  icon={<Store size={17} />}
                  titulo="Retiro por el local"
                  detalle="Santa Fe 85, sin cargo"
                />
                <Radio
                  activo={entrega === "envio"}
                  onClick={() => setEntrega("envio")}
                  icon={<Truck size={17} />}
                  titulo="Envío a domicilio"
                  detalle="Sin cargo en Bahía Blanca"
                />
              </div>
              {entrega === "envio" && (
                <div className="mt-3">
                  <Campo label="Dirección de entrega" placeholder="Calle y número, localidad" value={f.direccion} onChange={(v) => setF({ ...f, direccion: v })} />
                </div>
              )}

              {/* Pago */}
              <p className="mt-6 text-[11px] uppercase tracking-widest2 text-graph-400">Medio de pago</p>
              <div className="mt-2 grid gap-2">
                <Radio
                  activo={pago === "cuotas"}
                  onClick={() => setPago("cuotas")}
                  titulo="6 cuotas sin interés"
                  detalle={`6 × ${fmtARS(Math.round(totalLista / 6))}`}
                />
                <Radio
                  activo={pago === "efectivo"}
                  onClick={() => setPago("efectivo")}
                  titulo="Efectivo en el local"
                  detalle={`${fmtARS(totalEfectivo)} · 10% de descuento`}
                />
                <Radio
                  activo={pago === "transferencia"}
                  onClick={() => setPago("transferencia")}
                  titulo="Transferencia bancaria"
                  detalle={fmtARS(totalLista)}
                />
              </div>

              {/* Total */}
              <div className="mt-6 space-y-1.5 border-t border-graph/10 pt-4 text-sm">
                <div className="flex justify-between text-graph-500">
                  <span>Subtotal</span><span>{fmtARS(totalLista)}</span>
                </div>
                {pago === "efectivo" && (
                  <div className="flex justify-between text-sea">
                    <span>Descuento por efectivo</span><span>−{fmtARS(totalLista - totalEfectivo)}</span>
                  </div>
                )}
                <div className="flex justify-between text-graph-500">
                  <span>Envío e instalación</span><span>Sin cargo</span>
                </div>
                <div className="flex items-baseline justify-between pt-2">
                  <span className="font-medium text-graph">Total</span>
                  <span className="font-display text-2xl font-semibold tracking-tight text-graph">{fmtARS(total)}</span>
                </div>
                {pago === "cuotas" && (
                  <p className="text-right text-xs font-medium text-brand">6 cuotas sin interés de {fmtARS(Math.round(total / 6))}</p>
                )}
              </div>

              {error && <p className="mt-4 text-sm font-medium text-brand">{error}</p>}

              <button type="submit" className="btn-primary mt-5 w-full">
                Confirmar pedido <ArrowRight size={16} />
              </button>
              <p className="mt-3 text-center text-xs leading-relaxed text-graph-400">
                Demo: sin pasarela de pago real. El pedido cae directo en el panel de Brack
                y el equipo se comunica para coordinar.
              </p>
            </form>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

function Campo({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-widest2 text-graph-400">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-[46px] w-full rounded-lg border border-graph/15 bg-paper-100 px-4 text-sm text-graph outline-none transition placeholder:text-graph-400 focus:border-brand"
      />
    </label>
  );
}

function Radio({
  activo, onClick, titulo, detalle, icon,
}: {
  activo: boolean; onClick: () => void; titulo: string; detalle: string; icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`flex min-h-[56px] items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
        activo ? "border-brand bg-brand/[0.05] ring-1 ring-brand/30" : "border-graph/15 hover:border-graph/30"
      }`}
    >
      {icon && <span className={activo ? "text-brand" : "text-graph-400"}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-graph">{titulo}</span>
        <span className="block truncate text-xs text-graph-500">{detalle}</span>
      </span>
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${
          activo ? "border-brand bg-brand text-white" : "border-graph/25"
        }`}
        aria-hidden
      >
        {activo && <Check size={12} />}
      </span>
    </button>
  );
}
