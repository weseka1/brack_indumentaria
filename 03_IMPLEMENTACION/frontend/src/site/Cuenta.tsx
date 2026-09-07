import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Heart, MessageSquare, LogOut, Mail, Phone, Package } from "lucide-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProductoCard from "./components/ProductoCard";
import AuthModal from "./components/AuthModal";
import { useLenis } from "./lib/useLenis";
import { useSEO } from "./lib/seo";
import { useAuth } from "./context/AuthContext";
import { useFavorites } from "./context/FavoritesContext";
import { useData } from "@/lib/DataProvider";
import { fmtARS, fmtFecha } from "@/lib/format";

// Cómo se le muestra al visitante el estado interno de su consulta.
const ESTADO_LEAD: Record<string, { label: string; clase: string }> = {
  nueva:      { label: "Enviada",    clase: "bg-graph/[0.06] text-graph-500" },
  contactado: { label: "Respondida", clase: "bg-brand-50 text-brand" },
  cotizado:   { label: "Cotizada",   clase: "bg-sea-50 text-sea" },
  vendido:    { label: "Concretada", clase: "bg-sea-50 text-sea" },
  perdido:    { label: "Cerrada",    clase: "bg-graph/[0.06] text-graph-400" },
};

// Y el estado de su pedido, en lenguaje de cliente.
const ESTADO_PEDIDO: Record<string, { label: string; clase: string }> = {
  nuevo:      { label: "Recibido",     clase: "bg-graph/[0.06] text-graph-500" },
  confirmado: { label: "Confirmado",   clase: "bg-brand-50 text-brand" },
  preparando: { label: "En preparación", clase: "bg-brand-50 text-brand" },
  entregado:  { label: "Entregado",    clase: "bg-sea-50 text-sea" },
  cancelado:  { label: "Cancelado",    clase: "bg-graph/[0.06] text-graph-400" },
};

