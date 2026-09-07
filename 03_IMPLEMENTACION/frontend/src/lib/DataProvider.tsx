import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "./supabase";
import type { Producto, Pedido, OrdenServicio, Cliente, Revendedor, Lead } from "@/data/types";
import { productos as seedProductos } from "@/data/productos";
import { pedidos as seedPedidos } from "@/data/pedidos";
import { ordenes as seedOrdenes } from "@/data/ordenes";
import { clientes as seedClientes } from "@/data/clientes";
import { revendedores as seedRevendedores } from "@/data/revendedores";
import { leads as seedLeads } from "@/data/leads";
import { conversaciones as seedConversaciones } from "@/data/conversaciones";
import type { Conversacion, EstadoConv, MensajeConv } from "@/data/conversaciones";
import { consultasPorMes as seedConsultasMes, facturacionPorMes as seedFacturacionMes, servicePorMes as seedServiceMes } from "@/data/kpis";
import { rebaseISO } from "./fechas";

// Demo "siempre actual": las fechas del dataset de ejemplo se desplazan al día real (ver lib/fechas).
const seedPedidosR = seedPedidos.map((p) => ({ ...p, fechaISO: rebaseISO(p.fechaISO) }));
const seedOrdenesR = seedOrdenes.map((o) => ({
  ...o,
  fechaISO: rebaseISO(o.fechaISO),
  ...(o.entregaEstimadaISO ? { entregaEstimadaISO: rebaseISO(o.entregaEstimadaISO) } : {}),
}));
const seedClientesR = seedClientes.map((c) => ({ ...c, desdeISO: rebaseISO(c.desdeISO) }));
const seedRevendedoresR = seedRevendedores.map((r) => ({ ...r, ultimaCompraISO: rebaseISO(r.ultimaCompraISO) }));
const seedLeadsR = seedLeads.map((l) => ({ ...l, fechaISO: rebaseISO(l.fechaISO) }));

// ===== Persistencia en modo DEMO (sin Supabase) =====
// Sin base de datos, los cambios del panel viven en localStorage para que
// sobrevivan al refresh (que Marcos cargue un producto y siga ahí). Con Supabase
// esto no se usa: manda la DB (tablas con prefijo brack_).
// ⚠️ REGLA: cada vez que cambian los SEEDS hay que SUBIR esta versión, si no
// los navegadores que ya visitaron la demo siguen mostrando los datos viejos.
const SEED_VERSION = "2026-07-29-brack-v1";
const lsKey = (name: string) => `brack_demo_${name}`;

/** Para páginas que guardan su propia colección y no viven en el provider. */
export function cargarDemo<T>(name: string, fallback: T): T {
  return loadLocal(name, fallback);
}
export function guardarDemo<T>(name: string, data: T) {
  saveLocal(name, data);
}

function loadLocal<T>(name: string, fallback: T): T {
  if (supabase) return fallback; // con DB, no leemos del cache local
  try {
    const raw = localStorage.getItem(lsKey(name));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed?.v !== SEED_VERSION || !Array.isArray(parsed?.data)) return fallback;
    return parsed.data as T;
  } catch {
    return fallback;
  }
}

function saveLocal<T>(name: string, data: T) {
  if (supabase) return; // con DB, no cacheamos local
  try {
    localStorage.setItem(lsKey(name), JSON.stringify({ v: SEED_VERSION, data }));
  } catch (e) {
    // Se llenó el navegador (suele pasar con muchas fotos). Que el usuario se entere.
    console.error(`No se pudo guardar "${name}" en el navegador:`, e);
    window.dispatchEvent(new CustomEvent("brack:sin-espacio", { detail: { coleccion: name } }));
  }
}

// Borra los datos de demo guardados (botón "Restablecer datos de prueba").
export function resetDemoData() {
  try {
    ["productos", "pedidos", "ordenes", "clientes", "revendedores", "leads", "conversaciones"].forEach((n) =>
      localStorage.removeItem(lsKey(n))
    );
  } catch { /* noop */ }
}

