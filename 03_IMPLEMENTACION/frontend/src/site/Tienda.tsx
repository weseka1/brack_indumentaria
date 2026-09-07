import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, SlidersHorizontal } from "lucide-react";
import Navbar, { WHATSAPP } from "./components/Navbar";
import Footer from "./components/Footer";
import ProductoCard from "./components/ProductoCard";
import { useLenis } from "./lib/useLenis";
import { useSEO } from "./lib/seo";
import UISelect from "@/components/Select";
import { useReveal } from "@/lib/hooks";
import { useData } from "@/lib/DataProvider";
import { CATEGORIAS_PRODUCTO } from "@/data/types";

// ── Tienda: catálogo con filtros por categoría, condición, marca y orden ──────

export default function Tienda() {
  useLenis();
  useSEO({
    titulo: "Tienda · Brack Indumentaria, electrodomésticos en Bahía Blanca",
    descripcion:
      "Heladeras, freezers, lavarropas, cocinas y aires acondicionados, nuevos y reacondicionados con garantía. 6 cuotas sin interés y 10% de descuento en efectivo. Bahía Blanca.",
    path: "/tienda",
  });
  const { productos } = useData();
  // Solo lo publicado sale en la web; los borradores viven en el panel.
  const publicados = useMemo(() => productos.filter((p) => p.publicado), [productos]);
  const marcas = useMemo(() => [...new Set(publicados.map((p) => p.marca))].sort(), [publicados]);
  const cuenta = (cat: string) => publicados.filter((p) => p.categoria === cat).length;
  const tabs = [
    { key: "", label: "Todos", n: publicados.length },
    ...CATEGORIAS_PRODUCTO.map((c) => ({ key: c.key, label: c.plural, n: cuenta(c.key) })).filter((t) => t.n > 0),
  ];

  const [params, setParams] = useSearchParams();
  const [f, setF] = useState({
    cat: params.get("cat") || "",
    cond: params.get("cond") || "",
    marca: params.get("marca") || "",
    q: params.get("q") || "",
    orden: "destacados",
  });

  // Sincronizar con la URL: el nav llega con ?cond=usado o ?cat=heladera puestos.
  useEffect(() => {
    setF((p) => ({
      ...p,
      cat: params.get("cat") || "",
      cond: params.get("cond") || "",
      marca: params.get("marca") || p.marca,
      q: params.get("q") || p.q,
    }));
  }, [params]);

  const resultados = useMemo(() => {
    let r = publicados.filter(
      (p) =>
        (!f.cat || p.categoria === f.cat) &&
        (!f.cond || p.condicion === f.cond) &&
        (!f.marca || p.marca === f.marca) &&
        (!f.q ||
          p.nombre.toLowerCase().includes(f.q.toLowerCase()) ||
          p.marca.toLowerCase().includes(f.q.toLowerCase()))
    );
    if (f.orden === "destacados") r = [...r].sort((a, b) => Number(b.destacado) - Number(a.destacado));
    if (f.orden === "precio_asc") r = [...r].sort((a, b) => a.precio - b.precio);
    if (f.orden === "precio_desc") r = [...r].sort((a, b) => b.precio - a.precio);
    return r;
  }, [f, publicados]);

  useReveal();

  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const setCat = (cat: string) => {
    setF((p) => ({ ...p, cat }));
    const np = new URLSearchParams(params);
    if (cat) np.set("cat", cat);
    else np.delete("cat");
    setParams(np, { replace: true });
  };
  const limpiar = () => {
    setF({ cat: f.cat, cond: "", marca: "", q: "", orden: "destacados" });
    const np = new URLSearchParams();
    if (f.cat) np.set("cat", f.cat);
    setParams(np, { replace: true });
  };
  const hayFiltros = Boolean(f.cond || f.marca || f.q);

  const quitar = (k: "cond" | "marca" | "q") => {
    setF((p) => ({ ...p, [k]: "" }));
    const np = new URLSearchParams(params);
    np.delete(k);
    setParams(np, { replace: true });
  };
  const chips: { k: "cond" | "marca" | "q"; label: string }[] = [
    ...(f.cond ? [{ k: "cond" as const, label: f.cond === "usado" ? "Reacondicionados" : "Nuevos" }] : []),
    ...(f.marca ? [{ k: "marca" as const, label: f.marca }] : []),
    ...(f.q ? [{ k: "q" as const, label: `“${f.q}”` }] : []),
  ];

  return (
    <div className="min-h-screen bg-paper text-graph">
      <div className="grain" />
      <Navbar variant="solid" />

      <header className="container-x pt-32 pb-8">
        <p className="eyebrow">La tienda</p>
        <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-graph md:text-6xl">
          Electrodomésticos con respaldo
        </h1>
        <p className="mt-4 max-w-xl text-graph-500">
          Nuevos y reacondicionados con garantía por escrito. Todos los precios incluyen
          6 cuotas sin interés y 10% de descuento pagando en efectivo.
        </p>

        {/* Buscador */}
        <div className="mt-7 flex max-w-xl items-center gap-3 rounded-xl border border-graph/15 bg-paper-100 px-4 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15">
          <Search size={18} className="text-graph-400" />
          <input
            id="buscador-tienda"
            value={f.q}
            onChange={(e) => set("q", e.target.value)}
            placeholder="Buscar por producto o marca…"
            className="h-12 w-full bg-transparent text-sm text-graph outline-none placeholder:text-graph-400"
            aria-label="Buscar productos"
          />
          {f.q && (
            <button onClick={() => set("q", "")} className="text-graph-400 hover:text-graph" aria-label="Borrar búsqueda">
              <X size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Tabs de categoría + filtros */}
      <div className="sticky top-[64px] z-30 border-y border-graph/10 bg-paper/95 backdrop-blur">
        <div className="container-x flex flex-col gap-3 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setCat(t.key)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  f.cat === t.key ? "bg-brand text-white" : "bg-paper-200 text-graph-500 hover:bg-graph/5"
                }`}
              >
                {t.label} <span className="opacity-60">({t.n})</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 text-xs font-medium text-graph-400">
              <SlidersHorizontal size={14} /> Filtros
            </span>
            <FSelect
              value={f.cond}
              onChange={(v) => set("cond", v)}
              options={[{ v: "nuevo", l: "Nuevos" }, { v: "usado", l: "Reacondicionados" }]}
              ph="Condición"
            />
            <FSelect value={f.marca} onChange={(v) => set("marca", v)} options={marcas} ph="Marca" />
            <div className="ml-auto flex items-center gap-3">
              {hayFiltros && (
                <button onClick={limpiar} className="flex items-center gap-1 text-xs text-graph-500 hover:text-brand">
                  <X size={14} /> Limpiar
                </button>
              )}
              <FSelect
                value={f.orden}
                onChange={(v) => set("orden", v)}
                options={[
                  { v: "destacados", l: "Destacados" },
                  { v: "precio_asc", l: "Menor precio" },
                  { v: "precio_desc", l: "Mayor precio" },
                ]}
                ph="Ordenar"
                noEmpty
              />
            </div>
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pb-3">
              <span className="text-xs text-graph-400">Filtrando:</span>
              {chips.map((c) => (
                <button
                  key={c.k}
                  onClick={() => quitar(c.k)}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/[0.07] py-1 pl-3 pr-2 text-xs font-medium text-brand-700 transition hover:border-brand/50 hover:bg-brand/[0.12]"
                  title="Quitar este filtro"
                >
                  {c.label}
                  <X size={13} className="text-brand/50 transition group-hover:text-brand" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="py-12">
        <div className="container-x">
          <p className="mb-6 text-sm text-graph-500">
            {resultados.length} {resultados.length === 1 ? "producto" : "productos"}
          </p>
          {resultados.length === 0 ? (
            <div className="mx-auto max-w-lg py-20 text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand">
                <Search size={28} />
              </span>
              <p className="mt-5 font-display text-2xl text-graph">No encontramos nada con esa búsqueda</p>
              <p className="mt-2 text-graph-500">
                Pruebe quitando algún filtro, o escríbanos: si no está publicado, se lo conseguimos.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <button onClick={limpiar} className="btn-ghost">Ver todos los productos</button>
                <a href={WHATSAPP} target="_blank" rel="noreferrer" className="btn-primary">
                  Consultar por WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {resultados.map((p) => (
                <div key={p.id} className="reveal">
                  <ProductoCard p={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

type Opt = string | { v: string; l: string };
function FSelect({ value, onChange, options, ph, noEmpty }: { value: string; onChange: (v: string) => void; options: Opt[]; ph: string; noEmpty?: boolean }) {
  const opciones = [
    ...(noEmpty ? [] : [{ value: "", label: ph }]),
    ...options.map((o) => (typeof o === "string" ? { value: o, label: o } : { value: o.v, label: o.l })),
  ];
  return (
    <UISelect
      value={value}
      onChange={onChange}
      options={opciones}
      placeholder={ph}
      size="sm"
      className="min-w-[9.5rem]"
      triggerClassName="rounded-lg"
    />
  );
}
