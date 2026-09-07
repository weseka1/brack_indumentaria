import { useEffect } from "react";
import type { Producto } from "@/data/types";
import { precioEfectivo } from "@/data/types";

// ── SEO por ruta (SPA) ─────────────────────────────────────────────────────────
// Actualiza title, description, canonical y JSON-LD al navegar. El index.html
// trae la base (Store + service de electrodomésticos); esto especializa cada página.

const SITE = "https://wsk.com.ar/demos/brack";

type SEOProps = {
  titulo: string;
  descripcion?: string;
  path?: string; // ej: "/tienda" — arma la canonical
  jsonLd?: Record<string, unknown> | null; // datos estructurados de la página
};

function setMeta(selector: string, attr: string, value: string, create?: () => HTMLElement) {
  let el = document.head.querySelector(selector) as HTMLElement | null;
  if (!el && create) {
    el = create();
    document.head.appendChild(el);
  }
  if (el) el.setAttribute(attr, value);
}

export function useSEO({ titulo, descripcion, path, jsonLd }: SEOProps) {
  useEffect(() => {
    document.title = titulo;
    setMeta('meta[property="og:title"]', "content", titulo);

    if (descripcion) {
      setMeta('meta[name="description"]', "content", descripcion);
      setMeta('meta[property="og:description"]', "content", descripcion);
    }
    if (path !== undefined) {
      const url = SITE + path;
      setMeta('link[rel="canonical"]', "href", url, () => {
        const l = document.createElement("link");
        l.setAttribute("rel", "canonical");
        return l;
      });
      setMeta('meta[property="og:url"]', "content", url);
    }

    // JSON-LD de la página (un solo script dinámico, se reemplaza al navegar)
    const ID = "seo-jsonld-ruta";
    document.getElementById(ID)?.remove();
    if (jsonLd) {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.id = ID;
      s.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(s);
    }
    return () => {
      document.getElementById(ID)?.remove();
    };
  }, [titulo, descripcion, path, JSON.stringify(jsonLd ?? null)]);
}

// JSON-LD de un producto — Google lo entiende como ficha de tienda.
export function jsonLdProducto(p: Producto) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nombre,
    description: p.descripcion,
    sku: p.id,
    brand: { "@type": "Brand", name: p.marca },
    url: `${SITE}/producto/${encodeURIComponent(p.id)}`,
    ...(p.fotos.length ? { image: p.fotos } : {}),
    itemCondition:
      p.condicion === "usado"
        ? "https://schema.org/RefurbishedCondition"
        : "https://schema.org/NewCondition",
    offers: {
      "@type": "Offer",
      price: precioEfectivo(p),
      priceCurrency: "ARS",
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Brack Indumentaria" },
    },
  };
}
