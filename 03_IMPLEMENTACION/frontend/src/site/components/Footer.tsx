import { MARCA } from "@/marca";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Instagram, Clock } from "lucide-react";

const WHATSAPP = "https://wa.me/5492914364529";

export default function Footer() {
  return (
    <footer className="border-t border-graph/10 bg-paper text-graph">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <img src={MARCA.logo} alt={MARCA.nombre} className="h-11 w-auto object-contain" />
            <span className="font-display text-xl font-semibold">
              Brack <span className="text-brand">Refrigeración</span>
            </span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-graph-500">
            Venta y service de electrodomésticos. Bahía Blanca desde hace 30 años.
            Equipos nuevos y reacondicionados con garantía por escrito, taller propio
            y atención directa en Santa Fe 85.
          </p>
          <div className="mt-6 flex gap-3">
            <a
              href="https://www.instagram.com/brack_refrigeracion_marcos"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram de Brack Indumentaria"
              className="grid h-10 w-10 place-items-center rounded-full border border-graph/15 transition hover:border-brand hover:text-brand"
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="eyebrow mb-5">Navegación</h4>
          <ul className="space-y-3 text-sm text-graph-500">
            <li><Link to="/tienda" className="hover:text-brand">Tienda</Link></li>
            <li><Link to="/tienda?cond=usado" className="hover:text-brand">Usados reacondicionados</Link></li>
            <li><Link to="/service" className="hover:text-brand">Service técnico</Link></li>
            <li><Link to="/mayorista" className="hover:text-brand">Portal mayorista</Link></li>
            <li><Link to="/favoritos" className="hover:text-brand">Favoritos</Link></li>
            <li><Link to="/panel" className="hover:text-brand">Panel (acceso interno)</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="eyebrow mb-5">El local</h4>
          <ul className="space-y-4 text-sm text-graph-500">
            <li className="flex gap-3"><MapPin size={18} className="shrink-0 text-brand" /> Santa Fe 85, Bahía Blanca</li>
            <li className="flex gap-3"><Clock size={18} className="shrink-0 text-brand" /> Lun a Vie 9 a 18 · Sáb 9 a 13</li>
          </ul>
        </div>

        <div>
          <h4 className="eyebrow mb-5">Contacto</h4>
          <ul className="space-y-4 text-sm text-graph-500">
            <li>
              <a href={WHATSAPP} target="_blank" rel="noreferrer" className="flex gap-3 hover:text-brand">
                <Phone size={18} className="shrink-0 text-brand" /> 291 436-4529
              </a>
            </li>
            <li>
              <a href={`mailto:${MARCA.email}`} className="flex gap-3 break-all hover:text-brand">
                <Mail size={18} className="shrink-0 text-brand" /> {MARCA.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-graph/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-xs text-graph-400 md:flex-row">
          <span>© {new Date().getFullYear()} Brack Indumentaria · Bahía Blanca · Todos los derechos reservados.</span>
          <span>
            Sitio desarrollado por{" "}
            <a href="https://www.wsk.com.ar" target="_blank" rel="noreferrer" className="text-brand hover:text-brand-700">
              WESEKA
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
