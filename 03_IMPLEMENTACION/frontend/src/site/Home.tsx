import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import {
  ArrowRight, ShieldCheck, MapPin, Phone, Mail, Clock, Check, Wrench,
  CreditCard, Truck, Store, Instagram,
} from "lucide-react";
import Navbar, { WHATSAPP } from "./components/Navbar";
import Footer from "./components/Footer";
import ProductoCard from "./components/ProductoCard";
import { PictogramaCategoria } from "./components/PlacaProducto";
import { useLenis } from "./lib/useLenis";
import { useSEO } from "./lib/seo";
import { useReveal } from "@/lib/hooks";
import { useData } from "@/lib/DataProvider";
import { valorCuota } from "@/data/types";
import { fmtARS } from "@/lib/format";
import { hoyISO } from "@/lib/fechas";
import type { Lead } from "@/data/types";

const MAPS = "https://maps.google.com/?q=Santa+Fe+85,+Bahía+Blanca";
const WA_MAYORISTA =
  WHATSAPP +
  "?text=" +
  encodeURIComponent(
    "Buenas, quisiera solicitar el alta como revendedor mayorista de Brack. Le paso los datos de mi comercio:"
  );

// El proceso real del taller (sale de las plantillas de WhatsApp aprobadas).
const pasosTaller = [
  { t: "Ingreso y diagnóstico", d: "El equipo entra al taller o coordinamos la visita del técnico." },
  { t: "Presupuesto antes de tocar nada", d: "El número se confirma primero, para que decida con el dato en mano." },
  { t: "Reparación y prueba en banco", d: "Se repara, se prueba en funcionamiento y recién ahí se avisa." },
  { t: "Entrega con garantía", d: "Cada trabajo queda registrado en su orden de service." },
];

const porQueAder = [
  {
    icon: Wrench,
    t: "El que le vende, se lo arregla",
    d: "El taller está en el mismo local. Si algún día el equipo falla, no hay 0800 ni tickets: responde el mismo taller que se lo vendió.",
  },
  {
    icon: ShieldCheck,
    t: "Garantía por escrito",
    d: "Los equipos nuevos con garantía oficial y los reacondicionados con garantía escrita de 6 meses, firmada por la casa.",
  },
  {
    icon: MapPin,
    t: "Trato directo, local a la calle",
    d: "Santa Fe 85, Bahía Blanca. Puede pasar, ver el equipo y hablar con Marcos. Atendido por sus dueños desde hace 30 años.",
  },
];

