# Scripts de la demo de Brack

Todo lo que generó el catálogo, las fotos y el rebranding. Están acá para que la
demo se pueda **regenerar entera** cuando Brack reponga stock o cambie precios.

## Orden en que se corren

```bash
# 1. Traer el catálogo de su Tiendanube  → brack_catalogo.json
python scrape_brack.py

# 2. Bajar las fotos                     → 02_DEMO_WEB/fotos/*.webp
python fotos_brack.py

# 3. Datos de la WEB                     → 02_DEMO_WEB/data/catalogo.js
python gen_catalogo_js.py

# 4. Elegir las 8 de la vitrina          (categoría + brillo real de la foto)
python curar_estrellas.py

# 5. Recortarles el fondo                → 02_DEMO_WEB/fotos/stars/*.png
python recortar_estrellas.py

# 6. Datos del PANEL                     → 04_PANEL/src/data/demo.ts
python gen_panel_brack.py
```

`gen_productos_brack.py` es del intento con el molde de ADER (descartado): queda
porque los otros scripts **importan de él** las funciones de clasificación
(`categoria`, `talles_de`, `medidas_de`, `limpiar_desc`). No lo borres.

Los de rebranding (`rebrand_brack.py`, `hero_brack.py`, `vitrina_y_resenas.py`,
`categorias_brack.py`) ya se aplicaron sobre `02_DEMO_WEB/index.html`. Están de
registro: **no volver a correrlos** sobre el HTML actual o duplican cambios.

## Requisitos

`pillow`, `rembg` (con `onnxruntime`), `psycopg2`. Ya están instalados en la
máquina. El modelo de rembg (`isnet-general-use`, 179 MB) se baja solo la primera
vez a `~/.u2net/`.

## Ojo

- Los scripts escriben con **rutas absolutas** a `01_CLIENTES/BRACK_INDUMENTARIA/`.
  Si movés la carpeta, hay que actualizar la constante de arriba de cada uno.
- `scrape_brack.py` tarda ~2 min (324 páginas). `fotos_brack.py` ~4 min (357 fotos).
- Después de regenerar hay que **optimizar las fotos** antes de publicar
  (760px, calidad 72) — ver `../CLAUDE.md` §9.
