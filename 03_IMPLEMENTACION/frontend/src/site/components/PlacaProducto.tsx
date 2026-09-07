import type { Producto, CategoriaProducto } from "@/data/types";

// ── Placa de producto ─────────────────────────────────────────────────────────
// Los productos sin foto NO muestran una imagen rota ni una foto de stock:
// muestran una placa tipográfica prolija (marca + modelo + pictograma lineal
// de la categoría). Cuando Marcos cargue la foto real desde el panel, la placa
// se reemplaza sola. Los pictogramas son SVG propios, stroke fino, sin emojis.

export function PictogramaCategoria({
  categoria,
  size = 48,
  strokeWidth = 1.5,
  className = "",
}: {
  categoria: CategoriaProducto;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const base = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
  switch (categoria) {
    case "heladera":
      return (
        <svg {...base}>
          <rect x="6.5" y="2.75" width="11" height="18.5" rx="1.8" />
          <line x1="6.5" y1="9.5" x2="17.5" y2="9.5" />
          <line x1="15" y1="4.9" x2="15" y2="7.3" />
          <line x1="15" y1="11.7" x2="15" y2="15.1" />
        </svg>
      );
    case "freezer":
      return (
        <svg {...base}>
          <rect x="3" y="7.5" width="18" height="11" rx="1.8" />
          <line x1="3" y1="11" x2="21" y2="11" />
          <line x1="10" y1="9.25" x2="14" y2="9.25" />
          <line x1="6" y1="18.5" x2="6" y2="20" />
          <line x1="18" y1="18.5" x2="18" y2="20" />
        </svg>
      );
    case "lavarropas":
      return (
        <svg {...base}>
          <rect x="4.5" y="3" width="15" height="18" rx="1.8" />
          <line x1="4.5" y1="7.5" x2="19.5" y2="7.5" />
          <circle cx="7.5" cy="5.25" r="0.55" fill="currentColor" stroke="none" />
          <circle cx="10" cy="5.25" r="0.55" fill="currentColor" stroke="none" />
          <circle cx="12" cy="14" r="4.1" />
          <path d="M9.4 12.8a3 3 0 0 1 5.2 0" />
        </svg>
      );
    case "secarropas":
      return (
        <svg {...base}>
          <rect x="6.5" y="3" width="11" height="18" rx="2.6" />
          <line x1="6.5" y1="8" x2="17.5" y2="8" />
          <circle cx="12" cy="5.5" r="0.6" fill="currentColor" stroke="none" />
          <circle cx="12" cy="14.5" r="3.4" />
        </svg>
      );
    case "cocina":
      return (
        <svg {...base}>
          <rect x="4.5" y="4.5" width="15" height="15" rx="1.6" />
          <line x1="4.5" y1="9.75" x2="19.5" y2="9.75" />
          <circle cx="8.5" cy="7.1" r="1.05" />
          <circle cx="15.5" cy="7.1" r="1.05" />
          <rect x="7.5" y="12.5" width="9" height="4.4" rx="0.9" />
          <line x1="6.5" y1="19.5" x2="6.5" y2="21" />
          <line x1="17.5" y1="19.5" x2="17.5" y2="21" />
        </svg>
      );
    case "aire":
      return (
        <svg {...base}>
          <rect x="3" y="6.5" width="18" height="8.5" rx="2.2" />
          <line x1="5.5" y1="12.4" x2="18.5" y2="12.4" />
          <circle cx="18" cy="9" r="0.55" fill="currentColor" stroke="none" />
          <path d="M7.5 17.5c0 1.4-1.2 1.6-1.2 2.6" />
          <path d="M12 17.5c0 1.4-1.2 1.6-1.2 2.6" />
          <path d="M16.5 17.5c0 1.4-1.2 1.6-1.2 2.6" />
        </svg>
      );
    case "microondas":
      return (
        <svg {...base}>
          <rect x="3" y="6" width="18" height="12" rx="1.8" />
          <rect x="5.5" y="8.5" width="8.5" height="7" rx="0.9" />
          <line x1="16.5" y1="6" x2="16.5" y2="18" />
          <circle cx="18.75" cy="9.5" r="0.6" fill="currentColor" stroke="none" />
          <line x1="18" y1="12.5" x2="19.5" y2="12.5" />
          <line x1="18" y1="14.5" x2="19.5" y2="14.5" />
        </svg>
      );
  }
}

/** Placa tipográfica: marca + modelo + pictograma sobre paper-200. */
export function PlacaProducto({ p, grande = false }: { p: Producto; grande?: boolean }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-paper-200 px-6 text-center">
      {/* marco hairline interior: detalle de imprenta, separa la placa de la foto */}
      <div className="pointer-events-none absolute inset-3 rounded-xl border border-graph/[0.07]" aria-hidden />
      <PictogramaCategoria
        categoria={p.categoria}
        size={grande ? 76 : 52}
        strokeWidth={grande ? 1.2 : 1.5}
        className="text-graph/[0.28]"
      />
      <p className={`mt-4 uppercase tracking-widest2 text-graph-400 ${grande ? "text-[11px]" : "text-[10px]"}`}>
        {p.marca}
      </p>
      <p
        className={`mt-1.5 font-display font-medium leading-snug text-graph-700 ${
          grande ? "text-xl" : "text-[15px]"
        } line-clamp-2`}
      >
        {p.nombre}
      </p>
    </div>
  );
}

/** Foto real (fondo blanco, entera) o placa tipográfica. Un solo punto de verdad. */
export function VisualProducto({ p, grande = false, className = "" }: { p: Producto; grande?: boolean; className?: string }) {
  if (p.fotos?.length) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-white ${grande ? "p-8" : "p-6"} ${className}`}>
        <img
          src={p.fotos[0]}
          alt={p.nombre}
          loading="lazy"
          className="max-h-full max-w-full object-contain"
        />
      </div>
    );
  }
  return <PlacaProducto p={p} grande={grande} />;
}
