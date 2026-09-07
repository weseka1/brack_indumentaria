# Brack — frontend (enlatado WESEKA)

> ⚠️ **Contexto completo + estándares del proyecto:** leer [`../../CLAUDE.md`](../../CLAUDE.md) (carpeta del cliente).
> Ahí está TODO: alcance, cómo trabajamos, estándares iPhone/glass/responsive, deploy, estado.

## Rápido
- **Rebrandear = tocar solo** `src/marca.ts` + `src/data/*`. Tailwind NO se toca (colores = CSS vars).
- Marca de Brack ya hecha en `src/marca.ts` (rojo #df0a0a, theme claro).
- Base = enlatado inmobiliario de Yagüe → **hay que pasarlo a e-commerce de electro** (propiedades → productos).

## Estándares que NO se rompen (resumen — detalle en el CLAUDE.md del cliente)
1. Estética **iPhone**: fina, glass, prolija, premium.
2. **Responsive perfecto**: al achicar NO se deforma, nunca scroll horizontal.
3. **Mobile-first**: verificar en celular real (CDP screenshot).
4. **Funciona perfecto**: verificar interactivamente antes de entregar.

## Comandos
```powershell
npm install
npm run dev
# build para deploy (desde PowerShell, no Git Bash):
$env:DEMO_BASE = "/demos/brack/"; npm run build
```
