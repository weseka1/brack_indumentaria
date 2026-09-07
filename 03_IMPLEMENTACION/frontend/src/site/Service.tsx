import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ClipboardList, Phone, ShieldCheck, Wrench } from "lucide-react";
import Navbar, { WHATSAPP } from "./components/Navbar";
import Footer from "./components/Footer";
import { PictogramaCategoria } from "./components/PlacaProducto";
import { useLenis } from "./lib/useLenis";
import { useSEO } from "./lib/seo";
import { useReveal } from "@/lib/hooks";
import { useData } from "@/lib/DataProvider";
import UISelect from "@/components/Select";
import { CATEGORIAS_PRODUCTO } from "@/data/types";
import type { CategoriaProducto, OrdenServicio } from "@/data/types";
import { hoyISO } from "@/lib/fechas";

// Nº de orden correlativo con las que ya viven en el panel (OS-2210 → OS-2211).
function proximoNumeroOrden(ordenes: OrdenServicio[]): string {
  const max = ordenes.reduce((a, o) => {
    const n = Number(String(o.id).replace(/\D/g, ""));
    return Number.isFinite(n) && n > a ? n : a;
  }, 2000);
  return `OS-${max + 1}`;
}

const WA_SERVICE =
  WHATSAPP +
  "?text=" +
  encodeURIComponent("Buenas, quisiera consultar por una reparación. Le paso marca, modelo y falla del equipo:");

