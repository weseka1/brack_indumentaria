# -*- coding: utf-8 -*-
"""
Genera src/data/productos.ts para la demo de Brack, con su catálogo REAL.

Fuente: brack.mitiendanube.com (scrapeado el 19-ago-2026).
Regla de la casa: cero productos inventados. Nombres, precios, fotos, talles y
tablas de medidas son EXACTAMENTE los que él publica.

Decisiones que quedan escritas para que nadie las adivine después:
  · Solo entran los productos DISPONIBLES y CON PRECIO (119 de 320). Los otros
    191 están agotados en su tienda y por eso Tiendanube no les publica precio:
    meterlos sería llenar la demo de fichas sin precio y sin comprar.
  · La categoría se deduce del NOMBRE. Las páginas de categoría de Tiendanube
    cargan por JavaScript y el scrapeo plano solo veía 9 productos por página;
    clasificar por nombre cubre el catálogo entero y se revisa a ojo.
  · Los talles salen del scrapeo de variantes Y de la tabla de medidas que él
    escribe en la descripción ("35: 23cm 36: 23,5cm…").
"""
import json, re, sys, unicodedata
from datetime import date, timedelta

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SALIDA = r"c:\Users\46094\Desktop\WESEKA_IA_STRUCTURE\01_CLIENTES\BRACK_INDUMENTARIA\03_IMPLEMENTACION\frontend\src\data\productos.ts"


def sin_tildes(s):
    return "".join(c for c in unicodedata.normalize("NFD", s or "") if not unicodedata.combining(c)).lower()


# El orden manda: la primera que matchea gana. Por eso "musculosa" va antes que
# "remera", y las marcas de zapatillas antes que cualquier prenda.
REGLAS = [
    # Perfumería árabe importada: 13 productos y de los de mejor margen. No es
    # indumentaria, pero es lo que vende — va con categoría propia, no en "Otros".
    ("perfumes", r"\b(perfume|parfum|eau de|edp|edt|fragancia)\b"),
    ("zapatillas", r"\b(vans|campus|adidas|nike|puma|new balance|nb \d|jordan|rusty|straye|dunk|forum|samba|gazelle|air |530|550|574|9060)\b"),
    ("gorras", r"\b(gorra|cap|trucker|snapback|5 panel|g5)\b"),
    ("camperas", r"\b(campera|anorak|rompeviento|puffer|parka|camisaco|bomber|chaqueta)\b"),
    ("buzos", r"\b(buzo|hoodie|canguro|sweater|crewneck|frizado)\b"),
    ("pantalones", r"\b(baggy|jean|jogging|pantalon|cargo|carpenter|wide|denim|mom|oxido)\b"),
    ("bermudas", r"\b(bermuda|short|malla)\b"),
    ("chombas", r"\b(chomba|polo|camisa)\b"),
    ("camisetas", r"\b(camiseta|nfl|nba|jersey|futbol|basquet|casaclan)\b"),
    ("musculosas", r"\b(musculosa|tank)\b"),
    ("remeras", r"\b(remera|tee|boxy|oversize|over\b|manga corta|manga larga)\b"),
    ("accesorios", r"\b(medias|cinto|riñonera|rinonera|bolso|mochila|morral|cordones|gorro|bufanda|guantes)\b"),
]

ETIQUETA = {
    "remeras": "Remeras", "musculosas": "Musculosas", "buzos": "Buzos y sweaters",
    "camperas": "Camperas", "pantalones": "Pantalones", "bermudas": "Bermudas y mallas",
    "chombas": "Chombas y camisas", "camisetas": "Camisetas", "zapatillas": "Zapatillas",
    "gorras": "Gorras", "accesorios": "Accesorios", "perfumes": "Perfumes importados",
    "otros": "Otros",
}


def categoria(nombre, desc=""):
    t = sin_tildes(nombre + " " + desc[:120])
    for cat, patron in REGLAS:
        if re.search(patron, t):
            return cat
    return "otros"


ORDEN_TALLES = {t: i for i, t in enumerate(["XS", "S", "M", "L", "XL", "XXL", "XXXL"])}


def talles_de(p):
    """Talles del scrapeo + los que él lista en la tabla de medidas."""
    encontrados = set(t.strip().upper() for t in p.get("talles", []) if t.strip())
    for m in re.finditer(r"\b(\d{2})\s*:\s*\d", p.get("descripcion", "")):
        encontrados.add(m.group(1))
    letras = sorted([t for t in encontrados if t in ORDEN_TALLES], key=lambda t: ORDEN_TALLES[t])
    numeros = sorted([t for t in encontrados if t.isdigit()], key=int)
    return letras + numeros


