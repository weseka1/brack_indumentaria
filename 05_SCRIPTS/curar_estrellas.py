# -*- coding: utf-8 -*-
"""
Elige las 8 piezas de la vitrina con criterio VISUAL, no solo por precio.

El problema que resuelve: la primera tanda salió con 7 prendas negras de 8.
Recortadas y puestas sobre el carbón de la marca, las negras se empastan entre
sí y la vitrina pierde ritmo — justo la sección que tiene que impactar.

Criterio, en orden:
  1. Máximo 2 por categoría (que no sean todos buzos).
  2. Al menos 3 piezas CLARAS, medidas por brillo real de la foto, no adivinado.
  3. Dentro de eso, las de mayor precio y con más fotos.
"""
import json, pathlib, sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from PIL import Image, ImageStat

BASE = pathlib.Path(r"c:\Users\46094\Desktop\WESEKA_IA_STRUCTURE\01_CLIENTES\BRACK_INDUMENTARIA\02_DEMO_WEB")
FOTOS = BASE / "fotos"
CAT = BASE / "data" / "catalogo.js"


def brillo(p):
    """Brillo medio del centro de la foto: ahí está la prenda, no el piso."""
    try:
        im = Image.open(FOTOS / p["photos"][0]).convert("L")
        w, h = im.size
        centro = im.crop((int(w * .25), int(h * .25), int(w * .75), int(h * .75)))
        return ImageStat.Stat(centro).mean[0]
    except Exception:
        return 0


def main():
    texto = CAT.read_text(encoding="utf-8")
    cat = json.loads(texto.split("window.CATALOGO = ", 1)[1].rsplit(";", 1)[0])

    for p in cat:
        p["_brillo"] = brillo(p)
        p["featured"] = False

    candidatos = [p for p in cat if len(p["photos"]) >= 2]
    candidatos.sort(key=lambda p: -p["range"])

    elegidos, por_cat = [], {}
    # 1ª pasada: las claras (brillo alto), que son las que faltaban
    claras = sorted([p for p in candidatos if p["_brillo"] > 120], key=lambda p: -p["range"])
    for p in claras:
        if len(elegidos) >= 3:
            break
        if por_cat.get(p["cat"], 0) >= 2:
            continue
        elegidos.append(p)
        por_cat[p["cat"]] = por_cat.get(p["cat"], 0) + 1

    # 2ª pasada: completar por precio, respetando el tope por categoría
    for p in candidatos:
        if len(elegidos) >= 8:
            break
        if p in elegidos or por_cat.get(p["cat"], 0) >= 2:
            continue
        elegidos.append(p)
        por_cat[p["cat"]] = por_cat.get(p["cat"], 0) + 1

    ids = {p["id"] for p in elegidos}
    for p in cat:
        p["featured"] = p["id"] in ids
        p.pop("_brillo", None)

    cabecera = texto.split("window.CATALOGO = ")[0]
    CAT.write_text(cabecera + "window.CATALOGO = " + json.dumps(cat, ensure_ascii=False) + ";\n",
                   encoding="utf-8")

    print("VITRINA (8 piezas):\n")
    for p in elegidos:
        claro = "clara" if brillo(p) > 120 else "oscura"
        print(f"   {p['model'][:40]:42} {p['cond'][:18]:20} ${p['range']:>8,}  {claro}")
    print(f"\n   categorías distintas: {len(por_cat)} · claras: {sum(1 for p in elegidos if brillo(p) > 120)}")


if __name__ == "__main__":
    main()
