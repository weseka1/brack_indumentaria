import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, LayoutGrid, List, Star, AlertTriangle, Trash2, ExternalLink } from "lucide-react";
import { useData } from "@/lib/DataProvider";
import type { Producto } from "@/data/types";
import { CATEGORIAS_PRODUCTO, valorCuota, precioEfectivo } from "@/data/types";
import { fmtARS } from "@/lib/format";
import { PageHeader, EmptyState } from "../components/PageShell";
import { SearchInput, FilterSelect, Btn } from "../components/Controls";
import Badge from "../components/Badge";
import Drawer from "../components/Drawer";
import ProductoThumb from "../components/ProductoThumb";
import { useToast } from "../components/Toast";
import { condicionProducto } from "../ui/estados";
import { cn } from "../ui/cn";

const catLabel = (cat: string) => CATEGORIAS_PRODUCTO.find((c) => c.key === cat)?.label ?? cat;

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

export default function Productos() {
  const { productos, getProducto, updateProducto, deleteProducto, kpis } = useData();
  const { push } = useToast();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  useEffect(() => { const p = params.get("q"); if (p !== null) setQ(p); }, [params]);
  const [cat, setCat] = useState("todas");
  const [cond, setCond] = useState("todas");
  const [pub, setPub] = useState("todos");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selId, setSelId] = useState<string | null>(null);

  // El drawer resuelve el producto EN VIVO desde el contexto → refleja ediciones al instante.
  const sel = selId ? getProducto(selId) ?? null : null;

  const filtrados = useMemo(() => {
    return productos.filter((p) => {
      if (q && !`${p.nombre} ${p.marca} ${p.id}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (cat !== "todas" && p.categoria !== cat) return false;
      if (cond !== "todas" && p.condicion !== cond) return false;
      if (pub === "publicados" && !p.publicado) return false;
      if (pub === "borradores" && p.publicado) return false;
      if (pub === "stock_bajo" && !(p.publicado && p.stock <= 1)) return false;
      return true;
    });
  }, [productos, q, cat, cond, pub]);

  const togglePublicado = (p: Producto, v: boolean) => {
    updateProducto(p.id, { publicado: v });
    push(v ? `"${p.nombre}" publicado en la tienda` : `"${p.nombre}" pasó a borrador (no sale en la web)`, "info");
  };

  return (
    <div>
      <PageHeader
        title="Productos y stock"
        subtitle={`${productos.length} en catálogo · ${kpis.productosPublicados} publicados · ${kpis.stockBajo} con stock bajo`}
        actions={
          <Link
            to="/panel/cargar"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-600 hover:shadow-soft"
          >
            <Plus size={16} /> Cargar producto
          </Link>
        }
      />

      {/* toolbar */}
      <div className="pcard mb-5 flex flex-wrap items-center gap-2.5 p-3">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar por nombre, marca o ID…" className="min-w-[220px] flex-1" />
        <FilterSelect
          value={cat}
          onChange={setCat}
          options={[
            { value: "todas", label: "Categoría: todas" },
            ...CATEGORIAS_PRODUCTO.map((c) => ({ value: c.key, label: c.plural })),
          ]}
        />
        <FilterSelect
          value={cond}
          onChange={setCond}
          options={[
            { value: "todas", label: "Condición: todas" },
            { value: "nuevo", label: "Nuevos" },
            { value: "usado", label: "Reacondicionados" },
          ]}
        />
        <FilterSelect
          value={pub}
          onChange={setPub}
          options={[
            { value: "todos", label: "Estado: todos" },
            { value: "publicados", label: "Publicados" },
            { value: "borradores", label: "Borradores" },
            { value: "stock_bajo", label: "Stock bajo" },
          ]}
        />
        <div className="ml-auto flex items-center gap-1 rounded-xl border border-graph/10 p-1">
          <button
            onClick={() => setView("grid")}
            className={cn("rounded-lg p-1.5 transition", view === "grid" ? "bg-brand text-white" : "text-graph-400 hover:text-graph")}
            aria-label="Grilla"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn("rounded-lg p-1.5 transition", view === "list" ? "bg-brand text-white" : "text-graph-400 hover:text-graph")}
            aria-label="Lista"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState msg="No hay productos que coincidan con los filtros." />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((p) => {
            const cd = condicionProducto[p.condicion];
            const sinStock = p.stock <= 0;
            const stockBajo = p.stock === 1;
            return (
              <button
                key={p.id}
                onClick={() => setSelId(p.id)}
                className="group pcard pcard-hover overflow-hidden text-left"
              >
                <div className="relative">
                  <ProductoThumb
                    src={p.fotos?.[0]}
                    marca={p.marca}
                    categoria={p.categoria}
                    alt={p.nombre}
                    rounded="rounded-none"
                    className="h-44 w-full"
                    placa
                  />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    {p.condicion === "usado" && <Badge tone={cd.tone} className="bg-white/90 backdrop-blur">{cd.label}</Badge>}
                    {p.destacado && (
                      <Badge tone="brand" className="bg-white/90 backdrop-blur">
                        <Star size={10} className="fill-current" /> Destacado
                      </Badge>
                    )}
                    {sinStock && <Badge tone="red" className="bg-white/90 backdrop-blur">Sin stock</Badge>}
                    {!p.publicado && <Badge tone="neutral" className="bg-white/90 backdrop-blur">Borrador</Badge>}
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="rounded-lg bg-white/92 px-2.5 py-1 font-display text-sm font-semibold text-graph shadow-soft backdrop-blur">
                      {fmtARS(p.precio, { short: true })}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-1 font-display text-base font-semibold text-graph">{p.nombre}</h3>
                  <p className="mt-1 text-xs text-graph-400">
                    {p.marca} · {catLabel(p.categoria)} · {p.cuotas} cuotas de {fmtARS(valorCuota(p), { short: true })}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-graph/[0.07] pt-3 text-xs">
                    <span className={cn("inline-flex items-center gap-1 font-semibold", sinStock || stockBajo ? "text-red-700" : "text-graph-500")}>
                      {(sinStock || stockBajo) && <AlertTriangle size={12} />}
                      Stock: {p.stock}
                    </span>
                    <span className="text-graph-400">{p.vendidos} vendidos</span>
                    <span className="inline-flex items-center gap-1.5 text-graph-400">
                      Publicado <Switch on={p.publicado} onChange={(v) => togglePublicado(p, v)} title={p.publicado ? "Sacar de la web" : "Publicar en la web"} />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="pcard overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-graph/[0.07] bg-graph/[0.03] text-left text-xs font-semibold uppercase tracking-wide text-graph-400">
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Condición</th>
                  <th className="px-4 py-3 text-right">Precio</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  <th className="px-4 py-3 text-center">Vendidos</th>
                  <th className="px-4 py-3 text-center">Publicado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graph/[0.07]">
                {filtrados.map((p) => {
                  const cd = condicionProducto[p.condicion];
                  const alerta = p.stock <= 1;
                  return (
                    <tr key={p.id} onClick={() => setSelId(p.id)} className="cursor-pointer transition hover:bg-graph/[0.03]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductoThumb src={p.fotos?.[0]} marca={p.marca} categoria={p.categoria} alt="" className="h-10 w-14 shrink-0 ring-1 ring-graph/10" />
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-semibold text-graph">{p.nombre}</p>
                            <p className="text-xs text-graph-400">{p.id} · {p.marca}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-graph-500">{catLabel(p.categoria)}</td>
                      <td className="px-4 py-3"><Badge tone={cd.tone}>{cd.label}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-display font-semibold text-graph">{fmtARS(p.precio, { short: true })}</p>
                        <p className="text-[11px] text-graph-400">{p.cuotas} × {fmtARS(valorCuota(p), { short: true })}</p>
                      </td>
                      <td className={cn("px-4 py-3 text-center font-semibold", alerta ? "text-red-700" : "text-graph")}>
                        <span className="inline-flex items-center gap-1">{alerta && <AlertTriangle size={12} />}{p.stock}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-graph-500">{p.vendidos}</td>
                      <td className="px-4 py-3 text-center">
                        <Switch on={p.publicado} onChange={(v) => togglePublicado(p, v)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== Editar producto ===== */}
      <ProductoDrawer
        producto={sel}
        onClose={() => setSelId(null)}
        onUpdate={(id, patch) => { updateProducto(id, patch); push("Producto actualizado", "success"); }}
        onDelete={(p) => {
          if (!window.confirm(`¿Eliminar "${p.nombre}" del catálogo? No se puede deshacer.`)) return;
          deleteProducto(p.id);
          setSelId(null);
          push("Producto eliminado del catálogo", "info");
        }}
      />
    </div>
  );
}

/* ===================== Drawer de edición ===================== */

const INP = "h-10 w-full rounded-xl border border-graph/15 bg-paper-100 px-3 text-sm text-graph outline-none transition placeholder:text-graph-400 focus:border-brand/60 focus:bg-white focus:ring-2 focus:ring-brand/15";

function ProductoDrawer({
  producto,
  onClose,
  onUpdate,
  onDelete,
}: {
  producto: Producto | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Producto>) => void;
  onDelete: (p: Producto) => void;
}) {
  const [f, setF] = useState({ precio: "", stock: "", cuotas: "", destacado: false, publicado: true });
  useEffect(() => {
    if (producto) {
      setF({
        precio: String(producto.precio),
        stock: String(producto.stock),
        cuotas: String(producto.cuotas),
        destacado: producto.destacado,
        publicado: producto.publicado,
      });
    }
  }, [producto?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!producto) return <Drawer open={false} onClose={onClose}><span /></Drawer>;

  const p = producto;
  const cd = condicionProducto[p.condicion];
  const cambios =
    Number(f.precio) !== p.precio ||
    Number(f.stock) !== p.stock ||
    Number(f.cuotas) !== p.cuotas ||
    f.destacado !== p.destacado ||
    f.publicado !== p.publicado;

  const guardar = () => {
    onUpdate(p.id, {
      precio: Math.max(0, Number(f.precio) || 0),
      stock: Math.max(0, Number(f.stock) || 0),
      cuotas: Math.max(1, Number(f.cuotas) || 1),
      destacado: f.destacado,
      publicado: f.publicado,
    });
  };

  const preview: Producto = { ...p, precio: Number(f.precio) || 0, cuotas: Number(f.cuotas) || 1 };

  return (
    <Drawer open onClose={onClose}>
      <div className="p-6">
        <ProductoThumb src={p.fotos?.[0]} marca={p.marca} categoria={p.categoria} alt={p.nombre} rounded="rounded-2xl" className="h-52 w-full" placa />

        <div className="mt-4 flex flex-wrap items-center gap-2 pr-8">
          <h2 className="font-display text-xl font-semibold text-graph">{p.nombre}</h2>
        </div>
        <p className="mt-1 text-sm text-graph-400">
          {p.id} · {p.marca} · {catLabel(p.categoria)}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone={cd.tone}>{cd.label}</Badge>
          <Badge tone="neutral">Garantía {p.garantiaMeses} meses</Badge>
          <Badge tone="neutral">{p.vendidos} vendidos</Badge>
        </div>

        {p.descripcion && <p className="mt-4 text-sm leading-relaxed text-graph-500">{p.descripcion}</p>}

        {p.specs.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {p.specs.map((s, i) => (
              <div key={i} className="rounded-xl border border-graph/[0.07] bg-graph/[0.03] px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-graph-400">{s.rotulo}</p>
                <p className="mt-0.5 truncate text-sm font-medium text-graph">{s.valor}</p>
              </div>
            ))}
          </div>
        )}

        {/* edición */}
        <div className="mt-5 rounded-2xl border border-graph/[0.08] bg-graph/[0.02] p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-graph-400">Editar</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <label className="block col-span-2 sm:col-span-1">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-graph-400">Precio (ARS)</span>
              <input value={f.precio} onChange={(e) => setF((s) => ({ ...s, precio: e.target.value.replace(/[^\d]/g, "") }))} inputMode="numeric" className={INP} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-graph-400">Stock</span>
              <input value={f.stock} onChange={(e) => setF((s) => ({ ...s, stock: e.target.value.replace(/[^\d]/g, "") }))} inputMode="numeric" className={INP} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-graph-400">Cuotas</span>
              <input value={f.cuotas} onChange={(e) => setF((s) => ({ ...s, cuotas: e.target.value.replace(/[^\d]/g, "") }))} inputMode="numeric" className={INP} />
            </label>
          </div>
          <p className="mt-2 text-xs text-graph-400">
            Queda: {fmtARS(preview.precio)} · {preview.cuotas} cuotas de {fmtARS(valorCuota(preview))} · {fmtARS(precioEfectivo(preview))} en efectivo
          </p>
          <div className="mt-3 space-y-1">
            <label className="flex min-h-[40px] items-center justify-between text-sm text-graph">
              Destacado en la portada
              <Switch on={f.destacado} onChange={(v) => setF((s) => ({ ...s, destacado: v }))} />
            </label>
            <label className="flex min-h-[40px] items-center justify-between text-sm text-graph">
              Publicado en la tienda
              <Switch on={f.publicado} onChange={(v) => setF((s) => ({ ...s, publicado: v }))} />
            </label>
          </div>
          <button
            onClick={guardar}
            disabled={!cambios}
            className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-40"
          >
            Guardar cambios
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-graph/[0.07] pt-4">
          <Link to={`/producto/${p.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline">
            <ExternalLink size={13} /> Ver en la tienda
          </Link>
          <button
            onClick={() => onDelete(p)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-graph-400 transition hover:bg-red-500/10 hover:text-red-600"
          >
            <Trash2 size={14} /> Eliminar
          </button>
        </div>
      </div>
    </Drawer>
  );
}