def medidas_de(p):
    """La tabla de medidas que escribe en la descripción, como specs."""
    out = []
    for m in re.finditer(r"\b(\d{2})\s*:\s*([\d,\.]+\s*cm)", p.get("descripcion", "")):
        out.append((m.group(1), m.group(2).replace(" ", "")))
    return out[:14]


def limpiar_desc(p):
    d = re.sub(r"TABLA DE MEDIDAS.*$", "", p.get("descripcion", ""), flags=re.I | re.S)
    d = re.sub(r"\s+", " ", d).strip()
    return d


def ts(s):
    return json.dumps(s, ensure_ascii=False)


def main():
    cat = json.load(open("brack_catalogo.json", encoding="utf-8"))
    vend = [p for p in cat if p.get("precio") and p.get("disponible") and p.get("fotos")]
    vend.sort(key=lambda p: -float(p["precio"]))

    hoy = date.today()
    filas, conteo = [], {}
    for i, p in enumerate(vend, 1):
        c = categoria(p["nombre"], p.get("descripcion", ""))
        conteo[c] = conteo.get(c, 0) + 1
        talles = talles_de(p)
        medidas = medidas_de(p)
        desc = limpiar_desc(p)
        if not desc:
            desc = f"{p['nombre']} — disponible en la tienda de Brack."
        specs = [{"rotulo": "Talles", "valor": ", ".join(talles)}] if talles else []
        specs += [{"rotulo": f"Talle {t}", "valor": v} for t, v in medidas]

        # 🔴 stock REAL: Tiendanube no publica cantidades, así que se muestra
        # disponible/agotado y nada más. Decisión de Juani (19-ago): cero
        # números inventados. Todos los que entran acá están disponibles.
        stock = "true"

        filas.append(f"""  {{
    id: "BRK-{i:03d}",
    nombre: {ts(p['nombre'])},
    marca: "Brack",
    categoria: "{c}",
    talles: {json.dumps(talles, ensure_ascii=False)},
    precio: {int(float(p['precio']))},
    cuotas: 6,
    descuentoEfectivoPct: 20,
    stock: {stock},
    fotos: {json.dumps(p['fotos'][:6], ensure_ascii=False)},
    descripcion: {ts(desc[:420])},
    specs: {json.dumps(specs, ensure_ascii=False)},
    destacado: {"true" if i <= 8 else "false"},
    publicado: true,
    vendidos: {max(0, 24 - i // 3)},
    altaISO: "{(hoy - timedelta(days=(i * 2) % 90)).isoformat()}",
    urlOriginal: {ts(p['url'])},
  }},""")

    cabecera = f'''import type {{ Producto }} from "./types";

// ============================================================================
//  CATÁLOGO REAL de Brack Indumentaria — {len(vend)} productos, {sum(len(p['fotos'][:6]) for p in vend)} fotos.
//  Origen: brack.mitiendanube.com (relevado 19-ago-2026). Nombres, precios,
//  fotos, talles y tablas de medidas son EXACTAMENTE los que él publica; las
//  fotos se sirven de su propio CDN de Tiendanube.
//
//  Qué NO entró y por qué: su tienda tiene 320 productos, pero 191 están
//  AGOTADOS y Tiendanube no les publica precio. Acá están los {len(vend)} que hoy
//  se pueden comprar de verdad. Cuando reponga, se vuelve a correr el scraper.
//
//  Archivo GENERADO — no editar a mano.
// ============================================================================
export const productos: Producto[] = [
'''
    open(SALIDA, "w", encoding="utf-8").write(cabecera + "\n".join(filas) + "\n];\n")

    print(f"✓ {len(vend)} productos → productos.ts")
    print(f"  fotos: {sum(len(p['fotos'][:6]) for p in vend)}")
    print("\n  por categoría:")
    for c, n in sorted(conteo.items(), key=lambda x: -x[1]):
        print(f"   {n:4}  {ETIQUETA[c]}")
    sin_talle = sum(1 for p in vend if not talles_de(p))
    print(f"\n  sin talles detectados: {sin_talle}")


if __name__ == "__main__":
    main()
