# CLAUDE.md — Brack Indumentaria

**Leé este archivo entero antes de tocar nada.** Es todo el contexto del proyecto,
escrito el 19-ago-2026 para que otra ventana de VS Code arranque sin preguntar.

---

## 1) Quién es el cliente

**Brack Indumentaria** — tienda de ropa urbana en **Santa Rosa, La Pampa**
(25 de Mayo 772). Vende streetwear, zapatillas y **perfumería árabe importada**.

| | |
|---|---|
| WhatsApp | **2954 51-7938** — por acá entró y por acá se habla |
| Instagram | **@brack.indumentaria** |
| Tienda actual | **brack.mitiendanube.com** (Tiendanube) |
| Google | **5,0 ★ · 3 opiniones** (son pocas: no lucir el número, sí los textos) |
| Contacto | 📌 PENDIENTE: nombre del dueño / quién decide |

⚠️ **NO es de Bahía Blanca.** Se confunde porque entró junto con
[[Burgers Franklin]], que sí es de Bahía.

**Sus condiciones comerciales REALES** (del banner de su tienda, no inventadas):
**20% off en efectivo · 6 cuotas sin interés · envío gratis superando $200.000.**

---

## 2) Estado — 19-ago-2026

✅ **La demo está PUBLICADA y verificada en producción:**

```
Web:   https://wsk.com.ar/demos/brack/
Panel: https://wsk.com.ar/demos/brack/panel/
       demo@brack.com.ar / brack2026
```

🔴 **Reunión: hay que presentar la demo.** La reunión inicial ya se hizo.
Está cargada en `wsk_reuniones` **sin hora** — la hora la fija Juani.

---

## 3) Qué carpeta es qué

| Carpeta | Qué es | ¿Se usa? |
|---|---|---|
| `01_BRIEF/` | Ficha del cliente y lo que falta averiguar | ✅ |
| `02_DEMO_WEB/` | **La web de la demo.** HTML+GSAP, esqueleto de Islas Group | ✅ **ES LA QUE VA** |
| `04_PANEL/` | **El panel.** React+Vite, viene del panel de Miami Import | ✅ **ES EL QUE VA** |
| `03_IMPLEMENTACION/frontend/` | 🪦 Molde de ADER copiado y **DESCARTADO** | ❌ ignorar |
| `02_INFRA/` | Vacía, para cuando cierre | — |

> 🪦 **Sobre `03_IMPLEMENTACION`:** el primer intento fue con el enlatado de ADER
> (e-commerce React). Juani lo corrigió: *"la demo debía ser el esqueleto de
> Islas Group... modelo de ropa que desliza como los relojes"*. Quedó ahí como
> arqueología. **No lo toques ni lo borres sin preguntarle.**

---

## 4) La web (`02_DEMO_WEB/`)

Esqueleto de `01_CLIENTES/ISLAS GROUP & MATIAS ISLAS/02_DEMO_WEB/`.
Un `index.html` de ~1.400 líneas con GSAP + Lenis, todo inline.

**La sección que importa: la VITRINA (`#estrella`).** La prenda flota bajo un
reflector, con las vecinas difuminadas a los costados, y se desliza con el dedo.
Es el efecto que pidió Juani.

🔴 **Para que funcione, las 8 prendas de la vitrina van con el FONDO RECORTADO.**
Sus fotos están tomadas sobre piso de madera; sin recortar, el efecto no existe
—queda un carrusel de fotos común—. Se recortan con `rembg` (modelo
`isnet-general-use`), salen a `fotos/stars/<id>-star.png`.

### Paleta — **BLANCA, estilo iPhone**
🔴 **Se probó en carbón oscuro y Juani lo rechazó:** *"la web debe ser blanca
como la de Islas Group también, estilo iPhone bien fina"*. Y tenía razón: sobre
blanco la prenda es lo único con color y se recorta sola; sobre carbón, las
prendas (casi todas negras) se empastaban con el fondo.
Monocromo total: `--gold` **es la propia tinta**, no un color. En una tienda de
ropa el color lo pone la prenda, no la interfaz.

---

## 5) El panel (`04_PANEL/`)

Sale de `01_CLIENTES/MIAMI_IMPORT/05_PLATAFORMA/panel-app/`.

**Por qué ese molde y no otro:** el panel de Miami está escrito contra el
contrato de **Tiendanube** (`name.es`, `variants[].values[].es` = el talle,
`images[].src`). **Brack también vende por Tiendanube**, así que el panel habla
su idioma sin traducir nada — **variantes por talle incluidas**, que en ropa es
lo que más importa.

