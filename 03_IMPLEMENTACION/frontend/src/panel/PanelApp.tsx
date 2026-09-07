import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { cn } from "./ui/cn";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ProfileGate from "./components/ProfileGate";
import { ProfilesProvider, useProfiles, canAccess } from "./profiles";
import { ToastProvider } from "./components/Toast";

// Si el perfil activo no puede ver la sección actual, lo manda a la primera permitida.
function PermGuard() {
  const { activo } = useProfiles();
  const { pathname } = useLocation();
  const seg = pathname.replace(/^\/panel\/?/, "");
  const key = seg === "" ? "inicio" : seg.split("/")[0];
  if (canAccess(activo, key)) return null;
  const order = ["bandeja", "pedidos", "productos", "cargar", "service", "clientes", "mayorista", "reportes"];
  const landing = activo?.admin ? "/panel" : "/panel/" + (order.find((k) => canAccess(activo, k)) || "bandeja");
  return <Navigate to={landing} replace />;
}

import Dashboard from "./pages/Dashboard";
import Asistente from "./pages/Asistente";
import Bandeja from "./pages/Bandeja";
import Pedidos from "./pages/Pedidos";
import Productos from "./pages/Productos";
import CargarProducto from "./pages/CargarProducto";
import Service from "./pages/Service";
import Clientes from "./pages/Clientes";
import Mayorista from "./pages/Mayorista";
import Reportes from "./pages/Reportes";

// Estilos propios del panel (keyframes para modal/toast).
const panelStyles = `
@keyframes fadeIn { from { opacity: 0; transform: scale(.98) } to { opacity: 1; transform: scale(1) } }
@keyframes slideUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
`;

export default function PanelApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("brack_panel_collapsed") === "1"; } catch { return false; }
  });
  const toggleCollapse = () =>
    setCollapsed((c) => {
      const n = !c;
      try { localStorage.setItem("brack_panel_collapsed", n ? "1" : "0"); } catch {}
      return n;
    });

  // ESC: solo cierra el menú mobile si está abierto. NO saca del panel (eso molestaba).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  return (
    <ToastProvider>
      <ProfilesProvider>
        <style>{panelStyles}</style>
        <div className="panel-bg min-h-screen font-sans text-graph antialiased">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={collapsed} onToggleCollapse={toggleCollapse} />

          <div className={cn("transition-[padding] duration-300", collapsed ? "lg:pl-[100px]" : "lg:pl-[276px]")}>
            <Topbar onMenu={() => setSidebarOpen(true)} />
            <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
              <PermGuard />
              <Routes>
                <Route path="" element={<Dashboard />} />
                <Route path="bandeja" element={<Bandeja />} />
                <Route path="pedidos" element={<Pedidos />} />
                <Route path="productos" element={<Productos />} />
                <Route path="cargar" element={<CargarProducto />} />
                <Route path="service" element={<Service />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="mayorista" element={<Mayorista />} />
                <Route path="reportes" element={<Reportes />} />
                <Route path="asistente" element={<Asistente />} />
                <Route path="*" element={<Navigate to="/panel" replace />} />
              </Routes>
            </main>
          </div>
        </div>
        <ProfileGate />
      </ProfilesProvider>
    </ToastProvider>
  );
}