function computeKpis(productos: Producto[], pedidos: Pedido[], ordenes: OrdenServicio[], leads: Lead[], clientes: Cliente[]) {
  const abiertos: Pedido["estado"][] = ["nuevo", "confirmado", "preparando"];
  const serviceVivas: OrdenServicio["estado"][] = ["ingresada", "diagnostico", "presupuestada", "reparacion", "lista"];
  return {
    ventasMesARS: pedidos.filter((p) => p.estado !== "cancelado").reduce((a, p) => a + p.total, 0),
    pedidosNuevos: pedidos.filter((p) => p.estado === "nuevo").length,
    pedidosActivos: pedidos.filter((p) => abiertos.includes(p.estado)).length,
    serviceAbiertas: ordenes.filter((o) => serviceVivas.includes(o.estado)).length,
    serviceListas: ordenes.filter((o) => o.estado === "lista").length,
    consultasNuevas: leads.filter((l) => l.estado === "nueva").length,
    consultasTotal: leads.length,
    stockBajo: productos.filter((p) => p.publicado && p.stock <= 1).length,
    productosPublicados: productos.filter((p) => p.publicado).length,
    clientes: clientes.length,
    conversion: leads.length ? Math.round((leads.filter((l) => l.estado === "vendido").length / leads.length) * 100) : 0,
  };
}

interface DataCtx {
  loading: boolean;
  online: boolean; // true si la DB respondió
  productos: Producto[];
  pedidos: Pedido[];
  ordenes: OrdenServicio[];
  clientes: Cliente[];
  revendedores: Revendedor[];
  leads: Lead[];
  getProducto: (id: string) => Producto | undefined;
  getCliente: (id: string) => Cliente | undefined;
  getRevendedor: (id: string) => Revendedor | undefined;
  // mutaciones
  addProducto: (p: Producto) => Promise<void>;
  updateProducto: (id: string, patch: Partial<Producto>) => Promise<void>;
  deleteProducto: (id: string) => Promise<void>;
  addPedido: (p: Pedido) => Promise<void>;
  updatePedido: (id: string, patch: Partial<Pedido>) => Promise<void>;
  deletePedido: (id: string) => Promise<void>;
  addOrden: (o: OrdenServicio) => Promise<void>;
  updateOrden: (id: string, patch: Partial<OrdenServicio>) => Promise<void>;
  deleteOrden: (id: string) => Promise<void>;
  addCliente: (c: Cliente) => Promise<void>;
  updateCliente: (id: string, patch: Partial<Cliente>) => Promise<void>;
  deleteCliente: (id: string) => Promise<void>;
  addRevendedor: (r: Revendedor) => Promise<void>;
  updateRevendedor: (id: string, patch: Partial<Revendedor>) => Promise<void>;
  deleteRevendedor: (id: string) => Promise<void>;
  addLead: (l: Lead) => Promise<void>;
  updateLead: (id: string, patch: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  // asistente IA · bandeja de conversaciones
  conversaciones: Conversacion[];
  conversacionesNoLeidas: number;
  addConversacion: (c: Conversacion) => Promise<void>;
  updateConversacion: (convId: string, patch: Partial<Conversacion>) => Promise<void>;
  marcarLeida: (convId: string) => void;
  agregarMensaje: (convId: string, msg: MensajeConv) => Promise<void>;
  actualizarMensaje: (convId: string, msgId: string, patch: Partial<MensajeConv>) => Promise<void>;
  borrarMensaje: (convId: string, msgId: string) => Promise<void>;
  setEstadoConversacion: (convId: string, estado: EstadoConv) => Promise<void>;
  // derivados
  kpis: ReturnType<typeof computeKpis>;
  consultasPorMes: typeof seedConsultasMes;
  facturacionPorMes: typeof seedFacturacionMes;
  servicePorMes: typeof seedServiceMes;
  leadsPorCanal: { name: string; value: number }[];
  embudoPedidos: { etapa: string; cantidad: number }[];
  ventasPorCategoria: { name: string; value: number }[];
}

const Ctx = createContext<DataCtx>(null as any);

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  // En modo demo (sin Supabase) rehidratamos desde localStorage; con DB, arrancamos del seed y luego sincroniza.
  const [productos, setProductos] = useState<Producto[]>(() => loadLocal("productos", seedProductos));
  const [pedidos, setPedidos] = useState<Pedido[]>(() => loadLocal("pedidos", seedPedidosR));
  const [ordenes, setOrdenes] = useState<OrdenServicio[]>(() => loadLocal("ordenes", seedOrdenesR));
  const [clientes, setClientes] = useState<Cliente[]>(() => loadLocal("clientes", seedClientesR));
  const [revendedores, setRevendedores] = useState<Revendedor[]>(() => loadLocal("revendedores", seedRevendedoresR));
  const [leads, setLeads] = useState<Lead[]>(() => loadLocal("leads", seedLeadsR));
  const [conversaciones, setConversaciones] = useState<Conversacion[]>(() => loadLocal("conversaciones", seedConversaciones));

