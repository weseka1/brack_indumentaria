/* ============ MODO NOCHE — cerrar el local ============
   Compartido por index.html y coleccion.html. Va en el <head> y SIN defer:
   la primera parte tiene que correr antes del primer frame, si no el catálogo
   entra en blanco y recién después se apaga. Ese parpadeo, en una reunión, se
   ve más que el modo noche entero.

   No depende de GSAP a propósito: si las animaciones no cargan, el interruptor
   tiene que seguir andando igual.

   El prefijo de la clave es del cliente (brack_), cicatriz nº4: con un prefijo
   genérico, dos demos abiertas en el mismo navegador se pisan el estado. */
(function () {
  "use strict";
  var CLAVE = "brack_tema";
  var root = document.documentElement;

  /* localStorage puede lanzar (Safari privado, cookies bloqueadas). Un tema
     que no se puede guardar no puede tumbar la página. */
  function leer() {
    try {
      return localStorage.getItem(CLAVE);
    } catch (e) {
      return null;
    }
  }
  function guardar(v) {
    try {
      localStorage.setItem(CLAVE, v);
    } catch (e) {}
  }

  var night = leer() === "night";

  function pintar() {
    if (night) root.setAttribute("data-theme", "night");
    else root.removeAttribute("data-theme");
  }
  pintar(); // ← antes del primer frame: sin flash al cruzar de página

  /* El botón aparece más abajo en el documento, así que el resto espera al DOM. */
  function enchufar() {
    var btn = document.getElementById("niteBtn");
    if (!btn) return;
    btn.setAttribute("aria-pressed", String(night));
    window.__night = night;

    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var timer = null;

    /* de arriba hacia abajo: el escalonado sigue el orden del documento,
       así el sitio se apaga como se apagan las luces de un local */
    function zonas() {
      return Array.prototype.slice.call(
        document.querySelectorAll(".nav, .top, .mmenu, body > section, body > .head, body > .shop, .footer, .mt-chat")
      );
    }

    btn.addEventListener("click", function () {
      night = !night;
      guardar(night ? "night" : "day");
      btn.setAttribute("aria-pressed", String(night));
      window.__night = night;

      if (reduced) {
        pintar(); // sin escalonado: cambio directo
        return;
      }

      var z = zonas();
      z.forEach(function (el, i) {
        el.style.setProperty("--tdelay", Math.min(i * 26, 240) + "ms");
      });
      root.classList.add("is-theming");
      /* dos frames: que el navegador registre los delays ANTES de que cambien
         las variables. Con uno solo, la primera conmutación salía de golpe. */
      requestAnimationFrame(function () {
        requestAnimationFrame(pintar);
      });

      clearTimeout(timer);
      timer = setTimeout(function () {
        root.classList.remove("is-theming");
        z.forEach(function (el) {
          el.style.removeProperty("--tdelay");
        });
      }, 1100);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enchufar);
  else enchufar();
})();
