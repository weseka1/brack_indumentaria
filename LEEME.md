# Brack Indumentaria — demo

Tienda de indumentaria urbana en **Santa Rosa, La Pampa** (25 de Mayo 772).
Streetwear, zapatillas y perfumería árabe importada.

## Lo que está publicado hoy

| | |
|---|---|
| Web | https://wsk.com.ar/demos/brack/ |
| Colección | https://wsk.com.ar/demos/brack/coleccion.html |
| Panel | https://wsk.com.ar/demos/brack/panel/ |
| Acceso al panel | `demo@brack.com.ar` / `brack2026` |

## Qué carpeta es qué

| Carpeta | Qué es |
|---|---|
| `02_DEMO_WEB/` | **La web de la demo.** HTML + GSAP. Es la que está publicada. Acá viven las fotos del catálogo. |
| `04_PANEL/` | **El panel.** React + Vite + Tailwind. |
| `03_IMPLEMENTACION/frontend/` | Frontend del enlatado (React + Vite). |
| `05_SCRIPTS/` | Scripts que generaron el catálogo y las fotos desde la tienda real. |
| `CLAUDE.md` | El contexto completo del proyecto: quién es el cliente, qué se decidió y por qué. **Leelo antes de tocar nada.** |

## Para levantarlo

```bash
cd 04_PANEL        # o 03_IMPLEMENTACION/frontend
npm install
npm run dev
```

## Antes de tocar

- El catálogo son productos **reales** de Brack: no inventar precios ni stock.
- Las condiciones comerciales de ellos son 20% off en efectivo, 6 cuotas sin interés
  y envío gratis superando $200.000. Son del banner de su tienda, no inventadas.
- Google: 5,0 ★ con 3 opiniones. Son pocas: se usan los textos, no el número.
