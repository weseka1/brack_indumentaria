import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, Heart, Phone, ShieldCheck, ShoppingCart, Truck, Wrench,
} from "lucide-react";
import Navbar, { WHATSAPP } from "./components/Navbar";
import Footer from "./components/Footer";
import ProductoCard from "./components/ProductoCard";
import { VisualProducto } from "./components/PlacaProducto";
import { useLenis } from "./lib/useLenis";
import { useSEO, jsonLdProducto } from "./lib/seo";
import { useReveal } from "@/lib/hooks";
import { useData } from "@/lib/DataProvider";
import { valorCuota, precioEfectivo, CATEGORIAS_PRODUCTO } from "@/data/types";
import { fmtARS } from "@/lib/format";
import { useCart } from "./context/CartContext";
import { useFavorites } from "./context/FavoritesContext";

export default function ProductoDetalle() {
  useLenis();
  const { id } = useParams();
  const { productos } = useData();
  const p = productos.find((x) => x.id === id);
  const { agregar } = useCart();
  const { esFavorito, toggle } = useFavorites();
  const [agregado, setAgregado] = useState(false);

  const relacionados = useMemo(
    () =>
      productos
        .filter((x) => x.publicado && x.id !== id && x.categoria === p?.categoria)
        .slice(0, 3),
    [productos, id, p?.categoria]
  );

  useSEO({
    titulo: p
      ? `${p.nombre} · Brack Indumentaria`
      : "Producto · Brack Indumentaria",
    descripcion: p
      ? `${p.nombre}: ${fmtARS(p.precio)}, ${p.cuotas} cuotas sin interés de ${fmtARS(valorCuota(p))}. Efectivo ${fmtARS(precioEfectivo(p))}. Con garantía y service propio en Bahía Blanca.`
      : undefined,
    path: p ? `/producto/${p.id}` : undefined,
    jsonLd: p ? jsonLdProducto(p) : null,
  });
  useReveal();

  if (!p || !p.publicado) {
    return (
      <div className="min-h-screen bg-paper text-graph">
        <Navbar variant="solid" />
        <div className="container-x grid min-h-[70vh] place-items-center">
          <div className="text-center">
            <p className="font-display text-3xl text-graph">No encontramos ese producto</p>
            <p className="mt-2 text-graph-500">Puede que se haya vendido o despublicado.</p>
            <Link to="/tienda" className="btn-primary mt-7">Ver la tienda</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const catInfo = CATEGORIAS_PRODUCTO.find((c) => c.key === p.categoria);
  const catPlural = catInfo?.plural ?? p.categoria;
  const ahorro = p.precio - precioEfectivo(p);
  const fav = esFavorito(p.id);
  const waProducto =
    WHATSAPP +
    "?text=" +
    encodeURIComponent(
      `Buenas, quisiera consultar por ${p.nombre} (${p.id}) que vi publicado en la web a ${fmtARS(p.precio)}.`
    );

  const alCarrito = () => {
    agregar(p.id, 1);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 2200);
  };

  return (
    <div className="min-h-screen bg-paper text-graph">
      <div className="grain" />
      <Navbar variant="solid" />

      <div className="container-x pt-28">
        {/* migas: siempre se sabe dónde se está y cómo volver */}
        <nav className="flex flex-wrap items-center gap-2 text-sm text-graph-400" aria-label="Ruta">
          <Link to="/tienda" className="flex items-center gap-1.5 hover:text-brand">
            <ArrowLeft size={15} /> Tienda
          </Link>
          <span aria-hidden>/</span>
          <Link to={`/tienda?cat=${p.categoria}`} className="hover:text-brand">{catPlural}</Link>
          <span aria-hidden>/</span>
          <span className="truncate text-graph-500">{p.nombre}</span>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Visual: foto real entera sobre blanco, o placa tipográfica */}
          <div className="reveal">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-graph/10">
              <VisualProducto p={p} grande />
              {p.condicion === "usado" && (
                <span className="absolute left-4 top-4 rounded-full bg-paper-100/95 px-3 py-1.5 text-[11px] font-semibold text-graph-700 ring-1 ring-graph/10 backdrop-blur">
                  Reacondicionado · {p.garantiaMeses} meses de garantía por escrito
                </span>
              )}
            </div>
            {p.fotos.length > 1 && (
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {p.fotos.map((f, i) => (
                  <div key={i} className="h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-graph/10 bg-white p-2">
                    <img src={f} alt="" className="h-full w-full object-contain" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ficha de compra */}
          <div className="reveal" data-delay="90ms">
            <p className="text-[11px] uppercase tracking-widest2 text-graph-400">{p.marca}</p>
            <h1 className="mt-2 font-display text-3xl font-medium leading-tight tracking-tight text-graph md:text-4xl">
              {p.nombre}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-graph-500">{p.descripcion}</p>

            {/* precio: la cuota primero, el contado como premio */}
            <div className="mt-7 rounded-2xl border border-graph/10 bg-paper-100 p-6">
              <p className="font-display text-4xl font-semibold tracking-tight text-graph">{fmtARS(p.precio)}</p>
              <p className="mt-1.5 text-base font-medium text-brand">
                {p.cuotas} cuotas sin interés de {fmtARS(valorCuota(p))}
              </p>
              <p className="mt-1 text-sm text-graph-500">
                Efectivo: {fmtARS(precioEfectivo(p))} ({p.descuentoEfectivoPct}% de descuento).
                Ahorra {fmtARS(ahorro)} pagando en efectivo.
              </p>

              <p className="mt-4 flex items-center gap-2 text-sm font-medium">
                {p.stock === 0 ? (
                  <span className="text-graph-400">Sin stock por el momento, consulte por reposición</span>
                ) : p.stock === 1 ? (
                  <span className="text-brand">Última unidad disponible</span>
                ) : (
                  <span className="flex items-center gap-2 text-sea">
                    <Check size={15} /> En stock, entrega inmediata
                  </span>
                )}
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                {p.stock > 0 ? (
                  <button onClick={alCarrito} className="btn-primary flex-1">
                    {agregado ? (
                      <>Agregado <Check size={16} /></>
                    ) : (
                      <><ShoppingCart size={16} /> Agregar al carrito</>
                    )}
                  </button>
                ) : (
                  <a href={waProducto} target="_blank" rel="noreferrer" className="btn-primary flex-1">
                    <Phone size={15} /> Consultar disponibilidad
                  </a>
                )}
                <a href={waProducto} target="_blank" rel="noreferrer" className="btn-ghost flex-1">
                  <Phone size={15} /> Consultar por WhatsApp
                </a>
              </div>
              {agregado && (
                <p className="mt-3 text-center text-sm text-graph-500">
                  Sumado al carrito. <Link to="/carrito" className="font-semibold text-brand hover:underline">Ver carrito</Link>
                </p>
              )}
            </div>

            <ul className="mt-5 space-y-2.5 text-sm text-graph-500">
              <li className="flex items-center gap-2.5">
                <Truck size={16} className="shrink-0 text-brand" /> Envío e instalación sin cargo en Bahía Blanca
              </li>
              <li className="flex items-center gap-2.5">
                <ShieldCheck size={16} className="shrink-0 text-brand" /> Garantía de {p.garantiaMeses} meses
                {p.condicion === "usado" ? ", por escrito, del taller Brack" : ""}
              </li>
              <li className="flex items-center gap-2.5">
                <Wrench size={16} className="shrink-0 text-brand" /> Service propio en Santa Fe 85
              </li>
            </ul>

            <button
              onClick={() => toggle(p.id)}
              className={`mt-5 flex items-center gap-2 text-sm font-medium transition ${
                fav ? "text-brand" : "text-graph-500 hover:text-brand"
              }`}
            >
              <Heart size={16} fill={fav ? "currentColor" : "none"} />
              {fav ? "Guardado en favoritos" : "Guardar en favoritos"}
            </button>
          </div>
        </div>

        {/* Especificaciones: tabla fina, hairlines */}
        {p.specs.length > 0 && (
          <section className="reveal mt-16 max-w-2xl">
            <h2 className="font-display text-2xl font-medium tracking-tight text-graph">Especificaciones</h2>
            <dl className="mt-5 overflow-hidden rounded-2xl border border-graph/10 bg-paper-100">
              {p.specs.map((s, i) => (
                <div
                  key={s.rotulo}
                  className={`flex items-baseline justify-between gap-6 px-6 py-3.5 ${i > 0 ? "border-t border-graph/10" : ""}`}
                >
                  <dt className="text-sm text-graph-400">{s.rotulo}</dt>
                  <dd className="text-right text-sm font-medium text-graph">{s.valor}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Se lo arreglamos nosotros: el diferencial, repetido donde pesa */}
        <section className="reveal mt-16 overflow-hidden rounded-2xl border border-graph/10 bg-paper-100">
          <div className="grid gap-6 p-8 md:grid-cols-[auto_1fr_auto] md:items-center md:p-10">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand">
              <Wrench size={26} strokeWidth={1.7} />
            </span>
            <div>
              <h2 className="font-display text-2xl font-medium tracking-tight text-graph">Se lo arreglamos nosotros</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-graph-500">
                Este equipo tiene el respaldo del taller propio de Brack: si algún día falla, lo
                atiende el mismo taller que se lo vendió, sin 0800 ni semanas de espera. Su compra
                queda registrada y vinculada a su historial de service.
              </p>
            </div>
            <Link to="/service" className="btn-ghost self-start whitespace-nowrap md:self-center">
              Conocer el service <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        {/* Relacionados */}
        {relacionados.length > 0 && (
          <section className="mt-16 pb-4">
            <div className="reveal mb-8 flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-medium tracking-tight text-graph">
                Más {catPlural.toLowerCase()} de la casa
              </h2>
              <Link to={`/tienda?cat=${p.categoria}`} className="group flex items-center gap-2 text-sm font-semibold text-brand">
                Ver todos <ArrowRight size={15} className="transition group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {relacionados.map((x) => (
                <div key={x.id} className="reveal"><ProductoCard p={x} /></div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
}
