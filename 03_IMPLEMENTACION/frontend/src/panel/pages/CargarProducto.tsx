import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, ImagePlus, X, Loader2, Check, Plus, Package, ClipboardList, Link2, ShieldCheck } from "lucide-react";
import { useData } from "@/lib/DataProvider";
import { useToast } from "../components/Toast";
import { PageHeader } from "../components/PageShell";
import Select from "@/components/Select";
import { aDataUrlComprimida } from "@/lib/imagenes";
import { hoyISO } from "@/lib/fechas";
import { fmtARS } from "@/lib/format";
import type { Producto, CategoriaProducto, CondicionProducto } from "@/data/types";
import { CATEGORIAS_PRODUCTO, valorCuota, precioEfectivo } from "@/data/types";

type SpecForm = { rotulo: string; valor: string };

export default function CargarProducto() {
  const { addProducto } = useData();
  const { push } = useToast();
  const navigate = useNavigate();

  const [f, setF] = useState({
    nombre: "",
    marca: "",
    categoria: "heladera" as CategoriaProducto,
    condicion: "nuevo" as CondicionProducto,
    precio: "",
    cuotas: "6",
    descuentoEfectivoPct: "10",
    stock: "1",
    garantiaMeses: "12",
    descripcion: "",
    destacado: false,
    publicado: true,
  });
  const [specs, setSpecs] = useState<SpecForm[]>([{ rotulo: "", valor: "" }]);
  const [fotos, setFotos] = useState<string[]>([]);
  const [fotoUrl, setFotoUrl] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const set = (k: keyof typeof f, v: any) => setF((p) => ({ ...p, [k]: v }));
  const setNum = (k: keyof typeof f, v: string) => set(k, v.replace(/[^\d]/g, ""));

  // Al cambiar la condición, la garantía acompaña la regla real de Brack
  // (12 meses los nuevos, 6 los reacondicionados del taller). Editable igual.
  const setCondicion = (c: CondicionProducto) =>
    setF((p) => ({ ...p, condicion: c, garantiaMeses: c === "usado" ? "6" : "12" }));

  const setSpec = (i: number, k: keyof SpecForm, v: string) =>
    setSpecs((prev) => prev.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  const addSpec = () => setSpecs((prev) => [...prev, { rotulo: "", valor: "" }]);
  const delSpec = (i: number) => setSpecs((prev) => prev.filter((_, j) => j !== i));

  const agregarFotoUrl = () => {
    const url = fotoUrl.trim();
    if (!url) return;
    setFotos((p) => [...p, url]);
    setFotoUrl("");
  };

  // Sin Storage, la foto se achica y se guarda como dataURL dentro del navegador
  // (igual que hacía el enlatado: sobrevive al cierre de la pestaña).
  const subirLote = async (lista: File[], aviso = "Fotos cargadas") => {
    if (!lista.length) return;
    setSubiendo(true);
    for (const file of lista) {
      try {
        const dataUrl = await aDataUrlComprimida(file);
        setFotos((p) => [...p, dataUrl]);
      } catch {
        setFotos((p) => [...p, URL.createObjectURL(file)]);
      }
    }
    setSubiendo(false);
    push(aviso, "success");
  };
  const subirArchivos = (files: FileList | null) => files && subirLote(Array.from(files));

  // Ctrl+V en cualquier lado de la página: si el portapapeles trae una IMAGEN
  // (copiada de Google, WhatsApp, donde sea), entra directo al catálogo sin
  // descargar nada. Si trae texto, no interfiere (pega normal en los campos).
  const subirLoteRef = useRef(subirLote);
  subirLoteRef.current = subirLote;
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imagenes = Array.from(items)
        .filter((it) => it.kind === "file" && it.type.startsWith("image/"))
        .map((it) => it.getAsFile())
        .filter((f): f is File => !!f);
      if (!imagenes.length) return;
      e.preventDefault();
      void subirLoteRef.current(imagenes, imagenes.length > 1 ? "Imágenes pegadas" : "Imagen pegada");
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);

  const numero = (v: string, fallback = 0) => (v === "" ? fallback : Number(v));

  const previewPrecio = (): Producto | null => {
    const precio = numero(f.precio);
    if (!precio) return null;
    return {
      precio,
      cuotas: Math.max(1, numero(f.cuotas, 6)),
      descuentoEfectivoPct: numero(f.descuentoEfectivoPct, 10),
    } as Producto;
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.nombre.trim() || !numero(f.precio)) {
      push("Completá al menos el nombre y el precio", "info");
      return;
    }
    const p: Producto = {
      id: "Brack-" + Date.now().toString(36).toUpperCase(),
      nombre: f.nombre.trim(),
      marca: f.marca.trim() || "Sin marca",
      categoria: f.categoria,
      condicion: f.condicion,
      precio: numero(f.precio),
      cuotas: Math.max(1, numero(f.cuotas, 6)),
      descuentoEfectivoPct: numero(f.descuentoEfectivoPct, 10),
      stock: numero(f.stock, 0),
      fotos,
      descripcion: f.descripcion.trim(),
      specs: specs
        .map((s) => ({ rotulo: s.rotulo.trim(), valor: s.valor.trim() }))
        .filter((s) => s.rotulo && s.valor),
      garantiaMeses: numero(f.garantiaMeses, f.condicion === "usado" ? 6 : 12),
      destacado: f.destacado,
      publicado: f.publicado,
      vendidos: 0,
      altaISO: hoyISO(),
    };
    await addProducto(p);
    setGuardado(true);
    push(f.publicado ? "Producto publicado — ya está en la tienda" : "Producto guardado como borrador", "success");
    setTimeout(() => navigate("/panel/productos"), 1400);
  };

  if (guardado) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="pcard max-w-md p-10 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sea/10 text-sea"><Check size={32} /></span>
          <h2 className="mt-5 font-display text-2xl text-graph">Producto cargado</h2>
          <p className="mt-2 text-sm text-graph-400">
            {f.publicado ? "Ya quedó guardado y visible en la tienda." : "Quedó como borrador, listo para publicar cuando quieras."} Te llevo al catálogo…
          </p>
        </div>
      </div>
    );
  }

  const pv = previewPrecio();

  return (
    <form onSubmit={guardar}>
      <PageHeader
        title="Cargar producto"
        subtitle="Alta de un electrodoméstico al catálogo: datos, precio en cuotas, stock y fotos."
        actions={
          <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-600">
            <UploadCloud size={16} /> Guardar producto
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* ===== Columna izquierda: datos ===== */}
        <div className="min-w-0 space-y-6">
          {/* Básicos */}
          <section className="pcard p-5">
            <h3 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-graph"><Package size={16} className="text-brand" /> Datos principales</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Nombre del producto" full>
                <Inp value={f.nombre} onChange={(v) => set("nombre", v)} ph="Ej: Heladera Patrick 388 L Cycle Defrost" autoFocus />
              </Campo>
              <Campo label="Marca">
                <Inp value={f.marca} onChange={(v) => set("marca", v)} ph="Patrick, Drean, Gafa…" />
              </Campo>
              <Campo label="Categoría">
                <Select
                  value={f.categoria}
                  onChange={(v) => set("categoria", v as CategoriaProducto)}
                  options={CATEGORIAS_PRODUCTO.map((c) => ({ value: c.key, label: c.label }))}
                />
              </Campo>
            </div>
            <div className="mt-4">
              <SubLabel>Condición</SubLabel>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { v: "nuevo", l: "Nuevo" },
                  { v: "usado", l: "Usado reacondicionado" },
                ] as const).map((o) => (
                  <button
                    type="button"
                    key={o.v}
                    onClick={() => setCondicion(o.v)}
                    className={`min-h-[40px] rounded-lg border px-3 py-1.5 text-xs font-medium transition ${f.condicion === o.v ? "border-brand bg-brand text-white" : "border-graph/15 bg-graph/[0.03] text-graph-500 hover:border-brand/40 hover:text-graph"}`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
              {f.condicion === "usado" && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
                  <ShieldCheck size={13} /> Revisado por el taller, con garantía escrita de {f.garantiaMeses || 6} meses.
                </p>
              )}
            </div>
          </section>

          {/* Precio y stock */}
          <section className="pcard p-5">
            <h3 className="mb-4 font-display text-base font-semibold text-graph">Precio, cuotas y stock</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Campo label="Precio de lista (ARS)">
                <Inp value={f.precio} onChange={(v) => setNum("precio", v)} ph="450000" mode="numeric" />
              </Campo>
              <Campo label="Cuotas sin interés">
                <Inp value={f.cuotas} onChange={(v) => setNum("cuotas", v)} ph="6" mode="numeric" />
              </Campo>
              <Campo label="Desc. efectivo (%)">
                <Inp value={f.descuentoEfectivoPct} onChange={(v) => setNum("descuentoEfectivoPct", v)} ph="10" mode="numeric" />
              </Campo>
              <Campo label="Stock">
                <Inp value={f.stock} onChange={(v) => setNum("stock", v)} ph="1" mode="numeric" />
              </Campo>
              <Campo label="Garantía (meses)">
                <Inp value={f.garantiaMeses} onChange={(v) => setNum("garantiaMeses", v)} ph={f.condicion === "usado" ? "6" : "12"} mode="numeric" />
              </Campo>
            </div>
            {pv && (
              <p className="mt-3 rounded-xl bg-graph/[0.03] px-3 py-2.5 text-xs text-graph-500 ring-1 ring-inset ring-graph/[0.06]">
                Se publica: <b className="text-graph">{fmtARS(pv.precio)}</b> · {pv.cuotas} cuotas sin interés de <b className="text-graph">{fmtARS(valorCuota(pv))}</b> · <b className="text-graph">{fmtARS(precioEfectivo(pv))}</b> en efectivo
              </p>
            )}
          </section>

          {/* Specs */}
          <section className="pcard p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold text-graph"><ClipboardList size={16} className="text-brand" /> Ficha técnica</h3>
              <button type="button" onClick={addSpec} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-graph/20 px-3 text-xs font-semibold text-graph-500 transition hover:border-brand hover:text-brand">
                <Plus size={14} /> Agregar dato
              </button>
            </div>
            <div className="space-y-2.5">
              {specs.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={s.rotulo}
                    onChange={(e) => setSpec(i, "rotulo", e.target.value)}
                    placeholder="Rótulo (ej: Capacidad)"
                    className="h-10 w-2/5 min-w-0 rounded-xl border border-graph/10 bg-graph/[0.04] px-3 text-sm text-graph placeholder:text-graph-400 outline-none transition focus:border-brand/60"
                  />
                  <input
                    value={s.valor}
                    onChange={(e) => setSpec(i, "valor", e.target.value)}
                    placeholder="Valor (ej: 388 litros)"
                    className="h-10 min-w-0 flex-1 rounded-xl border border-graph/10 bg-graph/[0.04] px-3 text-sm text-graph placeholder:text-graph-400 outline-none transition focus:border-brand/60"
                  />
                  <button
                    type="button"
                    onClick={() => delSpec(i)}
                    title="Quitar"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-graph-400 transition hover:bg-red-500/10 hover:text-red-600"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Descripción */}
          <section className="pcard p-5">
            <h3 className="mb-4 font-display text-base font-semibold text-graph">Descripción</h3>
            <textarea
              value={f.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
              rows={4}
              placeholder="Describí el producto: estado, qué incluye, por qué conviene…"
              className="w-full rounded-xl border border-graph/10 bg-graph/[0.04] p-3 text-sm text-graph outline-none transition placeholder:text-graph-400 focus:border-brand/60"
            />
          </section>
        </div>

        {/* ===== Columna derecha: fotos + publicación ===== */}
        <div className="min-w-0 space-y-6">
          {/* Fotos */}
          <section className="pcard p-5">
            <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-graph"><ImagePlus size={16} className="text-brand" /> Fotos</h3>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-graph/15 bg-graph/[0.02] py-8 text-center transition hover:border-brand/50 hover:bg-graph/[0.04]">
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => subirArchivos(e.target.files)} />
              {subiendo ? <Loader2 size={24} className="animate-spin text-brand" /> : <UploadCloud size={24} className="text-graph-400" />}
              <span className="text-sm font-medium text-graph-500">{subiendo ? "Cargando…" : "Arrastrá, hacé clic o pegá con Ctrl+V"}</span>
              <span className="text-xs text-graph-400">JPG, PNG — varias a la vez</span>
            </label>
            <div className="mt-3 flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Link2 size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graph-400" />
                <input
                  value={fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregarFotoUrl(); } }}
                  placeholder="…o pegá la URL de una foto"
                  className="h-10 w-full rounded-xl border border-graph/10 bg-graph/[0.04] pl-9 pr-3 text-sm text-graph placeholder:text-graph-400 outline-none transition focus:border-brand/60"
                />
              </div>
              <button type="button" onClick={agregarFotoUrl} className="inline-flex h-10 shrink-0 items-center rounded-xl border border-graph/15 px-3 text-xs font-semibold text-graph-500 transition hover:border-brand/40 hover:text-brand">
                Agregar
              </button>
            </div>
            {fotos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {fotos.map((src, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-lg bg-paper-200 ring-1 ring-graph/10">
                    <img src={src} alt="" className="aspect-square w-full object-contain" />
                    <button type="button" onClick={() => setFotos((p) => p.filter((_, j) => j !== i))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-graph/80 text-white opacity-0 transition group-hover:opacity-100">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-[11px] leading-snug text-graph-400">
              Tip: en Google Imágenes, clic derecho sobre la foto → "Copiar imagen" → volvé acá y apretá Ctrl+V. Entra sola, sin descargar nada.
            </p>
            <p className="mt-1.5 text-[11px] leading-snug text-graph-400">
              Sin foto, el producto sale con una placa tipográfica prolija (marca + categoría). Nunca se inventa una imagen.
            </p>
          </section>

          {/* Publicación */}
          <section className="pcard p-5">
            <h3 className="mb-3 font-display text-base font-semibold text-graph">Publicación</h3>
            <div className="space-y-2.5">
              <Toggle label="Destacar en la portada" v={f.destacado} on={() => set("destacado", !f.destacado)} />
              <Toggle label="Publicar en la tienda" v={f.publicado} on={() => set("publicado", !f.publicado)} />
            </div>
            <div className="mt-4 rounded-xl border border-brand/20 bg-brand/[0.05] p-3 text-xs text-graph-500">
              {f.publicado
                ? "Al guardar, el producto queda visible en la tienda y en el buscador del sitio al instante."
                : "Queda como borrador interno: no sale en la web hasta que lo publiques."}
            </div>
            <button type="submit" className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white transition hover:bg-brand-600">
              <UploadCloud size={16} /> Guardar producto
            </button>
          </section>
        </div>
      </div>
    </form>
  );
}

// ----- piezas de formulario -----
function Campo({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-full" : ""}`}>
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest2 text-graph-400">{label}</span>
      {children}
    </label>
  );
}
function SubLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-[11px] font-medium uppercase tracking-widest2 text-graph-400">{children}</span>;
}
function Inp({ value, onChange, ph, mode, autoFocus }: { value: string; onChange: (v: string) => void; ph?: string; mode?: "numeric"; autoFocus?: boolean }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={ph}
      inputMode={mode}
      autoFocus={autoFocus}
      className="h-10 w-full rounded-xl border border-graph/10 bg-graph/[0.04] px-3 text-sm text-graph placeholder:text-graph-400 outline-none transition focus:border-brand/60"
    />
  );
}
function Toggle({ label, v, on }: { label: string; v: boolean; on: () => void }) {
  return (
    <button type="button" onClick={on} className="flex min-h-[40px] w-full items-center justify-between rounded-lg px-1 py-1.5 text-sm text-graph">
      <span>{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition ${v ? "bg-brand" : "bg-graph/15"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${v ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}
