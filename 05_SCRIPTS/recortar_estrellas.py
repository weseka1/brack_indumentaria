# -*- coding: utf-8 -*-
"""
Recorta el fondo de las piezas ESTRELLA (rembg) para que floten como los relojes.

Por qué hace falta: la sección "estrella" de Islas funciona porque los relojes
son PNG sin fondo — la pieza flota sobre la luz, con su sombra propia. Las fotos
de Brack están tomadas sobre un piso de madera. Puestas tal cual, la sección se
ve como un carrusel de fotos cualquiera y se pierde justo el efecto que Juani
quiere ("modelo de ropa que desliza como los relojes").

Solo se recortan las que van a la vitrina (8 piezas). El catálogo entero queda
con sus fotos originales: ahí el fondo no molesta y recortar 357 sería tirar
tiempo y calidad.
"""
import json, pathlib, sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from PIL import Image
from rembg import remove, new_session

BASE = pathlib.Path(r"c:\Users\46094\Desktop\WESEKA_IA_STRUCTURE\01_CLIENTES\BRACK_INDUMENTARIA\02_DEMO_WEB")
FOTOS, STARS = BASE / "fotos", BASE / "fotos" / "stars"


def recortar(sesion, origen, destino):
    im = Image.open(origen).convert("RGBA")
    out = remove(im, session=sesion, alpha_matting=True,
                 alpha_matting_foreground_threshold=250,
                 alpha_matting_background_threshold=12,
                 alpha_matting_erode_size=4)
    # recortar al contenido: sin esto la prenda queda chica y descentrada
    caja = out.getbbox()
    if caja:
        out = out.crop(caja)
    # lienzo cuadrado con aire, como las fichas de Islas
    lado = int(max(out.size) * 1.12)
    lienzo = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    lienzo.paste(out, ((lado - out.width) // 2, (lado - out.height) // 2), out)
    if lado > 1200:
        lienzo = lienzo.resize((1200, 1200), Image.LANCZOS)
    lienzo.save(destino, "PNG", optimize=True)
    return destino.stat().st_size


def main():
    cat = json.loads(
        (BASE / "data" / "catalogo.js").read_text(encoding="utf-8")
        .split("window.CATALOGO = ", 1)[1].rsplit(";", 1)[0])
    destacados = [p for p in cat if p.get("featured")]
    STARS.mkdir(parents=True, exist_ok=True)

    print(f"recortando {len(destacados)} piezas estrella…\n")
    sesion = new_session("isnet-general-use")  # el bueno para producto/prenda
    for p in destacados:
        origen = FOTOS / p["photos"][0]
        destino = STARS / f"{p['id']}-star.png"
        try:
            kb = recortar(sesion, origen, destino) / 1024
            print(f"   ✓ {p['model'][:44]:46} {kb:6.0f} KB")
        except Exception as e:
            print(f"   ✗ {p['model'][:44]:46} {str(e)[:50]}")


if __name__ == "__main__":
    main()
