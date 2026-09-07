import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Building2, Check, KeyRound, LogOut, Lock, Minus, Plus, User, Wallet,
} from "lucide-react";
import Navbar, { WHATSAPP } from "./components/Navbar";
import Footer from "./components/Footer";
import { VisualProducto } from "./components/PlacaProducto";
import { useLenis } from "./lib/useLenis";
import { useSEO } from "./lib/seo";
import { useData } from "@/lib/DataProvider";
import { precioMayorista } from "@/data/types";
import type { Pedido, Revendedor } from "@/data/types";
import { fmtARS, fmtFecha } from "@/lib/format";
import { hoyISO } from "@/lib/fechas";

// La sesión del portal vive en sessionStorage: se cierra sola al cerrar la pestaña.
const SS_KEY = "brack_mayorista";
const DEMO_PASSWORD = "demo";

const WA_ALTA =
  WHATSAPP +
  "?text=" +
  encodeURIComponent(
    "Buenas, quisiera solicitar el alta como revendedor mayorista de Brack. Le paso nombre del comercio, CUIT y localidad:"
  );

function proximoNumeroPedido(pedidos: Pedido[]): string {
  const max = pedidos.reduce((a, p) => {
    const n = Number(String(p.id).replace(/\D/g, ""));
    return Number.isFinite(n) && n > a ? n : a;
  }, 1000);
  return `PED-${max + 1}`;
}

export default function Mayorista() {
  useLenis();
  useSEO({
    titulo: "Portal mayorista · Brack Indumentaria",
    descripcion:
      "Portal para revendedores de Brack: su lista de precios propia, stock actualizado y carga de pedidos en línea, con compra mínima y cuenta corriente.",
    path: "/mayorista",
  });
  const { revendedores } = useData();
  const [sesionId, setSesionId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(SS_KEY);
    } catch {
      return null;
    }
  });
  const rev = useMemo(
    () => revendedores.find((r) => r.id === sesionId && r.activo) ?? null,
    [revendedores, sesionId]
  );

  const entrar = (r: Revendedor) => {
    try {
      sessionStorage.setItem(SS_KEY, r.id);
    } catch { /* noop */ }
    setSesionId(r.id);
  };
  const salir = () => {
    try {
      sessionStorage.removeItem(SS_KEY);
    } catch { /* noop */ }
    setSesionId(null);
  };

  return (
    <div className="min-h-screen bg-paper text-graph">
      <div className="grain" />
      <Navbar variant="solid" />
      {rev ? <Portal rev={rev} onSalir={salir} /> : <Acceso onEntrar={entrar} />}
      <Footer />
    </div>
  );
}

// ── Pantalla de acceso ────────────────────────────────────────────────────────
function Acceso({ onEntrar }: { onEntrar: (r: Revendedor) => void }) {
  const { revendedores } = useData();
  const [f, setF] = useState({ usuario: "", password: "" });
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = revendedores.find((x) => x.usuario === f.usuario.toLowerCase().trim());
    if (!r || !r.activo) {
      setError("No encontramos ese usuario. Si todavía no tiene acceso, solicite el alta.");
      return;
    }
    if (f.password !== DEMO_PASSWORD) {
      setError("La contraseña no es correcta.");
      return;
    }
    setError("");
    onEntrar(r);
  };

  return (
    <div className="container-x grid min-h-[80vh] items-center gap-14 py-32 lg:grid-cols-2">
      <div>
        <p className="eyebrow flex items-center gap-2"><Building2 size={15} /> Revendedores</p>
        <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-graph md:text-5xl">
          Su lista de precios, siempre disponible
        </h1>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-graph-500">
          Cada revendedor de Brack entra con su usuario y ve su propia lista de precios,
          su compra mínima y su cuenta corriente. Arma el pedido en el momento, sin esperar
          que le contesten un mensaje ni le manden la lista.
        </p>
        <p className="mt-6 text-sm text-graph-500">
          ¿Todavía no trabaja con Brack?{" "}
          <a href={WA_ALTA} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline">
            Solicitar acceso mayorista
          </a>
        </p>
      </div>

      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-graph/10 bg-paper-100 p-8 shadow-card lg:justify-self-end">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand text-white">
          <KeyRound size={22} />
        </span>
        <h2 className="mt-4 font-display text-2xl tracking-tight text-graph">Ingresar al portal</h2>
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-graph/15 bg-paper-100 px-4 transition focus-within:border-brand">
            <User size={18} className="shrink-0 text-graph-400" />
            <input
              value={f.usuario}
              onChange={(e) => setF({ ...f, usuario: e.target.value })}
              placeholder="Usuario"
              autoComplete="username"
              className="h-12 w-full bg-transparent text-sm text-graph outline-none placeholder:text-graph-400"
            />
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-graph/15 bg-paper-100 px-4 transition focus-within:border-brand">
            <Lock size={18} className="shrink-0 text-graph-400" />
            <input
              type="password"
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
              placeholder="Contraseña"
              autoComplete="current-password"
              className="h-12 w-full bg-transparent text-sm text-graph outline-none placeholder:text-graph-400"
            />
          </div>
        </div>
        {error && <p className="mt-3 text-sm font-medium text-brand">{error}</p>}
        <button type="submit" className="btn-primary mt-5 w-full">
          Ingresar <ArrowRight size={16} />
        </button>
        <p className="mt-4 rounded-xl bg-paper-200 px-4 py-3 text-center text-xs leading-relaxed text-graph-500">
          Acceso de demostración: usuario <span className="font-semibold text-graph">electromitre</span> ·
          contraseña <span className="font-semibold text-graph">demo</span>
        </p>
      </form>
    </div>
  );
}