**Vistas:** Inicio · Vender · Productos · Cargar producto · A pedido · Reservas ·
Pedidos · Estadísticas · Precios USD · WhatsApp · Acciones.

### Modo demo (sin backend)
El molde pega contra un FastAPI que **acá no existe**. Se agregaron tres caídas:
1. `lib/DataProvider.tsx` — si la API falla, carga `src/data/demo.ts` del bundle.
2. `panel/auth.tsx` — si el login falla, acepta **solo** las credenciales de
   demostración que están impresas en la pantalla de login.
3. La sesión se guarda en `localStorage` (`brack_sesion_demo`) para que
   **sobreviva a un F5**: en medio de una reunión, un refresh devolvía al login.

---

## 6) Los datos — cómo se regeneran

**Todo el catálogo es REAL**, scrapeado de su Tiendanube. Cero productos inventados.

| | |
|---|---|
| Productos vendibles | **119** (de 320 publicados) |
| Fotos | **357**, descargadas y optimizadas a WebP |
| Variantes por talle | **141** |
| Precios | $20.000 – $165.000 (mediana $58.000) |

🔴 **Por qué 119 y no 320:** los otros **191 están AGOTADOS** en su tienda y
Tiendanube no les publica precio. Meterlos sería llenar la demo de fichas sin
precio y sin comprar. **Cuando reponga, se vuelve a correr el scraper.**

🔴 **El stock es booleano (disponible/agotado), no una cantidad.** Tiendanube no
publica cantidades y **no se inventan números** (decisión de Juani, 19-ago).

### Los scripts (viven en el scratchpad de la sesión, copiarlos si se necesitan)
```
scrape_brack.py        → brack_catalogo.json     (los 320 del sitemap)
gen_catalogo_js.py     → 02_DEMO_WEB/data/catalogo.js
gen_panel_brack.py     → 04_PANEL/src/data/demo.ts   (forma Tiendanube)
fotos_brack.py         → 02_DEMO_WEB/fotos/*.webp
curar_estrellas.py     → elige las 8 de la vitrina (categoría + brillo real)
recortar_estrellas.py  → recorta el fondo con rembg
```

---

## 7) 🔴 Cicatrices — errores ya pagados, no repetir

1. **Los ids NO se truncan.** Iban con `slug[:24]` y los cuatro
   *"Perfume Árabe Importado …"* colapsaban en el **mismo id**: compartían
   carrito, favoritos y link, y se pisaban el PNG de la vitrina.
2. **La vitrina se cura por categoría Y por brillo.** La primera tanda salió con
   7 prendas negras de 8 y se empastaban entre sí. Máximo 2 por categoría y al
   menos 3 claras, medido con el brillo real de la foto.
3. **Ojo con `%` en comentarios SQL**: psycopg2 los lee como placeholders. Van
   escapados `%%`.
4. **El prefijo de `localStorage` es del cliente** (`brack_*`). Con `miami_*`,
   dos demos en el mismo navegador se pisaban los perfiles: el panel de Brack
   mostraba *"Diego · Dueño"*.
5. **Los testimonios del molde son de OTRO cliente.** Se eliminaron, no se
   tradujeron. **No inventarle reseñas a Brack** — no las tiene.
6. **Los gráficos siguen la paleta del panel.** Venían con tema claro sobre
   carbón (texto negro sobre negro, ilegible). Ahora ambos son claros.

---

7. 🔴 **La demo se copió del esqueleto de Islas SIN los `assets/vendor/`.**
   `gsap.min.js`, `ScrollTrigger.min.js` y `lenis.min.js` no existían: **sin
   GSAP no hay ScrollTrigger, no hay Lenis y no hay vitrina deslizante**. La
   demo era un HTML estático y así se entregó. Juani lo vio de una:
   *"super incompletas, nada que ver a lo que venimos haciendo"*.
   👉 **Al clonar un esqueleto, lo primero que se verifica son las referencias
   locales**, no los textos. Eran 20 rotas de 26.
8. 🔴 **`panel.html` era el panel de Islas Group ENTERO, publicado** dentro de
   `/demos/brack/`. Nadie lo linkeaba, pero la URL respondía. El panel real de
   Brack es `/panel/` (el React). Eliminado.
