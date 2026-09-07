# Brack — Contratos del reskin (inmobiliario → electro)

> Documento de coordinación entre los equipos SITE / PANEL / IA.
> La capa de datos (src/data/*, src/lib/DataProvider.tsx, src/lib/fechas.ts, src/marca.ts,
> tailwind.config.js, src/index.css) es del orquestador: **se consume, NO se toca.**

## El negocio (hechos reales, no inventar otros)
- Brack Indumentaria, Santa Fe 85, Bahía Blanca. Marcos (dueño). 30+ años de service de heladeras/lavarropas.
- WhatsApp: +54 9 291 436-4529 (`5492914364529`). Mail: adermarcosrefrigeracion@gmail.com. IG: @brack_refrigeracion_marcos.
- Vende: electro nuevo (heladeras, freezers, lavarropas, secarropas, cocinas, aires, microondas) + **usados reacondicionados por el taller con garantía escrita de 6 meses**.
- Condiciones reales de su tienda: **6 cuotas sin interés**, **10% de descuento en efectivo**, **envío e instalación sin cargo en Bahía**, garantía 6 meses.
- Canal mayorista real (hoy con formulario manual): revendedores con lista propia y compra mínima.
- Copy aprobado: `00_BRIEF/ESTRATEGIA_COPY_ADER.md` (hero "Se lo vendemos. Y se lo arreglamos.", asistente **Camila**, orden de home CRO). Research: `00_BRIEF/ANALISIS_360_ADER.md`.
- Registro de copy: formal argentino (usted/neutro), humano, sin clichés de IA, sin emojis en UI, sin guiones largos.

## Dominio (src/data/types.ts — leerlo entero antes de arrancar)
- `Producto` (id Brack-xxx, categoria, condicion nuevo|usado, precio ARS, cuotas, descuentoEfectivoPct, stock, fotos[], specs[], garantiaMeses, destacado, publicado, vendidos). Helpers: `valorCuota(p)`, `precioEfectivo(p)`, `CATEGORIAS_PRODUCTO`.
- `Pedido` (items[], total, medioPago, entrega retiro|envio, estado nuevo→confirmado→preparando→entregado|cancelado, canal web|local|whatsapp|mayorista, revendedorId?).
- `OrdenServicio` (equipo, falla, diagnostico?, presupuesto?, estado ingresada→diagnostico→presupuestada→reparacion→lista→entregada|cancelada, tecnico, compradoEnAder, pedidoId?, enGarantia).
- `Cliente` (tipo minorista|mayorista|service, equipos[] que le vendimos, comprasARS).
- `Revendedor` (usuario, descuentoPct → su lista = lista − %, compraMinima, saldoCuenta). Helper `precioMayorista(p, r)`.
- `Lead` (interes producto|service|mayorista, canal web|whatsapp|instagram|mail|telefono, estado nueva→contactado→cotizado→vendido|perdido).
- `Conversacion` (src/data/conversaciones.ts): bandeja multicanal con `productoId?`, `ordenId?`, mensajes de cliente|ia|humano, estado ia|vos|cerrada.

## DataProvider (src/lib/DataProvider.tsx — API estable)
`useData()` expone: colecciones (productos, pedidos, ordenes, clientes, revendedores, leads, conversaciones) + getters (`getProducto/getCliente/getRevendedor`) + CRUD (`addX/updateX/deleteX` por colección, `addLead`, `addPedido`, `addConversacion`, `agregarMensaje`, `setEstadoConversacion`, `marcarLeida`) + KPIs (`kpis.{ventasMesARS,pedidosNuevos,pedidosActivos,serviceAbiertas,serviceListas,consultasNuevas,stockBajo,productosPublicados,clientes,conversion}`) + series (`consultasPorMes`, `facturacionPorMes`, `servicePorMes`, `leadsPorCanal`, `embudoPedidos`, `ventasPorCategoria`).
Persistencia demo: localStorage `brack_demo_*` con `SEED_VERSION` (si cambian seeds la sube el orquestador). Prod: Supabase tablas `brack_*`.

## Rutas finales (App.tsx — lo escribe el equipo SITE)
```
/                    Home
/tienda              Catálogo con filtros (categoría, condición nuevo/usado, marca)
/producto/:id        Detalle + agregar al carrito
/carrito             Carrito + checkout demo (crea Pedido canal "web" estado "nuevo")
/service             Página service: historia taller + form "solicitar reparación" (crea OrdenServicio "ingresada" + Lead interes service)
/mayorista           Portal revendedores: login por usuario (revendedores seed) → SU lista con precioMayorista + compra mínima + pedido (canal "mayorista")
/favoritos, /cuenta  Se mantienen (adaptar textos)
/ingresar            Login del panel (lo toca PANEL)
/panel/*             PanelApp (lo toca PANEL)
```
Compat: rutas viejas (/propiedades, /propiedad/:id, /temporada…) → redirect a /tienda o /.

## Panel (rutas internas — equipo PANEL)
```
/panel               Dashboard (KPIs + gráficos: facturación, consultas vs ventas, embudo pedidos, ventas por categoría, service)
/panel/bandeja       Bandeja multicanal (conversaciones + leads) — el "ordenamiento multicanal"
/panel/pedidos       Kanban/lista de pedidos por estado
/panel/productos     Stock y catálogo (grid + editar + stock bajo)
/panel/cargar        Cargar producto (form)
/panel/service       Órdenes de trabajo (tabla + detalle + estados + vínculo compradoEnAder)
/panel/clientes      CRM (ficha con equipos comprados + historial)
/panel/mayorista     Revendedores (lista, descuento, cta cte, alta)
/panel/reportes      Reportes
/panel/asistente     Copiloto IA (lo toca IA)
```
Perfiles Brack (profiles.tsx): Marcos (Dueño, admin) / Vendedor (Ventas) / Diego (Técnico). Secciones basic: bandeja, pedidos, productos, cargar, clientes, service. Extra (admin habilita): inicio, asistente, mayorista, reportes. Claves localStorage → prefijo `brack_`.

## IA (equipo IA)
- Web: `ChatAsistente.tsx` = **Camila** (config en netlify/functions/_config.ts). Catálogo liviano → productos (id, nombre, marca, categoría, condición, precio formateado, cuotas, stock). Sabe: precios/cuotas/stock/garantías + "¿reparan X?" (sí: 30 años, cualquier marca; deriva a orden/WhatsApp) + mayorista (pide CUIT/mail, deriva). Captura lead → `addLead` + refleja conversación en bandeja (`addConversacion`/`agregarMensaje` canal "web").
- Panel: `pages/Asistente.tsx` = copiloto sobre datos reales del provider (arma contexto con pedidos/órdenes/stock/consultas y responde "¿cuánto vendimos esta semana?", redacta respuestas, resume el día). Endpoint `/api/chat`.
- Prod estático (wsk.com.ar/demos/brack): fallback si `/api` no existe → edge function Supabase (patrón Hidro: `01_CLIENTES/HIDRO_PROYECTOS/03_IMPLEMENTACION/edge-function-hidro/index.ts`). Key SOLO en secrets.

## Estándares (innegociables, CLAUDE.md del cliente)
1. Estética iPhone: fina, glass sutil, prolija, premium, minimalista. Theme CLARO, rojo #df0a0a = información (precio, CTA, estados), no decoración. Clases: `bg-paper/paper-100/paper-200`, `text-graph/graph-500/graph-400`, `bg-brand`, `text-brand`, acento verde `sea` para stock/estados vivos. Tipos: `font-display` (Clash Display) titulares con tracking negativo, `font-sans` (General Sans) cuerpo.
2. Responsive PERFECTO: nunca scroll horizontal, nada que se pise. flex/grid + clamp + max-w. Probar achicando.
3. Mobile-first: tocable, legible, menús con el dedo.
4. Funciona perfecto: cada botón, cada form. Nada muerto.
5. Sin tells de IA: nada de emojis como íconos, nada todo-centrado/todo-redondeado, sliders con flechas, hairlines 1px, sombras con medida.
6. Sin fotos falsas: productos sin foto usan una "placa de producto" tipográfica prolija (marca + modelo + pictograma lineal de la categoría sobre paper-200). Los 4 reales tienen PNG transparente de cloudfront (usar en hero/destacados).

## Reglas operativas
- Cada equipo toca SOLO sus archivos (arriba). Los del orquestador no se tocan.
- Borrar los archivos viejos del dominio inmobiliario que queden en tu área (Temporada, planos, fichas, tasaciones…) y limpiar imports. `public/img/props|campos` los borra el orquestador al final.
- Verificación: `npx tsc --noEmit` en `03_IMPLEMENTACION/frontend` hasta que TU área quede sin errores (puede haber errores de las otras áreas mientras tanto — solo los tuyos deben quedar en cero). NO levantar dev server ni build.
- Commits: no hacer git. El orquestador integra.
