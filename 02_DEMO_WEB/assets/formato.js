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
    /* con === undefined, no con ||: precioCompleto pasa null a propósito para
       distinguir "sin precio" y quedarse con SU frase, no con esta */
    if (fallback === undefined) fallback = "A consultar";
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

  /* ---- las specs de la ficha ----
     También compartidas, porque index y coleccion tenían el mismo array
     duplicado y los dos venían de relojería: pedían "Era", "Caja … mm" y
     "Color", campos que en ropa no existen. En el catálogo real de Brack:
       cond     = la CATEGORÍA (Zapatillas, Camperas…), no una condición
       mm       = el primer talle disponible
       material = la lista completa de talles ("35, 36, 37…") o "Talle único"
       color    = vacío en los 119 → no se muestra
       era      = "Temporada 2026" en los 119 → no dice nada, no se muestra
     Regla: si no hay dato real, la fila no se dibuja. Nada de placeholders. */
  B.specs = function (d) {
    var filas = [["Categoría", d.cond]];

    var talles = d.material || d.mm;
    if (talles === "Talle único" || talles === "Único") filas.push(["Talle", "Único"]);
    else if (talles && String(talles).indexOf(",") >= 0) filas.push(["Talles", talles]);
    else if (talles) filas.push(["Talle", talles]);

    /* La tabla en centímetros la publican 3 productos. Cuando está, es lo que
       más despeja la duda de comprar ropa sin probársela: va entera. */
    if (d.medidas && d.medidas.length) {
      filas.push([
        "Medidas",
        d.medidas
          .map(function (m) {
            return m.talle + ": " + m.cm;
          })
          .join(" · "),
      ]);
    }

    if (d.gender) filas.push(["Género", d.gender]);

    return filas.filter(function (f) {
      return f[1];
    });
  };
})();
