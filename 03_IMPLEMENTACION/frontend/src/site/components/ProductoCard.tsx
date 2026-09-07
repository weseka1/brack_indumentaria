import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import type { Producto } from "@/data/types";
import { valorCuota, precioEfectivo } from "@/data/types";
import { fmtARS } from "@/lib/format";
import { useFavorites } from "../context/FavoritesContext";
import { VisualProducto } from "./PlacaProducto";

// ── Card de producto ──────────────────────────────────────────────────────────
// Anatomía aprobada (ESTRATEGIA_COPY_ADER §4): precio de lista grande,
// la línea de cuotas en rojo Brack (la que vende) y el efectivo como texto
// secundario. Nunca más de dos líneas debajo del precio.

export default function ProductoCard({ p }: { p: Producto }) {
  const { esFavorito, toggle } = useFavorites();
  const fav = esFavorito(p.id);

  return (
    <Link
      to={`/producto/${p.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-paper-100 ring-1 ring-graph/10 transition duration-500 hover:shadow-card hover:ring-brand/30"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className="h-full w-full transition duration-700 group-hover:scale-[1.03]">
          <VisualProducto p={p} />
        </div>

        {p.condicion === "usado" && (
          <span className="absolute left-3.5 top-3.5 rounded-full bg-paper-100/95 px-3 py-1 text-[10px] font-semibold text-graph-700 ring-1 ring-graph/10 backdrop-blur">
            Reacondicionado · {p.garantiaMeses} meses de garantía
          </span>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            toggle(p.id);
          }}
          aria-label={fav ? "Quitar de favoritos" : "Guardar en favoritos"}
          className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full ring-1 backdrop-blur transition ${
            fav
              ? "bg-brand text-white ring-brand"
              : "bg-paper-100/85 text-graph-500 ring-graph/10 hover:text-brand"
          }`}
        >
          <Heart size={17} fill={fav ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="flex flex-1 flex-col border-t border-graph/10 p-5">
        <p className="text-[10px] uppercase tracking-widest2 text-graph-400">{p.marca}</p>
        <h3 className="mt-1 font-display text-[17px] font-medium leading-snug text-graph line-clamp-2">
          {p.nombre}
        </h3>

        <div className="mt-auto pt-4">
          <p className="font-display text-2xl font-semibold tracking-tight text-graph">{fmtARS(p.precio)}</p>
          <p className="mt-1 text-sm font-medium text-brand">
            {p.cuotas} cuotas sin interés de {fmtARS(valorCuota(p))}
          </p>
          <p className="mt-0.5 text-xs text-graph-500">Efectivo: {fmtARS(precioEfectivo(p))}</p>
        </div>
      </div>
    </Link>
  );
}
