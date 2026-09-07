// Genera public/sitemap.xml antes del build (lo corre `npm run build`).
// Extrae los IDs de productos del dataset local por regex (sin importar TS)
// para que el script sea robusto ante cualquier cambio de imports en src/data.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE = process.env.SITE_URL || "https://wsk.com.ar/demos/ader";

const hoy = new Date().toISOString().slice(0, 10);

const estaticas = [
  { loc: "/", prioridad: "1.0" },
  { loc: "/tienda", prioridad: "0.9" },
  { loc: "/service", prioridad: "0.9" },
  { loc: "/mayorista", prioridad: "0.7" },
  { loc: "/tienda?cond=usado", prioridad: "0.8" },
  { loc: "/tienda?cat=heladera", prioridad: "0.8" },
  { loc: "/tienda?cat=lavarropas", prioridad: "0.8" },
  { loc: "/tienda?cat=freezer", prioridad: "0.7" },
  { loc: "/tienda?cat=cocina", prioridad: "0.7" },
  { loc: "/tienda?cat=aire", prioridad: "0.7" },
];

// IDs de productos del dataset de muestra (solo los publicados no se distinguen
// por regex; el detalle de un despublicado redirige solo, no rompe).
const ids = new Set();
try {
  const texto = readFileSync(path.join(ROOT, "src/data/productos.ts"), "utf8");
  for (const m of texto.matchAll(/\bid:\s*"(ADER-[^"]+)"/g)) ids.add(m[1]);
} catch {
  /* dataset opcional */
}

const esc = (s) => s.replace(/&/g, "&amp;");
const urls = [
  ...estaticas.map((e) => `  <url><loc>${SITE}${esc(e.loc)}</loc><lastmod>${hoy}</lastmod><priority>${e.prioridad}</priority></url>`),
  ...[...ids].map((id) => `  <url><loc>${SITE}/producto/${encodeURIComponent(id)}</loc><lastmod>${hoy}</lastmod><priority>0.6</priority></url>`),
].join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
writeFileSync(path.join(ROOT, "public", "sitemap.xml"), xml);
console.log(`sitemap.xml: ${estaticas.length} rutas + ${ids.size} productos → ${SITE}`);