9. 🔴 **El asistente conserva el cerebro del cliente anterior aunque el resto se
   rebrandee.** El de Brack recomendaba Seiko y Orient, hablaba de joyería GIA
   y tenía una **biografía inventada** ("Brack Islas, a los catorce vendía
   antigüedades en San Telmo"). Está al fondo del HTML y no se ve scrolleando:
   **hay que abrirlo y preguntarle**. Ahora lee `window.CATALOGO` y ningún
   número está escrito a mano.
10. 🔴 **El rebranding palabra-por-palabra deja frases rotas.** Reemplazar
   "San Telmo"→"El talle" produjo *"a los catorce vendía antigüedades en El
   talle"*; "Buenos Aires"→"La Pampa" dejó *"La Pampaenos Aires"*.
   👉 **Se verifica con el `innerText` renderizado, no con grep sobre el HTML.**
11. 🔴 **La sección oscura quedó con tinta oscura.** Al pasar la paleta a blanca,
   `.historia` siguió con fondo `--dark` pero sus textos en `rgba(17,18,20,…)`:
   negro sobre negro. Es la cicatriz nº6 repetida en otro archivo.
12. 🔴 **El mapa embebido apuntaba al Obelisco.** Un `<iframe>` de Maps se copia
   con la dirección del cliente anterior y **no da error**: muestra otra ciudad.

13. 🔴 **La vista Vender mostraba "Error 404" en el medio.** El POS pega a
   `/pos/buscar` del FastAPI, que en la demo no existe. El `DataProvider` ya
   tenía su caída al catálogo del bundle, pero **esa vista se había quedado
   afuera**: cada endpoint del molde necesita su propio fallback, no alcanza
   con el del provider.
14. 🔴 **Los 119 productos gritaban "Queda 1" en ROJO.** El umbral `st === 1`
   viene de Miami, donde el stock ES una cantidad. Acá cada talle entra con 1
   porque Tiendanube solo dice disponible/agotado → 119 alarmas falsas en la
   primera pantalla que ve el cliente. Y el Dashboard decía lo contrario
   (*"Stock crítico: 0"*), porque ese número sale de `stats.stock_bajo`.
   👉 Hoy la semántica vive en **un solo lugar**: `necesitaReposicion()` /
   `UMBRAL_REPOSICION` en `panel/api/miamiApi.ts`. Las cards dicen
   **Disponible / Agotado**. Si Brack algún día carga cantidades reales, se
   sube el umbral **ahí y en ningún otro lado**.
15. ⚠️ **Los placeholders también son datos de otro cliente.** El del teléfono
   decía `11 2233 4455` (Buenos Aires) en Vender y en A pedido.

## 8) Lo que FALTA

- [x] ~~Las secciones de abajo con textos de relojería~~ — **hecho 19-ago.**
      Se reescribieron las 12 secciones + el asistente. Auditado: **0 rastros**
      de Islas en el `innerText` y **0 referencias locales rotas**.
- [x] ~~Mobile 390px~~ — **verificado 19-ago** con
      `setDeviceMetricsOverride({mobile:true})`: `scrollWidth - innerWidth = 0`.
      (El marquee de marcas desborda tinta a propósito, dentro de su
      `overflow:hidden`.)
- [ ] **Checkout Stripe (LLC)** — lo pidió Juani, como en Miami Import
- [ ] Un link visible de la web al panel
- [ ] Las vistas que no se recorrieron todavía: A pedido · Reservas · Pedidos ·
      WhatsApp · Acciones. Las 6 que sí se miraron (Inicio, Vender, Productos,
      Cargar, Estadísticas, Precios USD) están verificadas en producción.
- [ ] 📌 Confirmar con Juani: nombre del dueño, y si quiere sección Mayorista

## 9) Cómo se rebuildea y publica

```powershell
# panel
cd 04_PANEL ; $env:DEMO_BASE="/demos/brack/panel/" ; npm run build

# copiar todo a la plataforma
#   02_DEMO_WEB/*        → apps/public-site/public/demos/brack/
#   04_PANEL/dist/*      → apps/public-site/public/demos/brack/panel/

cd 02_PRODUCTO/PLATAFORMA_WESEKA
git add apps/public-site/public/demos/brack
git commit -m "..."
git push deploy wsk-panel-live:main      # Render, ~2 min
```

⚠️ **Las fotos se optimizan antes de publicar** (760px, calidad 72): sin eso son
70 MB. Optimizadas quedan en ~30 MB.

Ver `_CEREBRO/Clientes/Brack Indumentaria.md` · `_CEREBRO/Sesiones/2026-08-19.md`
## Estándar visual obligatorio
Antes de cualquier decisión de diseño, leer ESTANDAR-IOS.md.
Pedido explícito del cliente: basarse en iOS.