export default function Cuenta() {
  useLenis();
  useSEO({ titulo: "Mi cuenta · Brack Indumentaria", path: "/cuenta" });
  const { user, salir } = useAuth();
  const { favoritos } = useFavorites();
  const { productos, leads, pedidos } = useData();
  const [authOpen, setAuthOpen] = useState(false);
  const [tab, setTab] = useState<"favoritos" | "pedidos" | "consultas" | "datos">("favoritos");

  const favs = productos.filter((p) => p.publicado && favoritos.includes(p.id));

  // Lo del visitante se identifica por el contacto (mail o teléfono) con el que se registró.
  const esMio = (contacto: string) => {
    if (!user) return false;
    const c = (contacto || "").trim().toLowerCase();
    if (!c) return false;
    const mail = (user.email || "").trim().toLowerCase();
    const tel = (user.telefono || "").replace(/\D/g, "");
    return (mail && c === mail) || (tel.length >= 6 && c.replace(/\D/g, "").endsWith(tel.slice(-8)));
  };
  const misConsultas = leads.filter((l) => esMio(l.contacto));
  const misPedidos = pedidos.filter((p) => esMio(p.contacto));

  const tituloDe = (productoId: string | null) =>
    (productoId && productos.find((p) => p.id === productoId)?.nombre) || "Consulta general";

  if (!user) {
    return (
      <div className="min-h-screen bg-paper text-graph">
        <div className="grain" />
        <Navbar variant="solid" />
        <div className="container-x grid min-h-[70vh] place-items-center">
          <div className="max-w-md rounded-2xl border border-graph/10 bg-paper-100 p-10 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand">
              <User size={30} />
            </span>
            <h1 className="mt-5 font-display text-2xl text-graph">Ingrese a su cuenta</h1>
            <p className="mt-2 text-graph-500">Para ver sus favoritos, pedidos y consultas.</p>
            <button onClick={() => setAuthOpen(true)} className="btn-primary mt-7 w-full">Ingresar o registrarse</button>
          </div>
        </div>
        <Footer />
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  const tabs = [
    { key: "favoritos" as const, label: "Favoritos", icon: Heart, n: favs.length },
    { key: "pedidos" as const, label: "Mis pedidos", icon: Package, n: misPedidos.length },
    { key: "consultas" as const, label: "Mis consultas", icon: MessageSquare, n: misConsultas.length },
    { key: "datos" as const, label: "Mis datos", icon: User },
  ];

  return (
    <div className="min-h-screen bg-paper text-graph">
      <div className="grain" />
      <Navbar variant="solid" />

      <header className="container-x pt-32 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-brand font-display text-xl font-bold text-white">
              {user.nombre.charAt(0).toUpperCase()}
            </span>
            <div>
              <h1 className="font-display text-3xl text-graph">Hola, {user.nombre.split(" ")[0]}</h1>
              <p className="text-sm text-graph-500">{user.email}</p>
            </div>
          </div>
          <button onClick={salir} className="btn-ghost"><LogOut size={16} /> Cerrar sesión</button>
        </div>
      </header>

      <div className="container-x">
        <div className="flex gap-2 overflow-x-auto border-b border-graph/10">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                tab === t.key ? "border-brand text-brand" : "border-transparent text-graph-500 hover:text-graph"
              }`}
            >
              <t.icon size={16} /> {t.label}
              {"n" in t && <span className="rounded-full bg-graph/5 px-2 text-xs">{t.n}</span>}
            </button>
          ))}
        </div>
      </div>

      <section className="container-x py-10">
        {tab === "favoritos" &&
          (favs.length === 0 ? (
            <Empty texto="Todavía no guardó productos." />
          ) : (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {favs.map((p) => (
                <ProductoCard key={p.id} p={p} />
              ))}
            </div>
          ))}

        {tab === "pedidos" &&
          (misPedidos.length === 0 ? (
            <Empty texto="Todavía no registramos pedidos con su contacto. Cuando compre desde la tienda, los va a ver acá." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-graph/10">
              {misPedidos.map((p, i) => {
                const e = ESTADO_PEDIDO[p.estado] ?? ESTADO_PEDIDO.nuevo;
                return (
                  <div key={p.id} className={`flex flex-wrap items-center justify-between gap-3 bg-paper-100 p-5 ${i > 0 ? "border-t border-graph/10" : ""}`}>
                    <div className="min-w-0">
                      <p className="font-medium text-graph">
                        {p.id} · {p.items.map((it) => `${it.cantidad} × ${it.nombre}`).join(", ")}
                      </p>
                      <p className="mt-0.5 text-sm text-graph-400">
                        {fmtFecha(p.fechaISO)} · {fmtARS(p.total)} · {p.entrega === "retiro" ? "retiro por el local" : "envío a domicilio"}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${e.clase}`}>{e.label}</span>
                  </div>
                );
              })}
            </div>
          ))}

        {tab === "consultas" &&
          (misConsultas.length === 0 ? (
            <Empty texto="Todavía no nos hizo ninguna consulta. Cuando escriba por un producto o un service, la va a ver acá." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-graph/10">
              {misConsultas.map((c, i) => {
                const e = ESTADO_LEAD[c.estado] ?? ESTADO_LEAD.nueva;
                return (
                  <div key={c.id} className={`flex flex-wrap items-center justify-between gap-3 bg-paper-100 p-5 ${i > 0 ? "border-t border-graph/10" : ""}`}>
                    <div>
                      <p className="font-medium text-graph">{tituloDe(c.productoId)}</p>
                      <p className="mt-0.5 text-sm text-graph-400">Consulta enviada el {fmtFecha(c.fechaISO)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${e.clase}`}>{e.label}</span>
                  </div>
                );
              })}
            </div>
          ))}

        {tab === "datos" && (
          <div className="max-w-lg space-y-4 rounded-2xl border border-graph/10 bg-paper-100 p-7">
            <Dato icon={User} label="Nombre" valor={user.nombre} />
            <Dato icon={Mail} label="Correo" valor={user.email} />
            <Dato icon={Phone} label="Teléfono" valor={user.telefono || "Sin cargar"} />
            <p className="pt-2 text-xs text-graph-400">Para modificar sus datos, escríbanos por WhatsApp.</p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

function Empty({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl border border-graph/10 bg-paper-100 py-20 text-center">
      <p className="mx-auto max-w-md text-graph-500">{texto}</p>
      <Link to="/tienda" className="btn-primary mt-6">Ver la tienda</Link>
    </div>
  );
}

function Dato({ icon: Icon, label, valor }: { icon: any; label: string; valor: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand"><Icon size={18} /></span>
      <div>
        <p className="text-xs uppercase tracking-widest2 text-graph-400">{label}</p>
        <p className="text-graph">{valor}</p>
      </div>
    </div>
  );
}
