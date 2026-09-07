// Paleta de marca para charts (recharts) — theme CLARO BRACK (estilo iPhone).
//
// 🔴 Venía del molde con theme CLARO: serie principal roja y textos en grafito
// (#16161A) sobre fondo blanco. Al pasar el panel a carbón, esos textos quedaban
// negro sobre negro —las etiquetas y los ejes directamente no se leían— y el
// rojo no pertenece a la marca.
//
// Ahora: cal como serie principal (el único acento de la casa), crema para la
// tinta, y grises cálidos para las series secundarias. Los estados sí conservan
// su semáforo (ámbar/rojo) porque ahí el color ES información: un stock crítico
// tiene que gritar, no combinar.
export const COLORS = {
  ink: "#111214", // tinta
  brand: "#111214", // tinta — serie principal (monocromo)
  brand300: "#8A8D92",
  graphite: "#6E7176", // serie secundaria
  green: "#16A34A", // ok / disponible
  amber: "#D97706", // espera
  sky: "#0369A1",
  // grilla y ejes sobre fondo oscuro
  grid: "rgba(17,18,20,0.07)",
  axis: "rgba(17,18,20,0.45)",
  // alias de opacidad
  ink10: "rgba(17,18,20,0.08)",
  ink60: "rgba(17,18,20,0.55)",
};

// Secuencia para series categóricas (torta/donut/barras por categoría).
// Arranca por el cal de marca y sigue con tonos que se distinguen sobre carbón.
export const SERIE = ["#111214", "#6E7176", "#A1A4A9", "#D97706", "#16A34A", "#0369A1", "#C9CCD1"];

// Tooltip oscuro, del mismo material que las cards del panel.
export const tooltipStyle = {
  background: "rgba(255,255,255,0.96)",
  border: "1px solid rgba(17,18,20,0.10)",
  borderRadius: 12,
  boxShadow: "0 18px 44px -20px rgba(17,18,20,0.28)",
  fontSize: 12,
  padding: "8px 12px",
  color: "#111214",
  backdropFilter: "blur(8px)",
} as const;

export const tooltipItemStyle = { color: "#111214" } as const;
export const tooltipLabelStyle = { color: "rgba(17,18,20,0.55)", marginBottom: 2 } as const;
