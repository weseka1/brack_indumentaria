import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// ── Carrito (demo) ────────────────────────────────────────────────────────────
// Vive en localStorage para que sobreviva al refresh. Guarda SOLO ids y
// cantidades: los precios se leen siempre frescos del DataProvider, así un
// cambio de precio en el panel se refleja al instante en el carrito.

export interface ItemCarrito {
  productoId: string;
  cantidad: number;
}

interface CartCtx {
  items: ItemCarrito[];
  count: number; // unidades totales (para el badge del navbar)
  agregar: (productoId: string, cantidad?: number) => void;
  quitar: (productoId: string) => void;
  setCantidad: (productoId: string, cantidad: number) => void;
  vaciar: () => void;
}

const Ctx = createContext<CartCtx>(null as any);
const LS = "brack_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(LS) || "[]");
      return Array.isArray(raw) ? raw.filter((x) => x?.productoId && x?.cantidad > 0) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS, JSON.stringify(items));
    } catch {
      /* sin espacio: el carrito sigue en memoria */
    }
  }, [items]);

  const agregar = (productoId: string, cantidad = 1) =>
    setItems((prev) => {
      const ya = prev.find((x) => x.productoId === productoId);
      if (ya) return prev.map((x) => (x.productoId === productoId ? { ...x, cantidad: x.cantidad + cantidad } : x));
      return [...prev, { productoId, cantidad }];
    });

  const quitar = (productoId: string) => setItems((prev) => prev.filter((x) => x.productoId !== productoId));

  const setCantidad = (productoId: string, cantidad: number) =>
    setItems((prev) =>
      cantidad <= 0
        ? prev.filter((x) => x.productoId !== productoId)
        : prev.map((x) => (x.productoId === productoId ? { ...x, cantidad } : x))
    );

  const vaciar = () => setItems([]);

  return (
    <Ctx.Provider
      value={{
        items,
        count: items.reduce((a, x) => a + x.cantidad, 0),
        agregar,
        quitar,
        setCantidad,
        vaciar,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => useContext(Ctx);