  // Persistir cada colección en modo demo (no-op si hay Supabase).
  useEffect(() => { saveLocal("productos", productos); }, [productos]);
  useEffect(() => { saveLocal("pedidos", pedidos); }, [pedidos]);
  useEffect(() => { saveLocal("ordenes", ordenes); }, [ordenes]);
  useEffect(() => { saveLocal("clientes", clientes); }, [clientes]);
  useEffect(() => { saveLocal("revendedores", revendedores); }, [revendedores]);
  useEffect(() => { saveLocal("leads", leads); }, [leads]);
  useEffect(() => { saveLocal("conversaciones", conversaciones); }, [conversaciones]);

  // Sincronizar desde Supabase (en segundo plano; si falla, quedan los datos locales)
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!supabase) { setLoading(false); return; }
      try {
        const [p, pe, o, c, r, l, cv] = await Promise.all([
          supabase.from("brack_productos").select("*"),
          supabase.from("brack_pedidos").select("*"),
          supabase.from("brack_ordenes").select("*"),
          supabase.from("brack_clientes").select("*"),
          supabase.from("brack_revendedores").select("*"),
          supabase.from("brack_leads").select("*"),
          supabase.from("brack_conversaciones").select("*"),
        ]);
        if (cancel) return;
        if (p.data?.length) setProductos(p.data as Producto[]);
        if (pe.data) setPedidos(pe.data as Pedido[]);
        if (o.data) setOrdenes(o.data as OrdenServicio[]);
        if (c.data) setClientes(c.data as Cliente[]);
        if (r.data) setRevendedores(r.data as Revendedor[]);
        if (l.data) setLeads(l.data as Lead[]);
        if (!cv.error && cv.data) setConversaciones(cv.data as Conversacion[]);
        if (!p.error) setOnline(true);
      } catch {
        /* offline → datos locales */
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // ===== mutaciones (actualizan estado local SIEMPRE + DB si hay conexión) =====
  const addProducto = async (p: Producto) => {
    setProductos((prev) => [p, ...prev]);
    if (supabase) await supabase.from("brack_productos").upsert(p).then(() => {}, () => {});
  };
  const updateProducto = async (id: string, patch: Partial<Producto>) => {
    setProductos((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    if (supabase) await supabase.from("brack_productos").update(patch).eq("id", id).then(() => {}, () => {});
  };
  const deleteProducto = async (id: string) => {
    setProductos((prev) => prev.filter((x) => x.id !== id));
    if (supabase) await supabase.from("brack_productos").delete().eq("id", id).then(() => {}, () => {});
  };
  const addPedido = async (p: Pedido) => {
    setPedidos((prev) => [p, ...prev]);
    if (supabase) await supabase.from("brack_pedidos").upsert(p).then(() => {}, () => {});
  };
  const updatePedido = async (id: string, patch: Partial<Pedido>) => {
    setPedidos((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    if (supabase) await supabase.from("brack_pedidos").update(patch).eq("id", id).then(() => {}, () => {});
  };
  const deletePedido = async (id: string) => {
    setPedidos((prev) => prev.filter((x) => x.id !== id));
    if (supabase) await supabase.from("brack_pedidos").delete().eq("id", id).then(() => {}, () => {});
  };
  const addOrden = async (o: OrdenServicio) => {
    setOrdenes((prev) => [o, ...prev]);
    if (supabase) await supabase.from("brack_ordenes").upsert(o).then(() => {}, () => {});
  };
  const updateOrden = async (id: string, patch: Partial<OrdenServicio>) => {
    setOrdenes((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    if (supabase) await supabase.from("brack_ordenes").update(patch).eq("id", id).then(() => {}, () => {});
  };
  const deleteOrden = async (id: string) => {
    setOrdenes((prev) => prev.filter((x) => x.id !== id));
    if (supabase) await supabase.from("brack_ordenes").delete().eq("id", id).then(() => {}, () => {});
  };
  const addCliente = async (c: Cliente) => {
    setClientes((prev) => [c, ...prev]);
    if (supabase) await supabase.from("brack_clientes").upsert(c).then(() => {}, () => {});
  };
  const updateCliente = async (id: string, patch: Partial<Cliente>) => {
    setClientes((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    if (supabase) await supabase.from("brack_clientes").update(patch).eq("id", id).then(() => {}, () => {});
  };
  const deleteCliente = async (id: string) => {
    setClientes((prev) => prev.filter((x) => x.id !== id));
    if (supabase) await supabase.from("brack_clientes").delete().eq("id", id).then(() => {}, () => {});
  };
  const addRevendedor = async (r: Revendedor) => {
    setRevendedores((prev) => [r, ...prev]);
    if (supabase) await supabase.from("brack_revendedores").upsert(r).then(() => {}, () => {});
  };
  const updateRevendedor = async (id: string, patch: Partial<Revendedor>) => {
    setRevendedores((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    if (supabase) await supabase.from("brack_revendedores").update(patch).eq("id", id).then(() => {}, () => {});
  };
  const deleteRevendedor = async (id: string) => {
    setRevendedores((prev) => prev.filter((x) => x.id !== id));
    if (supabase) await supabase.from("brack_revendedores").delete().eq("id", id).then(() => {}, () => {});
  };
  const addLead = async (l: Lead) => {
    setLeads((prev) => [l, ...prev]);
    if (supabase) await supabase.from("brack_leads").upsert(l).then(() => {}, () => {});
  };
  const updateLead = async (id: string, patch: Partial<Lead>) => {
    setLeads((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    if (supabase) await supabase.from("brack_leads").update(patch).eq("id", id).then(() => {}, () => {});
  };
  const deleteLead = async (id: string) => {
    setLeads((prev) => prev.filter((x) => x.id !== id));
    if (supabase) await supabase.from("brack_leads").delete().eq("id", id).then(() => {}, () => {});
  };

  // ===== Bandeja de conversaciones =====
  // Toda edición reescribe la conversación completa (los mensajes viven adentro).
  const guardarConv = async (conv: Conversacion) => {
    if (supabase) await supabase.from("brack_conversaciones").upsert(conv).then(() => {}, () => {});
  };
  const addConversacion = async (c: Conversacion) => {
    setConversaciones((prev) => [c, ...prev]);
    await guardarConv(c);
  };
  const patchConv = async (convId: string, fn: (c: Conversacion) => Conversacion) => {
    let actualizada: Conversacion | undefined;
    setConversaciones((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        actualizada = fn(c);
        return actualizada;
      })
    );
    if (actualizada) await guardarConv(actualizada);
  };

  const updateConversacion = (convId: string, patch: Partial<Conversacion>) =>
    patchConv(convId, (c) => ({ ...c, ...patch }));

  const marcarLeida = (convId: string) =>
    setConversaciones((prev) => prev.map((c) => (c.id === convId && c.noLeida ? { ...c, noLeida: false } : c)));

  // Un mensaje del CLIENTE deja la conversación sin leer (el panel tiene que enterarse);
  // uno de la IA o del humano la marca atendida.
  const agregarMensaje = (convId: string, msg: MensajeConv) =>
    patchConv(convId, (c) => ({ ...c, mensajes: [...c.mensajes, msg], noLeida: msg.de === "cliente" }));

  const actualizarMensaje = (convId: string, msgId: string, patch: Partial<MensajeConv>) =>
    patchConv(convId, (c) => ({ ...c, mensajes: c.mensajes.map((m) => (m.id === msgId ? { ...m, ...patch } : m)) }));

  const borrarMensaje = (convId: string, msgId: string) =>
    patchConv(convId, (c) => ({ ...c, mensajes: c.mensajes.filter((m) => m.id !== msgId) }));

  // Al cerrar o devolver a la IA, el motivo de derivación deja de aplicar.
  const setEstadoConversacion = (convId: string, estado: EstadoConv) =>
    patchConv(convId, (c) => ({ ...c, estado, noLeida: false, ...(estado === "ia" ? { motivo: undefined } : {}) }));

  const conversacionesNoLeidas = useMemo(() => conversaciones.filter((c) => c.noLeida).length, [conversaciones]);

  const kpis = useMemo(
    () => computeKpis(productos, pedidos, ordenes, leads, clientes),
    [productos, pedidos, ordenes, leads, clientes]
  );

  const leadsPorCanal = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => (map[l.canal] = (map[l.canal] || 0) + 1));
    const label: Record<string, string> = { web: "Web propia", whatsapp: "WhatsApp", instagram: "Instagram", mail: "Mail", telefono: "Teléfono" };
    return Object.entries(map).map(([k, v]) => ({ name: label[k] || k, value: v }));
  }, [leads]);

  const embudoPedidos = useMemo(() => {
    const etapas = [
      { key: "nuevo", label: "Nuevo" },
      { key: "confirmado", label: "Confirmado" },
      { key: "preparando", label: "Preparando" },
      { key: "entregado", label: "Entregado" },
    ];
    return etapas.map((e) => ({ etapa: e.label, cantidad: pedidos.filter((p) => p.estado === e.key).length }));
  }, [pedidos]);

  const ventasPorCategoria = useMemo(() => {
    const label: Record<string, string> = {
      heladera: "Heladeras", freezer: "Freezers", lavarropas: "Lavarropas", secarropas: "Secarropas",
      cocina: "Cocinas", aire: "Aires", microondas: "Microondas",
    };
    const map: Record<string, number> = {};
    pedidos
      .filter((p) => p.estado !== "cancelado")
      .forEach((p) =>
        p.items.forEach((it) => {
          const prod = productos.find((x) => x.id === it.productoId);
          const k = prod ? label[prod.categoria] || prod.categoria : "Otros";
          map[k] = (map[k] || 0) + it.precioUnit * it.cantidad;
        })
      );
    return Object.entries(map).map(([k, v]) => ({ name: k, value: v }));
  }, [pedidos, productos]);

  return (
    <Ctx.Provider
      value={{
        loading, online, productos, pedidos, ordenes, clientes, revendedores, leads,
        getProducto: (id) => productos.find((p) => p.id === id),
        getCliente: (id) => clientes.find((c) => c.id === id),
        getRevendedor: (id) => revendedores.find((r) => r.id === id),
        addProducto, updateProducto, deleteProducto,
        addPedido, updatePedido, deletePedido,
        addOrden, updateOrden, deleteOrden,
        addCliente, updateCliente, deleteCliente,
        addRevendedor, updateRevendedor, deleteRevendedor,
        addLead, updateLead, deleteLead,
        conversaciones, conversacionesNoLeidas, addConversacion, updateConversacion, marcarLeida, agregarMensaje, actualizarMensaje, borrarMensaje, setEstadoConversacion,
        kpis, consultasPorMes: seedConsultasMes, facturacionPorMes: seedFacturacionMes, servicePorMes: seedServiceMes,
        leadsPorCanal, embudoPedidos, ventasPorCategoria,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useData = () => useContext(Ctx);
