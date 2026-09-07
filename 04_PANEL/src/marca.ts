// ============================================================================
//  MARCA — único archivo que cambia por cliente.
//  Este es el corazón del ENLATADO de demos WESEKA: se copia la app entera,
//  se reemplaza SOLO este archivo y el panel queda rebrandeado.
//  Los colores salen como CSS variables (ver src/index.css) para que Tailwind
//  no haya que tocarlo nunca.
//
//  BRACK — indumentaria urbana, zapatillas y perfumería. Santa Rosa, La Pampa.
//  El panel viene del de BRACK (Diego): mismo contrato Tiendanube,
//  mismas variantes por talle. Solo cambia esta marca y los datos.
//  Theme CLARO + champagne de marca (#B99B63, sacado de su tienda real).
// ============================================================================

export interface Marca {
  slug: string;
  nombre: string;
  nombreCorto: string;
  tagline: string;
  logo: string;
  ciudad: string;
  provincia: string;
  region: string;
  web: string;
  email: string;
  direccion: string;
  whatsapp: string;
  telefonos: { rotulo: string; numero: string; wa?: string }[];
  divisiones: { slug: string; rotulo: string; descripcion: string }[];
  colores: {
    paper: string; paper100: string; paper200: string;
    tinta: string; tinta700: string; tinta500: string; tinta400: string;
    brand: string; brand600: string; brand700: string; brand400: string; brand300: string; brand50: string;
    acento: string;
  };
  /** prefijo de tablas en Supabase (aísla los datos de cada cliente) */
  dbPrefix: string;
  /** credenciales visibles del demo — se muestran en el login */
  demo: { usuario: string; password: string; nota: string };
  copy: {
    heroTitulo: string;
    heroBajada: string;
    sobreTitulo: string;
    sobreTexto: string;
  };
}

export const MARCA: Marca = {
  slug: "brack",
  nombre: "BRACK",
  nombreCorto: "BRACK",
  tagline: "Panel de la tienda",
  // Logo real, del CDN de su propia Tiendanube (el mismo que usa la web).
  logo: "https://d1a9qnv764bsoo.cloudfront.net/stores/003/887/000/themes/common/logo-3170750397743779363-1776371864-3a121c05d1078d8344ebda4d207bac8c1776371864-1024-1024.webp",
  ciudad: "Santa Rosa",
  provincia: "La Pampa",
  region: "todo el país",
  web: "brack.mitiendanube.com",
  email: "",
  direccion: "25 de Mayo 772 — Santa Rosa, La Pampa",
  whatsapp: "+5492954517938",
  telefonos: [
    { rotulo: "Ventas", numero: "2954 51-7938", wa: "+5492954517938" },
  ],
  divisiones: [
    { slug: "tienda", rotulo: "Tienda", descripcion: "Indumentaria urbana, zapatillas y perfumería importada" },
  ],
  colores: {
    // BLANCO estudio, monocromo, estilo iPhone — la misma paleta que la web.
    // Panel y tienda tienen que sentirse la misma marca: si el panel fuera
    // oscuro y la web clara, en la reunión parecen dos productos distintos.
    // Se probó todo en carbón y se descartó: la vara de la casa es clara y con
    // aire (Estandar Web WESEKA). Fondos nunca puros: blanco frío, tinta casi
    // negra — jamás #000 ni #fff.
    paper: "#F6F7F8", paper100: "#FFFFFF", paper200: "#ECEEF0",
    tinta: "#111214", tinta700: "#3A3C40", tinta500: "#6E7176", tinta400: "#A1A4A9",
    brand: "#111214", brand600: "#000000", brand700: "#000000",
    brand400: "#3A3C40", brand300: "#6E7176", brand50: "#EDEEF0",
    acento: "#111214", // monocromo: acá el color lo pone el ESTADO, no la marca
  },
  dbPrefix: "brack",
  demo: {
    usuario: "demo@brack.com.ar",
    password: "brack2026",
    nota: "Cuenta de demostración — el catálogo es el que Brack publica hoy en su tienda.",
  },
  copy: {
    heroTitulo: "Indumentaria urbana, zapatillas y perfumería",
    heroBajada: "20% off en efectivo, 6 cuotas sin interés y envío gratis superando $200.000.",
    sobreTitulo: "La tienda, ordenada como se vende",
    sobreTexto: "El catálogo con sus talles y medidas, los pedidos y cada consulta con su historial.",
  },
};

/** #B99B63 -> "185 155 99" (canales sueltos: así Tailwind puede aplicar /opacidad) */
function canales(hex: string): string {
  const h = hex.replace("#", "").trim();
  const f = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  const n = parseInt(f, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Inyecta la paleta de la marca como CSS variables (lo llama main.tsx al arrancar). */
export function aplicarMarca(m: Marca = MARCA) {
  const c = m.colores;
  const r = document.documentElement.style;
  const set = (k: string, hex: string) => r.setProperty(k, canales(hex));
  set("--paper", c.paper);
  set("--paper-100", c.paper100);
  set("--paper-200", c.paper200);
  set("--tinta", c.tinta);
  set("--tinta-700", c.tinta700);
  set("--tinta-500", c.tinta500);
  set("--tinta-400", c.tinta400);
  set("--brand", c.brand);
  set("--brand-600", c.brand600);
  set("--brand-700", c.brand700);
  set("--brand-400", c.brand400);
  set("--brand-50", c.brand50);
  set("--brand-300", c.brand300);
  set("--acento", c.acento);
  document.title = `${m.nombre} — ${m.tagline}`;
}
