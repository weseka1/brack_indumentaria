import { MARCA } from "@/marca";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Heart, User, LogOut, ShoppingCart, ChevronDown, Phone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useCart } from "../context/CartContext";
import AuthModal from "./AuthModal";

export const WHATSAPP = "https://wa.me/5492914364529";

// Los cuatro trabajos del visitante (ESTRATEGIA_COPY_ADER §3) + contacto.
const cats = [
  { to: "/tienda", label: "Tienda" },
  { to: "/tienda?cond=usado", label: "Usados" },
  { to: "/service", label: "Service" },
  { to: "/mayorista", label: "Mayorista" },
];

export default function Navbar({ variant = "overlay" }: { variant?: "overlay" | "solid" }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [auth, setAuth] = useState<{ open: boolean; modo: "ingresar" | "registrar" }>({
    open: false,
    modo: "ingresar",
  });
  const { user, salir } = useAuth();
  const { count: favCount } = useFavorites();
  const { count: cartCount } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Con el menú mobile abierto la barra tiene que ser sólida sí o sí.
  const solid = variant === "solid" || scrolled || open;

  // Cerrar el menú al pasar a escritorio y con Escape; bloquear el scroll de fondo.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onResize = () => window.innerWidth >= 1024 && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  // "Contacto" es un ancla del inicio. Con HashRouter un href="/#contacto" no
  // funciona, así que navegamos y scrolleamos a mano.
  const irAContacto = () => {
    setOpen(false);
    if (pathname === "/") {
      document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" }), 350);
    }
  };

  return (
    <>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-graph/40 backdrop-blur-sm lg:hidden"
          aria-hidden
        />
      )}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          solid ? "border-b border-graph/10 bg-paper/95 py-3 backdrop-blur-xl" : "bg-paper/75 py-4 backdrop-blur-xl"
        }`}
      >
        <nav className="container-x flex items-center justify-between gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img src={MARCA.logo} alt={MARCA.nombre} className="h-10 w-auto shrink-0 object-contain" />
            <span className="min-w-0 leading-none">
              <span className="block truncate font-display text-lg font-semibold tracking-tight text-graph">
                Brack <span className="text-brand">Refrigeración</span>
              </span>
              <span className="hidden text-[10px] uppercase tracking-widest2 text-graph-400 sm:block">
                Venta y service · Bahía Blanca
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            {cats.map((c) => (
              <Link key={c.to} to={c.to} className="link-underline text-sm font-medium text-graph-500 hover:text-graph">
                {c.label}
              </Link>
            ))}
            <button onClick={irAContacto} className="link-underline text-sm font-medium text-graph-500 hover:text-graph">
              Contacto
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noreferrer"
              aria-label="Consultar por WhatsApp"
              className="hidden h-10 items-center gap-2 rounded-full border border-graph/15 px-4 text-sm font-semibold text-graph-700 transition hover:border-brand hover:text-brand md:flex"
            >
              <Phone size={15} /> WhatsApp
            </a>

            <Link
              to="/favoritos"
              aria-label="Favoritos"
              className="relative grid h-10 w-10 place-items-center rounded-full text-graph-500 transition hover:bg-graph/5 hover:text-brand"
            >
              <Heart size={19} />
              {favCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                  {favCount}
                </span>
              )}
            </Link>

            <Link
              to="/carrito"
              aria-label="Carrito"
              className="relative grid h-10 w-10 place-items-center rounded-full text-graph-500 transition hover:bg-graph/5 hover:text-brand"
            >
              <ShoppingCart size={19} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative hidden lg:block">
                <button
                  onClick={() => setUserMenu((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-graph/15 py-1.5 pl-1.5 pr-3 text-sm text-graph transition hover:border-brand"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-xs font-bold text-white">
                    {user.nombre.charAt(0).toUpperCase()}
                  </span>
                  {user.nombre.split(" ")[0]}
                  <ChevronDown size={14} />
                </button>
                {userMenu && (
                  <div
                    className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-graph/10 bg-paper-100 py-1 shadow-card"
                    onMouseLeave={() => setUserMenu(false)}
                  >
                    <Link to="/cuenta" onClick={() => setUserMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-graph-500 hover:bg-graph/5">
                      <User size={15} /> Mi cuenta
                    </Link>
                    <Link to="/favoritos" onClick={() => setUserMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-graph-500 hover:bg-graph/5">
                      <Heart size={15} /> Mis favoritos
                    </Link>
                    <button onClick={() => { setUserMenu(false); salir(); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-graph-500 hover:bg-graph/5">
                      <LogOut size={15} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuth({ open: true, modo: "ingresar" })}
                className="hidden rounded-full px-4 py-2 text-sm font-semibold text-graph-500 transition hover:text-brand lg:block"
              >
                Ingresar
              </button>
            )}

            <button onClick={() => setOpen((v) => !v)} className="grid h-10 w-10 place-items-center text-graph lg:hidden" aria-label="Menú">
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </nav>

        {open && (
          <div className="mt-3 max-h-[calc(100vh-5.5rem)] overflow-y-auto border-t border-graph/10 bg-paper-100 pb-6 pt-3 shadow-[0_24px_50px_-20px_rgba(22,22,26,0.35)] lg:hidden">
            <div className="container-x flex flex-col gap-1">
              {cats.map((c) => (
                <Link key={c.to} to={c.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-graph-500 hover:bg-graph/5">
                  {c.label}
                </Link>
              ))}
              <button onClick={irAContacto} className="rounded-lg px-3 py-3 text-left text-sm font-medium text-graph-500 hover:bg-graph/5">
                Contacto
              </button>
              <div className="mt-3 flex gap-2 border-t border-graph/10 pt-4">
                {user ? (
                  <>
                    <Link to="/cuenta" onClick={() => setOpen(false)} className="btn-ghost flex-1">Mi cuenta</Link>
                    <button onClick={() => { setOpen(false); salir(); }} className="btn-ghost flex-1">Salir</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setOpen(false); setAuth({ open: true, modo: "ingresar" }); }} className="btn-ghost flex-1">Ingresar</button>
                    <button onClick={() => { setOpen(false); setAuth({ open: true, modo: "registrar" }); }} className="btn-primary flex-1">Crear cuenta</button>
                  </>
                )}
              </div>
              <a href={WHATSAPP} target="_blank" rel="noreferrer" className="btn-primary mt-2 w-full">
                <Phone size={15} /> Consultar por WhatsApp
              </a>
            </div>
          </div>
        )}
      </header>

      <AuthModal open={auth.open} onClose={() => setAuth({ ...auth, open: false })} modoInicial={auth.modo} />
    </>
  );
}