export default function Service() {
  useLenis();
  useReveal();
  useSEO({
    titulo: "Service técnico · Brack Indumentaria, Bahía Blanca",
    descripcion:
      "Reparación de heladeras, freezers, lavarropas y línea blanca en Bahía Blanca. Más de 30 años de oficio, cualquier marca, presupuesto antes de trabajar. Solicite su reparación en línea.",
    path: "/service",
  });
  const { ordenes, addOrden, addLead } = useData();

  const [f, setF] = useState({ nombre: "", contacto: "", categoria: "" as CategoriaProducto | "", marcaModelo: "", falla: "" });
  const [error, setError] = useState("");
  const [ordenCreada, setOrdenCreada] = useState<string | null>(null);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.nombre.trim() || !f.contacto.trim() || !f.categoria || !f.falla.trim()) {
      setError("Complete nombre, contacto, tipo de equipo y la falla que presenta.");
      return;
    }
    setError("");
    const catLabel = CATEGORIAS_PRODUCTO.find((c) => c.key === f.categoria)?.label ?? "Equipo";
    const equipo = f.marcaModelo.trim() ? `${catLabel} ${f.marcaModelo.trim()}` : catLabel;
    const id = proximoNumeroOrden(ordenes);

    addOrden({
      id,
      fechaISO: hoyISO(),
      cliente: f.nombre.trim(),
      contacto: f.contacto.trim(),
      equipo,
      categoria: f.categoria,
      falla: f.falla.trim(),
      estado: "ingresada",
      tecnico: "A asignar",
      compradoEnAder: false,
      enGarantia: false,
      notas: "Solicitud ingresada desde la web. Confirmar visita o ingreso al taller.",
    });
    addLead({
      id: "LEAD-" + Date.now(),
      fechaISO: hoyISO(),
      nombre: f.nombre.trim(),
      contacto: f.contacto.trim(),
      productoId: null,
      interes: "service",
      canal: "web",
      estado: "nueva",
      asignado: "Sin asignar",
      notas: `Solicitud de service ${id}: ${equipo}. Falla: ${f.falla.trim()}`,
    });
    setOrdenCreada(id);
    window.scrollTo(0, 0);
  };

  // ── Éxito ──
  if (ordenCreada) {
    return (
      <div className="min-h-screen bg-paper text-graph">
        <div className="grain" />
        <Navbar variant="solid" />
        <div className="container-x grid min-h-[75vh] place-items-center py-28">
          <div className="w-full max-w-lg rounded-2xl border border-graph/10 bg-paper-100 p-10 text-center shadow-soft">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sea-50 text-sea">
              <Check size={30} />
            </span>
            <h1 className="mt-5 font-display text-3xl tracking-tight text-graph">Solicitud recibida</h1>
            <p className="mt-3 text-graph-500">
              Su orden de service quedó registrada con el número{" "}
              <span className="font-display font-semibold text-graph">{ordenCreada}</span>.
              Nos comunicamos a la brevedad para coordinar la visita del técnico o el ingreso
              del equipo al taller. El diagnóstico se confirma antes de hacer cualquier trabajo.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a href={WHATSAPP} target="_blank" rel="noreferrer" className="btn-primary">
                <Phone size={15} /> Adelantar por WhatsApp
              </a>
              <Link to="/" className="btn-ghost">Volver al inicio</Link>
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

      <header className="container-x pt-32 pb-4">
        <p className="eyebrow reveal flex items-center gap-2"><Wrench size={15} /> Service técnico</p>
        <h1 className="reveal mt-3 max-w-3xl font-display text-4xl font-medium tracking-tight text-graph md:text-6xl">
          El taller donde empezó todo
        </h1>
        <p className="reveal mt-6 max-w-2xl text-lg leading-relaxed text-graph-500" data-delay="100ms">
          Brack nació como taller de reparación de heladeras y lavarropas hace más de 30 años,
          y ese taller sigue siendo el corazón del negocio. Llevamos más de mil reparaciones
          realizadas en Bahía Blanca. Por eso, cuando compra un equipo acá, no queda solo:
          el mismo taller que lo eligió para la venta es el que responde si algún día hace falta.
        </p>
        <div className="reveal mt-8 flex flex-wrap gap-x-10 gap-y-4 border-y border-graph/10 py-6" data-delay="160ms">
          {[
            { n: "+30", l: "años de oficio" },
            { n: "+1.000", l: "reparaciones realizadas" },
            { n: "Todas", l: "las marcas del mercado" },
          ].map((s) => (
            <div key={s.l}>
              <p className="font-display text-3xl font-semibold tracking-tight text-brand">{s.n}</p>
              <p className="mt-1 text-sm text-graph-500">{s.l}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="container-x grid gap-12 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        {/* Qué reparamos + cómo trabaja el taller */}
        <div className="space-y-10">
          <div className="reveal">
            <h2 className="font-display text-2xl font-medium tracking-tight text-graph">Qué reparamos</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CATEGORIAS_PRODUCTO.map((c) => (
                <div key={c.key} className="flex items-center gap-3 rounded-xl border border-graph/10 bg-paper-100 px-4 py-3">
                  <span className="text-graph/[0.35]">
                    <PictogramaCategoria categoria={c.key} size={26} strokeWidth={1.5} />
                  </span>
                  <span className="text-sm font-medium text-graph-700">{c.plural}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-graph-500">
              De cualquier marca, lo haya comprado acá o no. Si el equipo es de Brack,
              su historial ya está en el sistema y la garantía se aplica sola.
            </p>
          </div>

          <div className="reveal rounded-2xl border border-graph/10 bg-paper-100 p-7">
            <p className="text-xs uppercase tracking-widest2 text-graph-400">Cómo trabajamos</p>
            <ol className="mt-5 space-y-5">
              {[
                { t: "Nos cuenta la falla", d: "Por este formulario o por WhatsApp, con marca y modelo si los tiene a mano." },
                { t: "Coordinamos", d: "Visita del técnico a domicilio o ingreso del equipo al taller de Santa Fe 85." },
                { t: "Presupuesto primero", d: "El número se confirma antes de tocar nada, para que decida con el dato en mano." },
                { t: "Reparación con garantía", d: "Se prueba en banco y se entrega. Todo queda registrado en su orden." },
              ].map((p, i) => (
                <li key={p.t} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-brand/25 font-display text-sm font-semibold text-brand">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-graph">{p.t}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-graph-500">{p.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 flex items-center gap-2 border-t border-graph/10 pt-5 text-sm text-graph-500">
              <ShieldCheck size={16} className="shrink-0 text-brand" />
              Diagnóstico sin compromiso: si el arreglo no conviene, se lo decimos.
            </p>
          </div>
        </div>

        {/* Formulario: lo mínimo, cada campo extra es caída de conversión */}
        <form onSubmit={enviar} className="reveal rounded-2xl border border-graph/10 bg-paper-100 p-7 shadow-card md:p-8" data-delay="120ms">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand">
              <ClipboardList size={20} strokeWidth={1.8} />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-graph">Solicitar reparación</h2>
              <p className="text-sm text-graph-500">Le confirmamos la visita a la brevedad.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <Campo label="Nombre y apellido" placeholder="Su nombre" value={f.nombre} onChange={(v) => setF({ ...f, nombre: v })} />
            <Campo label="WhatsApp" placeholder="+54 9 291 ..." value={f.contacto} onChange={(v) => setF({ ...f, contacto: v })} />
            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-widest2 text-graph-400">Tipo de equipo</span>
              <UISelect
                value={f.categoria}
                onChange={(v) => setF({ ...f, categoria: v as CategoriaProducto })}
                placeholder="Elegir el equipo"
                options={CATEGORIAS_PRODUCTO.map((c) => ({ value: c.key, label: c.label }))}
              />
            </label>
            <Campo
              label="Marca y modelo (si lo sabe)"
              placeholder="Ej: Drean Next 8.06, figura en la etiqueta del equipo"
              value={f.marcaModelo}
              onChange={(v) => setF({ ...f, marcaModelo: v })}
            />
            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-widest2 text-graph-400">Qué falla presenta</span>
              <textarea
                rows={4}
                value={f.falla}
                onChange={(e) => setF({ ...f, falla: e.target.value })}
                placeholder="Ej: no enfría abajo, hace escarcha en el freezer, pierde agua al centrifugar..."
                className="w-full rounded-lg border border-graph/15 bg-paper-100 px-4 py-3 text-sm text-graph outline-none transition placeholder:text-graph-400 focus:border-brand"
              />
            </label>
          </div>

          {error && <p className="mt-4 text-sm font-medium text-brand">{error}</p>}

          <button type="submit" className="btn-primary mt-6 w-full">
            Solicitar service <ArrowRight size={16} />
          </button>
          <p className="mt-4 text-center text-sm text-graph-500">
            ¿Prefiere hablarlo directo?{" "}
            <a href={WA_SERVICE} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline">
              Escríbanos por WhatsApp
            </a>
          </p>
        </form>
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
