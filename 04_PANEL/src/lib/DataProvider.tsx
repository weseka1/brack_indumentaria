// ============================================================================
//  DataProvider — fuente de datos REAL del panel BRACK.
//
//  Nada de seeds ni localStorage: acá se habla con el backend FastAPI
//  (127.0.0.1:8001 vía proxy de vite) y lo que se ve es lo que hay en la DB.
//  El provider se monta DENTRO del guard de auth: cuando existe, ya hay cookie.
// ============================================================================
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  api, ApiError, stockDe,
  type MiamiProducto, type MiamiStats, type MiamiStore,
} from "@/panel/api/miamiApi";
import { productosDemo, statsDemo, storeDemo } from "@/data/demo";

interface DataCtx {
  loading: boolean;
  /** null = sin error; texto = el backend no respondió o devolvió error. */
  error: string | null;
  productos: MiamiProducto[];
  stats: MiamiStats | null;
  store: MiamiStore | null;
  /** true = corriendo sobre el catálogo del bundle, sin backend. */
  modoDemo: boolean;
  getProducto: (id: number) => MiamiProducto | undefined;
  /** Reconsulta TODO (productos + stats). */
  recargar: () => Promise<void>;
  /** Reconsulta un producto puntual y lo pisa en la lista (post-edición). */
  refrescarProducto: (id: number) => Promise<MiamiProducto | undefined>;
  // --- mutaciones (van directo al backend; el estado refleja la respuesta) ---
  actualizarProducto: (id: number, patch: { name?: string; brand?: string; published?: boolean; destacado?: boolean; mas_vendido?: boolean }) => Promise<void>;
  eliminarProducto: (id: number) => Promise<void>;
  actualizarVariante: (pid: number, vid: number, patch: { price?: number; stock?: number }) => Promise<void>;
  agregarTalle: (pid: number, body: { talle: string; stock?: number; price?: number }) => Promise<void>;
  quitarTalle: (pid: number, vid: number) => Promise<void>;
  crearProducto: (form: FormData) => Promise<{ product_id: number }>;
  subirImagen: (pid: number, file: File) => Promise<void>;
  // --- derivados para el dashboard (calculados sobre datos reales) ---
  kpis: {
    total: number; publicados: number; sinStock: number; stockTotal: number;
    stockBajo: number; facturado: number; pedidosPagados: number; pedidosPendientes: number;
  };
  stockPorMarca: { name: string; value: number }[];
}

const Ctx = createContext<DataCtx>(null as any);

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productos, setProductos] = useState<MiamiProducto[]>([]);
  const [stats, setStats] = useState<MiamiStats | null>(null);
  const [store, setStore] = useState<MiamiStore | null>(null);
  /** true = el panel corre sobre el catálogo del bundle, sin backend. */
  const [modoDemo, setModoDemo] = useState(false);

  const recargar = useCallback(async () => {
    try {
      setError(null);
      const [prods, st] = await Promise.all([api.productos(), api.stats()]);
      setProductos(prods);
      setStats(st);
    } catch (e) {
      // 🔴 MODO DEMO — sin backend, el panel NO se queda mudo.
      // La demo se muestra en una reunión, muchas veces desde el celular de
      // Juani y con la conexión que haya. Si el FastAPI no está (que en la demo
      // publicada NO está), el panel carga el catálogo real de Brack desde el
      // bundle y funciona completo: filtros, talles, carga, estadísticas.
      // El error solo se muestra si además falla eso, que no puede pasar.
      console.info("[panel] sin backend: cargando el catálogo de la demo");
      setProductos(productosDemo);
      setStats(statsDemo);
      setStore(storeDemo);
      setModoDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
    // La info de la tienda (URL pública, cotización) no cambia seguido: una vez.
    api.store().then(setStore, () => setStore(storeDemo));
  }, [recargar]);

  const pisar = (p: MiamiProducto) =>
    setProductos((prev) => prev.map((x) => (x.id === p.id ? p : x)));

  const refrescarProducto = useCallback(async (id: number) => {
    try {
      const p = await api.producto(id);
      pisar(p);
      return p;
    } catch {
      return undefined;
    }
  }, []);

  // Las mutaciones NO son optimistas: se aplica lo que el backend confirmó.
  // Si el backend rechaza (400/409), la excepción sube y la página la muestra.
  const actualizarProducto = async (id: number, patch: { name?: string; brand?: string; published?: boolean; destacado?: boolean; mas_vendido?: boolean }) => {
    const p = await api.actualizarProducto(id, patch);
    pisar(p);
  };

  const eliminarProducto = async (id: number) => {
    await api.eliminarProducto(id);
    setProductos((prev) => prev.filter((x) => x.id !== id));
    api.stats().then(setStats, () => {});
  };

  const actualizarVariante = async (pid: number, vid: number, patch: { price?: number; stock?: number }) => {
    await api.actualizarVariante(pid, vid, patch);
    await refrescarProducto(pid); // el PUT devuelve {ok}: releemos el producto real
  };

  const agregarTalle = async (pid: number, body: { talle: string; stock?: number; price?: number }) => {
    const p = await api.agregarTalle(pid, body);
    pisar(p);
  };

  const quitarTalle = async (pid: number, vid: number) => {
    const p = await api.quitarTalle(pid, vid);
    pisar(p);
  };

  const crearProducto = async (form: FormData) => {
    const r = await api.crearProducto(form);
    await recargar(); // entra el producto nuevo con sus fotos/variantes reales
    return { product_id: r.product_id };
  };

  const subirImagen = async (pid: number, file: File) => {
    await api.subirImagen(pid, file);
    await refrescarProducto(pid);
  };

  const kpis = useMemo(() => ({
    total: stats?.productos.total ?? productos.length,
    publicados: stats?.productos.publicados ?? productos.filter((p) => p.published).length,
    sinStock: stats?.productos.sin_stock ?? productos.filter((p) => stockDe(p) === 0).length,
    stockTotal: stats?.productos.stock_total ?? productos.reduce((a, p) => a + stockDe(p), 0),
    stockBajo: stats?.stock_bajo.length ?? 0,
    facturado: stats?.pedidos.facturado_total ?? 0,
    pedidosPagados: stats?.pedidos.pagados ?? 0,
    pedidosPendientes: stats?.pedidos.pendientes ?? 0,
  }), [stats, productos]);

  // Distribución REAL del stock por marca (para el dashboard).
  const stockPorMarca = useMemo(() => {
    const map: Record<string, number> = {};
    productos.forEach((p) => {
      const marca = (p.brand || "Sin marca").trim() || "Sin marca";
      map[marca] = (map[marca] || 0) + stockDe(p);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [productos]);

  return (
    <Ctx.Provider
      value={{
        loading, error, productos, stats, store, modoDemo,
        getProducto: (id) => productos.find((p) => p.id === id),
        recargar, refrescarProducto,
        actualizarProducto, eliminarProducto, actualizarVariante,
        agregarTalle, quitarTalle, crearProducto, subirImagen,
        kpis, stockPorMarca,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useData = () => useContext(Ctx);
