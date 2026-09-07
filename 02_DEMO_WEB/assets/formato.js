/* ============ Formato de precios — Brack Indumentaria ============
   Lo cargan index.html y coleccion.html. Existe por una cicatriz:

   `range` en data/catalogo.js es un NÚMERO en pesos (165000), no el string
   "1200-1800" que traía el molde de relojería de Islas Group. Las tres
   pantallas seguían llamando range.replace('-', ' – ') y eso lanza
   "range.replace is not a function": en coleccion.html reventaba adentro del
   .map() y la grilla quedaba VACÍA —los 119 productos invisibles—, y en la
   ficha de index.html moría antes del classList.add('is-open'), así que el
   modal no abría nunca.

   Por eso el formateo vive en UN solo lugar. Si algún día el precio cambia de
   forma (rangos, dólares, listas), se toca acá y en ningún otro lado. */
(function () {
  "use strict";
  var B = (window.BRACK = window.BRACK || {});

  /* 20% off en efectivo: es una condición REAL de la tienda (está en el banner
     de su Tiendanube), no una promo inventada para la demo. */
  B.EFECTIVO_OFF = 0.20;

  B.pesos = function (n) {
    return "$" + Math.round(n).toLocaleString("es-AR");
  };

  /* Tolerante a propósito: acepta el número de hoy y el string del molde viejo,
     y ante cualquier otra cosa devuelve el texto de fallback en vez de romper
     la pantalla entera. Un precio que falta no puede vaciar el catálogo. */
  B.precio = function (r, fallback) {
    fallback = fallback || "A consultar";
    if (typeof r === "number" && isFinite(r) && r > 0) return B.pesos(r);
    if (typeof r === "string" && r.trim()) return r.indexOf("-") >= 0 ? r.replace("-", " – ") : r;
    return fallback;
  };

  B.efectivo = function (r) {
    if (typeof r !== "number" || !isFinite(r) || r <= 0) return null;
    return B.pesos(r * (1 - B.EFECTIVO_OFF));
  };

  /* La línea de precio completa, tal como la canta el local:
     "$86.500 · $69.200 en efectivo". Sin precio, una sola frase. */
  B.precioCompleto = function (r) {
    var p = B.precio(r, null);
    if (!p) return "Precio a consultar por WhatsApp";
    var ef = B.efectivo(r);
    return ef ? p + " · " + ef + " en efectivo" : p;
  };
})();
