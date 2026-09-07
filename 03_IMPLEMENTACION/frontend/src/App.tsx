import { Routes, Route, useLocation, useParams, Navigate } from "react-router-dom";
import { useEffect, lazy, Suspense, type ReactNode } from "react";
import Home from "./site/Home";
import Tienda from "./site/Tienda";
import ProductoDetalle from "./site/ProductoDetalle";
import Carrito from "./site/Carrito";
import Service from "./site/Service";
import Mayorista from "./site/Mayorista";
import Favoritos from "./site/Favoritos";
import Cuenta from "./site/Cuenta";
import { AuthProvider } from "./site/context/AuthContext";
import { FavoritesProvider } from "./site/context/FavoritesContext";
import { CartProvider } from "./site/context/CartContext";
import { DataProvider } from "./lib/DataProvider";

import { PanelAuthProvider, usePanelAuth } from "./panel/auth";
import Login from "./panel/Login";
import { ErrorBoundary } from "./ErrorBoundary";
import ChatAsistente from "./site/components/ChatAsistente";

// El panel (con recharts) se carga solo cuando se entra a /panel.
const PanelApp = lazy(() => import("./panel/PanelApp"));

// Protege el panel: sin sesión → a la pantalla de login.
function RequirePanelAuth({ children }: { children: ReactNode }) {
  const { authed, loading } = usePanelAuth();
  if (loading) return <PanelFallback />;
  return authed ? <>{children}</> : <Navigate to="/ingresar" replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Rutas viejas del enlatado inmobiliario → su equivalente en la tienda.
function RedirectPropiedad() {
  const { id } = useParams();
  return <Navigate to={`/producto/${id}`} replace />;
}

function PanelFallback() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F4F5F6", color: "#16161A", fontFamily: "'General Sans', sans-serif" }}>
      Cargando panel…
    </div>
  );
}

// El asistente web sólo aparece en la web pública, nunca en el panel/login.
function SiteChat() {
  const { pathname } = useLocation();
  const enPanel = pathname.startsWith("/panel") || pathname.startsWith("/admin") || pathname === "/ingresar";
  if (enPanel) return null;
  return <ChatAsistente />;
}

export default function App() {
  return (
    <DataProvider>
    <AuthProvider>
      <FavoritesProvider>
      <CartProvider>
      <PanelAuthProvider>
        <ScrollToTop />
        <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tienda" element={<Tienda />} />
          <Route path="/producto/:id" element={<ProductoDetalle />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/service" element={<Service />} />
          <Route path="/mayorista" element={<Mayorista />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/cuenta" element={<Cuenta />} />
          {/* compatibilidad con rutas viejas del enlatado */}
          <Route path="/propiedades" element={<Navigate to="/tienda" replace />} />
          <Route path="/propiedad/:id" element={<RedirectPropiedad />} />
          <Route path="/campos" element={<Navigate to="/tienda" replace />} />
          <Route path="/campo/:id" element={<RedirectPropiedad />} />
          <Route path="/temporada" element={<Navigate to="/" replace />} />
          <Route path="/temporada/:barrio" element={<Navigate to="/" replace />} />
          <Route path="/ingresar" element={<Login />} />
          <Route
            path="/panel/*"
            element={
              <RequirePanelAuth>
                <Suspense fallback={<PanelFallback />}>
                  <PanelApp />
                </Suspense>
              </RequirePanelAuth>
            }
          />
          {/* /admin es alias del panel; cualquier ruta desconocida vuelve al home (sin pantallas en blanco) */}
          <Route path="/admin/*" element={<Navigate to="/panel" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <SiteChat />
        </ErrorBoundary>
      </PanelAuthProvider>
      </CartProvider>
      </FavoritesProvider>
    </AuthProvider>
    </DataProvider>
  );
}