// ── El portal: SU lista, SU mínimo, SU cuenta ─────────────────────────────────
function Portal({ rev, onSalir }: { rev: Revendedor; onSalir: () => void }) {
  const { productos, pedidos, addPedido } = useData();
  const publicados = useMemo(() => productos.filter((p) => p.publicado && p.stock > 0), [productos]);
  const [cant, setCant] = useState<Record<string, number>>({});
  const [confirmado, setConfirmado] = useState<string | null>(null);

  const setCantidad = (id: string, n: number, stock: number) =>
    setCant((prev) => ({ ...prev, [id]: Math.max(0, Math.min(n, stock)) }));

  const lineas = publicados
    .map((p) => ({ p, cantidad: cant[p.id] || 0 }))
    .filter((x) => x.cantidad > 0);
  const total = lineas.reduce((a, x) => a + precioMayorista(x.p, rev) * x.cantidad, 0);
  const faltante = Math.max(0, rev.compraMinima - total);
  const llegaAlMinimo = total >= rev.compraMinima && lineas.length > 0;

  const confirmar = () => {
    if (!llegaAlMinimo) return;
    const id = proximoNumeroPedido(pedidos);
    addPedido({
      id,
      fechaISO: hoyISO(),
      cliente: rev.razon,
      contacto: rev.email,
      revendedorId: rev.id,
      items: lineas.map((x) => ({
        productoId: x.p.id,
        nombre: x.p.nombre,
        cantidad: x.cantidad,
        precioUnit: precioMayorista(x.p, rev),
      })),
      total,
      medioPago: "cuenta_corriente",
      entrega: "envio",
      direccion: `${rev.razon}, ${rev.localidad}`,
      estado: "nuevo",
      canal: "mayorista",
      notas: `Pedido del portal mayorista (${rev.usuario}). Lista con ${rev.descuentoPct}% de descuento.`,
    });
    setCant({});
    setConfirmado(id);
    window.scrollTo(0, 0);
  };

  if (confirmado) {
    return (
      <div className="container-x grid min-h-[75vh] place-items-center py-28">
        <div className="w-full max-w-lg rounded-2xl border border-graph/10 bg-paper-100 p-10 text-center shadow-soft">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sea-50 text-sea">
            <Check size={30} />
          </span>
          <h1 className="mt-5 font-display text-3xl tracking-tight text-graph">Pedido enviado</h1>
          <p className="mt-3 text-graph-500">
            El pedido{" "}
            <span className="font-display font-semibold text-graph">{confirmado}</span> de{" "}
            {rev.razon} quedó registrado a cuenta corriente. Brack lo prepara y le confirma
            la entrega por el canal de siempre.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button onClick={() => setConfirmado(null)} className="btn-primary">Armar otro pedido</button>
            <Link to="/" className="btn-ghost">Ir al inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x pb-24 pt-32">
      {/* Encabezado del portal */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow flex items-center gap-2"><Building2 size={15} /> Portal mayorista</p>
          <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-graph md:text-4xl">{rev.razon}</h1>
          <p className="mt-1 text-sm text-graph-500">{rev.contacto} · {rev.localidad}</p>
        </div>
        <button onClick={onSalir} className="btn-ghost !py-2.5">
          <LogOut size={15} /> Cerrar sesión
        </button>
      </div>

      {/* Sus condiciones, a la vista */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: "Su descuento", v: `${rev.descuentoPct}%`, d: "sobre precio de lista" },
          { l: "Compra mínima", v: fmtARS(rev.compraMinima), d: "por pedido" },
          {
            l: "Cuenta corriente",
            v: fmtARS(Math.abs(rev.saldoCuenta)),
            d: rev.saldoCuenta < 0 ? "saldo a pagar" : "sin deuda",
            alerta: rev.saldoCuenta < 0,
          },
          { l: "Última compra", v: fmtFecha(rev.ultimaCompraISO), d: "registrada" },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-graph/10 bg-paper-100 p-5">
            <p className="text-[11px] uppercase tracking-widest2 text-graph-400">{s.l}</p>
            <p className={`mt-1.5 font-display text-xl font-semibold tracking-tight ${s.alerta ? "text-brand" : "text-graph"}`}>
              {s.v}
            </p>
            <p className="mt-0.5 text-xs text-graph-500">{s.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        {/* Su lista de precios */}
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-graph">Su lista de precios</h2>
          <p className="mt-1 text-sm text-graph-500">
            Precios con su {rev.descuentoPct}% aplicado. Cargue cantidades y confirme el pedido.
          </p>
          <div className="mt-5 overflow-hidden rounded-2xl border border-graph/10 bg-paper-100">
            {publicados.map((p, i) => {
              const suyo = precioMayorista(p, rev);
              const n = cant[p.id] || 0;
              return (
                <div
                  key={p.id}
                  className={`flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap ${i > 0 ? "border-t border-graph/10" : ""}`}
                >
                  <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-graph/10">
                    <VisualProducto p={p} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-graph">{p.nombre}</p>
                    <p className="mt-0.5 text-xs text-graph-400">
                      Lista {fmtARS(p.precio)} · stock {p.stock}
                      {p.condicion === "usado" ? " · reacondicionado" : ""}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-brand">{fmtARS(suyo)}</p>
                  </div>
                  <div className="flex items-center rounded-full border border-graph/15">
                    <button
                      onClick={() => setCantidad(p.id, n - 1, p.stock)}
                      aria-label="Restar una unidad"
                      className="grid h-10 w-10 place-items-center rounded-l-full text-graph-500 transition hover:text-brand disabled:opacity-40"
                      disabled={n === 0}
                    >
                      <Minus size={15} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-graph">{n}</span>
                    <button
                      onClick={() => setCantidad(p.id, n + 1, p.stock)}
                      aria-label="Sumar una unidad"
                      className="grid h-10 w-10 place-items-center rounded-r-full text-graph-500 transition hover:text-brand disabled:opacity-40"
                      disabled={n >= p.stock}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumen del pedido */}
        <div className="rounded-2xl border border-graph/10 bg-paper-100 p-6 shadow-soft lg:sticky lg:top-24 md:p-7">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-graph">
            <Wallet size={19} className="text-brand" /> Resumen del pedido
          </h2>

          {lineas.length === 0 ? (
            <p className="mt-4 text-sm text-graph-500">Todavía no cargó cantidades.</p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {lineas.map((x) => (
                <div key={x.p.id} className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="min-w-0 flex-1 truncate text-graph-500">
                    {x.cantidad} × {x.p.nombre}
                  </span>
                  <span className="font-medium text-graph">{fmtARS(precioMayorista(x.p, rev) * x.cantidad)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 border-t border-graph/10 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-graph">Total</span>
              <span className="font-display text-2xl font-semibold tracking-tight text-graph">{fmtARS(total)}</span>
            </div>

            {/* la compra mínima, visible y honesta */}
            <div className="mt-4">
              <div className="h-1.5 overflow-hidden rounded-full bg-graph/[0.08]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${llegaAlMinimo ? "bg-sea" : "bg-brand"}`}
                  style={{ width: `${Math.min(100, Math.round((total / rev.compraMinima) * 100))}%` }}
                />
              </div>
              <p className={`mt-2 text-xs font-medium ${llegaAlMinimo ? "text-sea" : "text-graph-500"}`}>
                {llegaAlMinimo
                  ? "Compra mínima alcanzada"
                  : `Faltan ${fmtARS(faltante)} para la compra mínima de ${fmtARS(rev.compraMinima)}`}
              </p>
            </div>

            <button
              onClick={confirmar}
              disabled={!llegaAlMinimo}
              className="btn-primary mt-5 w-full disabled:pointer-events-none disabled:opacity-40"
            >
              Confirmar pedido <ArrowRight size={16} />
            </button>
            <p className="mt-3 text-center text-xs leading-relaxed text-graph-400">
              El pedido se registra a cuenta corriente y Brack le confirma la entrega.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
