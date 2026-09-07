// ============================================================================
//  MARCA — único archivo que cambia por cliente.
//  Este es el corazón del ENLATADO de demos WESEKA: se copia la app entera,
//  se reemplaza SOLO este archivo + src/data/*, y el demo queda rebrandeado.
//  Los colores salen como CSS variables (ver src/index.css) para que Tailwind
//  no haya que tocarlo nunca.
//
//  Brack Indumentaria — tienda de electrodomésticos + service, Bahía Blanca.
//  Theme CLARO + rojo de marca (#df0a0a, sacado de su tienda real).
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
  nombre: "Brack Indumentaria",
  nombreCorto: "Brack",
  tagline: "Santa Rosa, La Pampa",
  // Logo real, servido del CDN de su propia Tiendanube.
  logo: "https://d1a9qnv764bsoo.cloudfront.net/stores/003/887/000/themes/common/logo-3170750397743779363-1776371864-3a121c05d1078d8344ebda4d207bac8c1776371864-1024-1024.webp",
  ciudad: "Santa Rosa",
  provincia: "La Pampa",
  region: "La Pampa y todo el país",
  web: "brack.mitiendanube.com",
  email: "",
  direccion: "25 de Mayo 772 — Santa Rosa, La Pampa",
  whatsapp: "+5492954517938",
  telefonos: [
    { rotulo: "Ventas", numero: "2954 51-7938", wa: "+5492954517938" },
  ],
  divisiones: [
    { slug: "tienda", rotulo: "Indumentaria", descripcion: "Remeras, buzos, camperas, pantalones y camisetas — los drops de la temporada" },
    { slug: "zapatillas", rotulo: "Zapatillas", descripcion: "Vans, Campus, Rusty y más, con tabla de medidas por talle" },
    { slug: "perfumes", rotulo: "Perfumes importados", descripcion: "Perfumería árabe importada: Hawas, Khamrah, Asad, Club de Nuit" },
  ],
  colores: {
    // Carbón cálido + crema. El código visual del streetwear, y lo opuesto al
    // blanco genérico de la plantilla de Tiendanube que tienen hoy: en la
    // reunión la diferencia se ve sola. Fondos nunca puros (#000/#fff jamás).
    // ⚠️ NO es "negro y dorado" (vetado por Juani): el acento es cal, no oro.
    paper: "#0E0D0C", paper100: "#171614", paper200: "#221F1C",
    tinta: "#F4F0EA", tinta700: "#CFC7BC", tinta500: "#9A9187", tinta400: "#6E675F",
    brand: "#F4F0EA", brand600: "#E4DED4", brand700: "#CFC7BC",
    brand400: "#FFFDF9", brand300: "#FFFFFF", brand50: "#221F1C",
    acento: "#D9FF3C", // cal: precios, stock y estados vivos. Un solo acento.
  },
  dbPrefix: "brack",
  demo: {
    usuario: "demo@brack.com.ar",
    password: "brack2026",
    nota: "Cuenta de demostración — el catálogo es el que Brack publica hoy en su tienda.",
  },
  copy: {
    heroTitulo: "First Brack, the rest later",
    heroBajada:
      "Indumentaria urbana, zapatillas y perfumería importada. 20% off en efectivo, 6 cuotas sin interés y envío gratis superando $200.000.",
    sobreTitulo: "La tienda, ordenada como se vende",
    sobreTexto:
      "Los drops se agotan por talle, las consultas entran por Instagram y por WhatsApp, y el stock vive en la cabeza. Acá está todo en un solo lugar: el catálogo con sus talles y medidas, los pedidos, y cada consulta con su historial — escriba por donde escriba.",
  },
};
/** #DF0A0A -> "223 10 10" (canales sueltos: así Tailwind puede aplicar /opacidad) */
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


// ── Lo que dice Google (relevado 18-ago-2026 de su ficha) ────────────────────
// 🔴 Son SOLO 3 opiniones: el número pelado no luce. Se muestra la calificación
// y se apoya en Instagram, que es donde de verdad tienen comunidad.
export const GOOGLE = {
  rating: 5.0,
  opiniones: 3,
  ficha: "https://www.google.com/maps/search/?api=1&query=Brack+25+de+Mayo+772+Santa+Rosa+La+Pampa",
};

// ── Instagram: su canal principal ────────────────────────────────────────────
export const INSTAGRAM = {
  usuario: "brack.indumentaria",
  url: "https://www.instagram.com/brack.indumentaria/",
};

// ── Las condiciones REALES de su tienda (del banner de brack.mitiendanube.com) ─
// No son promesas nuestras: es lo que él ya publica. Van en la web y las usa el
// asistente cuando le preguntan por pagos y envíos.
export const CONDICIONES = {
  descuentoEfectivoPct: 20,
  cuotasSinInteres: 6,
  envioGratisDesde: 200000,
  tiendaActual: "https://brack.mitiendanube.com/",
};