export default function Home() {
  useLenis();
  useReveal();
  useSEO({
    titulo: "Brack Indumentaria · Electrodomésticos con taller propio en Bahía Blanca",
    descripcion:
      "Heladeras, lavarropas y línea blanca, nuevos y reacondicionados con garantía por escrito. 6 cuotas sin interés, 10% de descuento en efectivo y service técnico propio. Santa Fe 85, Bahía Blanca.",
    path: "/",
  });
  const { productos, addLead } = useData();
  const publicados = productos.filter((p) => p.publicado);
  const destacados = publicados.filter((p) => p.destacado).slice(0, 4);
  const usados = publicados.filter((p) => p.condicion === "usado").slice(0, 3);
  const countCat = (cat: string) => publicados.filter((p) => p.categoria === cat).length;

  // El producto de la vitrina del hero: la Eslabón de Lujo (Brack-004), la más
  // vendida de la casa. La vitrina no usa su foto (los flyers reales traen textos
  // encima): dibuja el equipo como plano técnico del taller. El dato es real.
  const heroProd = useMemo(() => {
    const eslabon = publicados.find((p) => p.id === "Brack-004");
    return eslabon ?? publicados.find((p) => p.destacado) ?? publicados[0];
  }, [publicados]);

  return (
    <div className="bg-paper text-graph">
      <div className="grain" />
      <Navbar />

      {/* ===== HERO — la cámara de frío: escenario oscuro, tipografía gigante y la
           heladera real en una vitrina de vidrio. La única sección oscura del sitio:
           el contraste con el resto (claro) es la decisión fuerte de la home. ===== */}
      <section className="relative overflow-hidden bg-graph text-paper-100">
        {/* aura de frío: un aliento helado y un rastro de la marca, en deriva lenta */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute right-[-12%] top-[-22%] h-[75vh] w-[75vh] animate-drift rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(158,196,214,0.16), transparent 65%)" }}
          />
          <div
            className="absolute left-[-16%] bottom-[-30%] h-[70vh] w-[70vh] animate-drift rounded-full blur-3xl [animation-delay:-9s]"
            style={{ background: "radial-gradient(circle, rgba(223,10,10,0.13), transparent 62%)" }}
          />
          {/* horizonte: una línea de escarcha apenas visible al pie del escenario */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
        </div>

        <div className="container-x relative z-10 grid min-h-[94vh] items-center gap-12 pb-20 pt-32 lg:grid-cols-[1.12fr_0.88fr] lg:gap-8 lg:pt-24">
          <div className="max-w-2xl">
            <p className="reveal flex items-center gap-2 text-xs font-semibold uppercase tracking-widest2 text-brand-300">
              <span className="h-px w-8 bg-brand" /> Bahía Blanca · Santa Fe 85
            </p>
            <h1 className="reveal mt-6 font-display text-[clamp(2.9rem,8.6vw,6rem)] font-semibold leading-[0.96] tracking-tight text-paper-100">
              Se lo vendemos.
              <br />
              <span className="text-brand-400">Y se lo arreglamos.</span>
            </h1>
            <p className="reveal mt-7 max-w-xl text-lg leading-relaxed text-white/60" data-delay="120ms">
              Electrodomésticos nuevos y reacondicionados con garantía, en cuotas, con taller
              propio en Bahía Blanca desde hace más de 30 años.
            </p>
            <div className="reveal mt-9 flex flex-wrap gap-4" data-delay="220ms">
              <Link to="/tienda" className="btn-primary">Ver productos <ArrowRight size={16} /></Link>
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost !border-white/25 !text-paper-100 hover:!border-brand-400 hover:!text-brand-300"
              >
                <Phone size={15} /> Consultar por WhatsApp
              </a>
            </div>
            <div className="reveal mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/50" data-delay="300ms">
              {["Taller propio", "Garantía por escrito", "Cuotas sin interés"].map((x) => (
                <span key={x} className="flex items-center gap-2">
                  <Check size={15} className="text-brand-400" /> {x}
                </span>
              ))}
            </div>
          </div>

          {heroProd && <HeroVitrina nombre={heroProd.nombre} id={heroProd.id} precio={heroProd.precio} cuotas={heroProd.cuotas} cuota={valorCuota(heroProd)} />}
        </div>
      </section>

      {/* ===== BARRA DE CONFIANZA ===== */}
      <section className="border-y border-graph/10 bg-paper-100">
        <div className="container-x grid grid-cols-2 gap-x-6 gap-y-8 py-10 lg:grid-cols-4">
          {[
            { icon: Clock, n: "Más de 30 años", l: "de service en Bahía Blanca" },
            { icon: Wrench, n: "Taller propio", l: "en el mismo local de venta" },
            { icon: CreditCard, n: "6 cuotas sin interés", l: "y 10% de descuento en efectivo" },
            { icon: Truck, n: "Envío e instalación", l: "sin cargo en Bahía Blanca" },
          ].map((s, i) => (
            <div key={s.n} className="reveal flex items-start gap-4" data-delay={`${i * 80}ms`}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
                <s.icon size={20} strokeWidth={1.8} />
              </span>
              <div>
                <p className="font-display text-base font-semibold tracking-tight text-graph">{s.n}</p>
                <p className="mt-0.5 text-sm text-graph-500">{s.l}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CATEGORÍAS — cada visitante encuentra su camino en un clic ===== */}
      <section className="py-24">
        <div className="container-x">
          <div className="reveal mb-12">
            <p className="eyebrow">La tienda</p>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-graph md:text-5xl">
              ¿Qué necesita para su casa?
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <CategoriaCard to="/tienda?cat=heladera" titulo="Heladeras" detalle={`${countCat("heladera")} publicadas`}>
              <PictogramaCategoria categoria="heladera" size={40} strokeWidth={1.4} />
            </CategoriaCard>
            <CategoriaCard to="/tienda?cat=lavarropas" titulo="Lavarropas" detalle={`${countCat("lavarropas")} publicados`}>
              <PictogramaCategoria categoria="lavarropas" size={40} strokeWidth={1.4} />
            </CategoriaCard>
            <CategoriaCard
              to="/tienda?cond=usado"
              titulo="Reacondicionados"
              detalle="Revisados por el taller, con garantía"
            >
              <Wrench size={36} strokeWidth={1.4} />
            </CategoriaCard>
            <CategoriaCard to="/mayorista" titulo="Mayorista" detalle="Portal para revendedores">
              <Store size={36} strokeWidth={1.4} />
            </CategoriaCard>
          </div>
          <div className="reveal mt-6 flex flex-wrap gap-2" data-delay="120ms">
            {[
              { k: "freezer", l: "Freezers" },
              { k: "secarropas", l: "Secarropas" },
              { k: "cocina", l: "Cocinas" },
              { k: "aire", l: "Aires acondicionados" },
              { k: "microondas", l: "Microondas" },
            ].map((c) => (
              <Link
                key={c.k}
                to={`/tienda?cat=${c.k}`}
                className="rounded-full border border-graph/15 px-4 py-2 text-sm font-medium text-graph-500 transition hover:border-brand hover:text-brand"
              >
                {c.l}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DESTACADOS — producto real con número real cuanto antes ===== */}
      <section className="border-t border-graph/10 bg-paper-100 py-24">
        <div className="container-x">
          <div className="reveal mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Precios publicados, sin letra chica</p>
              <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-graph md:text-5xl">Destacados</h2>
            </div>
            <Link to="/tienda" className="group flex items-center gap-2 text-sm font-semibold text-brand">
              Ver toda la tienda <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {destacados.map((p) => (
              <div key={p.id} className="reveal"><ProductoCard p={p} /></div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== POR QUÉ Brack — la objeción "¿y si falla?" se contesta acá ===== */}
      <section className="border-t border-graph/10 py-24">
        <div className="container-x">
          <div className="reveal mb-14 max-w-2xl">
            <p className="eyebrow">Por qué Brack</p>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-graph md:text-5xl">
              Lo que le vendemos, lo sabemos arreglar
            </h2>
            <p className="mt-5 text-lg text-graph-500">
              Las cadenas venden cajas. Acá, el que le vende es el mismo que repara heladeras
              y lavarropas hace tres décadas. Esa es la diferencia.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl bg-graph/10 md:grid-cols-3">
            {porQueAder.map((s, i) => (
              <div key={s.t} className="reveal group bg-paper-100 p-8 transition hover:bg-paper-200" data-delay={`${i * 90}ms`}>
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand transition group-hover:bg-brand group-hover:text-white">
                  <s.icon size={22} strokeWidth={1.8} />
                </span>
                <h3 className="mt-6 font-display text-xl font-semibold text-graph">{s.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-graph-500">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== USADOS REACONDICIONADOS ===== */}
      <section className="border-t border-graph/10 bg-paper-100 py-24">
        <div className="container-x">
          <div className="reveal mb-12 grid gap-6 md:grid-cols-[1.2fr_auto] md:items-end">
            <div className="max-w-2xl">
              <p className="eyebrow">Usados con respaldo</p>
              <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-graph md:text-5xl">
                Reacondicionados por nuestro taller, con garantía por escrito
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-graph-500">
                Cada equipo usado que ofrecemos pasa por el taller antes de publicarse: se revisa,
                se cambia lo que hay que cambiar y se prueba en funcionamiento. Recién ahí sale a
                la venta, con garantía por escrito. Es la opción para equipar su casa gastando
                menos, sin comprar a ciegas: usted sabe quién lo revisó y a quién reclamarle,
                con nombre y dirección.
              </p>
            </div>
            <Link to="/tienda?cond=usado" className="btn-primary self-start md:self-end">
              Ver reacondicionados <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-7 md:grid-cols-3">
            {usados.map((p, i) => (
              <div key={p.id} className="reveal" data-delay={`${i * 90}ms`}><ProductoCard p={p} /></div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SERVICE — la historia del taller ===== */}
      <section id="service" className="border-t border-graph/10 py-24">
        <div className="container-x grid gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow reveal">Service técnico</p>
            <h2 className="reveal mt-3 font-display text-4xl font-medium tracking-tight text-graph md:text-5xl">
              El taller donde empezó todo
            </h2>
            <p className="reveal mt-5 text-lg leading-relaxed text-graph-500" data-delay="100ms">
              Brack nació como taller de reparación de heladeras y lavarropas hace más de 30 años,
              y ese taller sigue siendo el corazón del negocio. Llevamos más de mil reparaciones
              realizadas en Bahía Blanca. Por eso, cuando compra un equipo acá, no queda solo:
              el mismo taller que lo eligió para la venta es el que responde si algún día hace
              falta. Puede solicitar su reparación en línea y le confirmamos la visita a la brevedad.
            </p>
            <div className="reveal mt-8 flex flex-wrap gap-x-10 gap-y-4" data-delay="160ms">
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
            <Link to="/service" className="btn-primary reveal mt-9" data-delay="220ms">
              Solicitar service <ArrowRight size={16} />
            </Link>
          </div>

          <div className="reveal rounded-2xl border border-graph/10 bg-paper-100 p-8 shadow-soft" data-delay="140ms">
            <p className="text-xs uppercase tracking-widest2 text-graph-400">Cómo trabaja el taller</p>
            <ol className="mt-6 space-y-6">
              {pasosTaller.map((p, i) => (
                <li key={p.t} className="flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-brand/25 font-display text-sm font-semibold text-brand">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-display text-base font-semibold text-graph">{p.t}</p>
                    <p className="mt-1 text-sm leading-relaxed text-graph-500">{p.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ===== MAYORISTA ===== */}
      <section className="border-t border-graph/10 bg-paper-100 py-24">
        <div className="container-x">
          <div className="reveal overflow-hidden rounded-2xl border border-graph/10 bg-paper p-8 md:p-12">
            <div className="grid gap-8 lg:grid-cols-[1.3fr_auto] lg:items-center">
              <div className="max-w-2xl">
                <p className="eyebrow">Revendedores</p>
                <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-graph md:text-4xl">
                  Mayorista: su lista de precios, siempre disponible
                </h2>
                <p className="mt-4 leading-relaxed text-graph-500">
                  Si revende electrodomésticos, Brack le asigna un usuario con su propia lista de
                  precios mayoristas y su compra mínima. Entra al portal, ve precios y stock
                  actualizados y arma su pedido en el momento, sin esperar que le contesten un
                  mensaje ni le manden la lista. Para solicitar el alta, escríbanos con los datos
                  de su comercio.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link to="/mayorista" className="btn-primary whitespace-nowrap">
                  Ingresar al portal <ArrowRight size={16} />
                </Link>
                <a href={WA_MAYORISTA} target="_blank" rel="noreferrer" className="btn-ghost whitespace-nowrap">
                  Solicitar acceso mayorista
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== UBICACIÓN + CONTACTO ===== */}
      <section id="contacto" className="border-t border-graph/10 py-24">
        <div className="container-x grid gap-14 lg:grid-cols-2">
          <div>
            <p className="eyebrow reveal">El local</p>
            <h2 className="reveal mt-3 font-display text-4xl font-medium tracking-tight text-graph md:text-5xl">
              Santa Fe 85, Bahía Blanca
            </h2>
            <p className="reveal mt-5 text-lg text-graph-500" data-delay="100ms">
              Local a la calle, con el taller en el mismo edificio. Puede pasar a ver los equipos
              o escribirnos: respondemos a la brevedad.
            </p>
            <div className="reveal mt-9 space-y-5" data-delay="160ms">
              {[
                { icon: MapPin, t: "Dirección", d: "Santa Fe 85, Bahía Blanca", href: MAPS },
                { icon: Phone, t: "WhatsApp", d: "291 436-4529", href: WHATSAPP },
                { icon: Mail, t: "Correo", d: "adermarcosrefrigeracion@gmail.com", href: "mailto:adermarcosrefrigeracion@gmail.com" },
                { icon: Instagram, t: "Instagram", d: "@brack_refrigeracion_marcos", href: "https://www.instagram.com/brack_refrigeracion_marcos" },
                { icon: Clock, t: "Horario", d: "Lun a Vie 9 a 18 · Sáb 9 a 13" },
              ].map((c) => (
                <div key={c.t} className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
                    <c.icon size={20} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-widest2 text-graph-400">{c.t}</p>
                    {c.href ? (
                      <a href={c.href} target="_blank" rel="noreferrer" className="block truncate text-graph hover:text-brand">
                        {c.d}
                      </a>
                    ) : (
                      <p className="truncate text-graph">{c.d}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <a href={WHATSAPP} target="_blank" rel="noreferrer" className="btn-primary reveal mt-9" data-delay="220ms">
              <Phone size={16} /> Escribir por WhatsApp
            </a>
          </div>
          <ContactForm onEnviar={addLead} />
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ── La vitrina del hero: un panel de vidrio oscuro con el equipo dibujado como
// plano técnico del taller (trazo fino + cotas). Las fotos reales de la casa son
// flyers con gráfica encima: acá manda el dibujo, el dato real va en la placa.
// Micro-parallax con el mouse + flote lento + un aliento de frío que respira.
function HeroVitrina({
  nombre, id, precio, cuotas, cuota,
}: {
  nombre: string; id: string; precio: number; cuotas: number; cuota: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const aliento = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.set(el, { transformPerspective: 1100 });
      gsap.fromTo(
        el,
        { y: 54, opacity: 0, rotationY: -4 },
        { y: 0, opacity: 1, rotationY: 0, duration: 1.6, ease: "expo.out", delay: 0.25 }
      );
      // flote lento: respira, no rebota
      gsap.to(el, { y: "-=10", duration: 3.8, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.9 });
      // el aliento de frío recorre la vitrina
      if (aliento.current) {
        gsap.to(aliento.current, { y: "-=46", x: "+=24", duration: 7, ease: "sine.inOut", yoyo: true, repeat: -1 });
      }

      // el plano se DIBUJA: cada trazo del blueprint aparece como tinta que corre
      el.querySelectorAll<SVGGeometryElement>("[data-draw]").forEach((p, i) => {
        const len = p.getTotalLength();
        gsap.fromTo(
          p,
          { strokeDasharray: len, strokeDashoffset: len },
          { strokeDashoffset: 0, duration: 1.3, ease: "power2.inOut", delay: 0.55 + i * 0.14 }
        );
      });
      gsap.fromTo(
        el.querySelectorAll("[data-anota]"),
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power2.out", delay: 1.9, stagger: 0.15 }
      );

      const rx = gsap.quickTo(el, "rotationX", { duration: 1.2, ease: "power3.out" });
      const ry = gsap.quickTo(el, "rotationY", { duration: 1.2, ease: "power3.out" });
      const onMove = (e: PointerEvent) => {
        ry((e.clientX / window.innerWidth - 0.5) * 7);
        rx((0.5 - e.clientY / window.innerHeight) * 5);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => window.removeEventListener("pointermove", onMove);
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[320px] sm:max-w-[360px] lg:max-w-[400px]">
      <div ref={wrap} className="relative will-change-transform">
        {/* halo helado detrás de la vitrina */}
        <div
          className="absolute -inset-8 rounded-[40px] blur-2xl"
          style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(158,196,214,0.14), transparent 70%)" }}
          aria-hidden
        />

        <div className="relative aspect-[3/4.1] overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.65)] backdrop-blur-sm">
          {/* el plano del taller: la heladera dibujada a trazo fino, con sus cotas */}
          <BlueprintHeladera />
          {/* aliento de frío dentro de la vitrina */}
          <div
            ref={aliento}
            className="pointer-events-none absolute bottom-[-18%] left-[8%] h-[45%] w-[84%] rounded-full blur-3xl"
            style={{ background: "radial-gradient(ellipse, rgba(158,196,214,0.16), transparent 68%)" }}
            aria-hidden
          />
          {/* reflejo de vidrio: una veta diagonal apenas presente */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.06) 50%, transparent 58%)" }}
            aria-hidden
          />
          {/* hairline interior */}
          <div className="pointer-events-none absolute inset-[7px] rounded-[22px] border border-white/[0.06]" aria-hidden />

          {/* rótulo de vitrina, como en el local */}
          <p className="absolute left-6 top-5 text-[10px] font-semibold uppercase tracking-widest2 text-white/40">
            No Frost · Garantía por escrito
          </p>

          {/* la placa de precio: dato real, clickeable */}
          <Link
            to={`/producto/${id}`}
            className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-graph/70 px-5 py-3.5 backdrop-blur-xl transition hover:border-brand-400/50"
          >
            <p className="truncate text-xs font-medium text-white/55">{nombre}</p>
            <div className="mt-0.5 flex items-baseline justify-between gap-3">
              <p className="font-display text-xl font-semibold tracking-tight text-paper-100">{fmtARS(precio)}</p>
              <p className="text-xs font-semibold text-brand-300">{cuotas} cuotas de {fmtARS(cuota)}</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── El plano técnico de la vitrina: heladera a trazo fino con cotas reales.
// Dibujado a mano para Brack (250 L, el dato del flyer de la casa). Los trazos
// llevan data-draw (se animan como tinta) y los textos data-anota (fade final).
function BlueprintHeladera() {
  const W = "rgba(255,255,255,0.68)";
  const w2 = "rgba(255,255,255,0.28)";
  const rojo = "rgba(240,122,122,0.9)"; // brand-300: el único gesto de color del plano
  return (
    <svg viewBox="0 0 260 360" className="absolute inset-0 h-full w-full p-8 pb-24" aria-hidden>
      {/* cuerpo */}
      <rect data-draw x="70" y="24" width="120" height="284" rx="13" fill="none" stroke={W} strokeWidth="1.6" />
      {/* división freezer / heladera */}
      <line data-draw x1="70" y1="118" x2="190" y2="118" stroke={W} strokeWidth="1.3" />
      {/* burlete interior de cada puerta */}
      <rect data-draw x="78" y="32" width="104" height="78" rx="8" fill="none" stroke={w2} strokeWidth="1" />
      <rect data-draw x="78" y="126" width="104" height="174" rx="8" fill="none" stroke={w2} strokeWidth="1" />
      {/* manijas: el gesto rojo */}
      <line data-draw x1="86" y1="52" x2="86" y2="96" stroke={rojo} strokeWidth="3.2" strokeLinecap="round" />
      <line data-draw x1="86" y1="140" x2="86" y2="208" stroke={rojo} strokeWidth="3.2" strokeLinecap="round" />
      {/* patas */}
      <line data-draw x1="84" y1="308" x2="84" y2="318" stroke={W} strokeWidth="1.6" />
      <line data-draw x1="176" y1="308" x2="176" y2="318" stroke={W} strokeWidth="1.6" />
      {/* cota vertical (alto) */}
      <line data-draw x1="214" y1="24" x2="214" y2="308" stroke={w2} strokeWidth="1" />
      <line data-draw x1="208" y1="24" x2="220" y2="24" stroke={w2} strokeWidth="1" />
      <line data-draw x1="208" y1="308" x2="220" y2="308" stroke={w2} strokeWidth="1" />
      <text data-anota x="226" y="170" fill="rgba(255,255,255,0.42)" fontSize="9" letterSpacing="1.5" style={{ writingMode: "vertical-rl" }}>
        1,60 m
      </text>
      {/* cota horizontal (ancho) */}
      <line data-draw x1="70" y1="332" x2="190" y2="332" stroke={w2} strokeWidth="1" />
      <line data-draw x1="70" y1="326" x2="70" y2="338" stroke={w2} strokeWidth="1" />
      <line data-draw x1="190" y1="326" x2="190" y2="338" stroke={w2} strokeWidth="1" />
      <text data-anota x="118" y="348" fill="rgba(255,255,255,0.42)" fontSize="9" letterSpacing="1.5">
        60 cm
      </text>
      {/* llamada al freezer */}
      <line data-draw x1="62" y1="66" x2="24" y2="66" stroke={w2} strokeWidth="1" strokeDasharray="3 4" />
      <text data-anota x="22" y="58" fill="rgba(255,255,255,0.42)" fontSize="9" letterSpacing="1.2">
        Freezer
      </text>
      {/* capacidad, como en la etiqueta */}
      <text data-anota x="130" y="226" fill="rgba(255,255,255,0.5)" fontSize="13" letterSpacing="3" textAnchor="middle" fontWeight="600">
        250 L
      </text>
    </svg>
  );
}

function CategoriaCard({ to, titulo, detalle, children }: { to: string; titulo: string; detalle: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="reveal group flex flex-col justify-between rounded-2xl border border-graph/10 bg-paper-100 p-7 transition duration-500 hover:border-brand/30 hover:shadow-card"
    >
      <span className="text-graph/[0.35] transition group-hover:text-brand">{children}</span>
      <div className="mt-10">
        <h3 className="font-display text-xl font-semibold text-graph">{titulo}</h3>
        <p className="mt-1 text-sm text-graph-500">{detalle}</p>
        <span className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-brand">
          Ver <ArrowRight size={15} className="transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function ContactForm({ onEnviar }: { onEnviar: (l: Lead) => void }) {
  const [sent, setSent] = useState(false);
  const [f, setF] = useState({ nombre: "", telefono: "", email: "", mensaje: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onEnviar({
      id: "LEAD-" + Date.now(),
      fechaISO: hoyISO(),
      nombre: f.nombre || "Consulta web",
      contacto: f.telefono || f.email || "Sin contacto",
      productoId: null,
      interes: "producto",
      canal: "web",
      estado: "nueva",
      asignado: "Sin asignar",
      notas: f.mensaje,
    });
    setSent(true);
  };

  return (
    <form onSubmit={submit} className="reveal rounded-2xl border border-graph/10 bg-paper-100 p-7 shadow-card">
      {sent ? (
        <div className="flex h-full min-h-[340px] flex-col items-center justify-center text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand"><ShieldCheck size={30} /></span>
          <h3 className="mt-5 font-display text-2xl text-graph">Consulta enviada</h3>
          <p className="mt-2 max-w-xs text-sm text-graph-500">
            Le respondemos a la brevedad. Gracias por escribir a Brack Indumentaria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="Nombre y apellido" placeholder="Su nombre" value={f.nombre} onChange={(v) => set("nombre", v)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp" placeholder="+54 9 291 ..." value={f.telefono} onChange={(v) => set("telefono", v)} />
            <Field label="Correo" placeholder="nombre@correo.com" value={f.email} onChange={(v) => set("email", v)} />
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-widest2 text-graph-400">Mensaje</span>
            <textarea
              rows={4}
              value={f.mensaje}
              onChange={(e) => set("mensaje", e.target.value)}
              placeholder="Busco una heladera con freezer para una familia de cuatro, o necesito reparar mi lavarropas..."
              className="w-full rounded-lg border border-graph/15 bg-paper-100 px-4 py-3 text-sm text-graph outline-none transition placeholder:text-graph-400 focus:border-brand"
            />
          </label>
          <button type="submit" className="btn-primary w-full">Enviar consulta <ArrowRight size={16} /></button>
          <p className="text-center text-xs text-graph-400">Respondemos de lunes a viernes de 9 a 18 y sábados de 9 a 13.</p>
        </div>
      )}
    </form>
  );
}

function Field({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
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
