// ============================================================================
//  REBRANDEAR — la fábrica de demos WESEKA.
//  Recorre src/ + index.html y reemplaza los textos de la marca origen por los
//  de la marca destino. Se usa una sola vez al clonar el enlatado para un
//  cliente nuevo. Los COLORES no se tocan acá: salen de src/marca.ts.
//
//  Uso:  node scripts/rebrandear.mjs
//        node scripts/rebrandear.mjs --dry     (muestra sin escribir)
// ============================================================================
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const DRY = process.argv.includes("--dry");
const RAIZ = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

// Orden IMPORTA: primero lo más específico, si no "Potente" se come "Potente Propiedades".
const MAPA = [
  ["Potente Propiedades", "YAGÜE Inmobiliaria"],
  ["potentepropiedades.com.ar", "yague.com.ar"],
  ["potenteprop.com.ar", "yague.com.ar"],
  ["potentemogotes@pimas.com.ar", "info@yague.com.ar"],
  ["potenteprop", "yague"],
  ["potente_", "yague_"],       // prefijo de tablas Supabase
  ["POTENTE", "YAGUE"],          // constantes / IDs
  ["POT-", "YAG-"],              // ids de propiedades
  ["Potente", "YAGÜE"],
  ["potente", "yague"],
  ["Mar del Plata", "Comodoro Rivadavia"],
  ["mar del plata", "comodoro rivadavia"],
  ["MAR DEL PLATA", "COMODORO RIVADAVIA"],
  ["marplatense", "comodorense"],
  ["Marplatense", "Comodorense"],
  ["Buenos Aires", "Chubut"],
];

const EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".html", ".css", ".md", ".json"]);
const SALTAR = new Set(["node_modules", ".git", "dist", ".vite", "scripts"]);

function archivos(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    if (SALTAR.has(f)) continue;
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...archivos(p));
    else if (EXT.has(extname(f))) out.push(p);
  }
  return out;
}

let tocados = 0, total = 0;
for (const p of [...archivos(join(RAIZ, "src")), join(RAIZ, "index.html"), join(RAIZ, "content")].flatMap((x) => {
  try { return statSync(x).isDirectory() ? archivos(x) : [x]; } catch { return []; }
})) {
  let txt;
  try { txt = readFileSync(p, "utf-8"); } catch { continue; }
  const orig = txt;
  let n = 0;
  for (const [de, a] of MAPA) {
    const partes = txt.split(de);
    if (partes.length > 1) { n += partes.length - 1; txt = partes.join(a); }
  }
  if (txt !== orig) {
    tocados++; total += n;
    if (!DRY) writeFileSync(p, txt, "utf-8");
    console.log(`${DRY ? "[dry] " : ""}${n.toString().padStart(4)} · ${p.replace(RAIZ, "")}`);
  }
}
console.log(`\n${DRY ? "SIMULACRO — " : ""}${tocados} archivos, ${total} reemplazos.`);
