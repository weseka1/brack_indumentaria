# -*- coding: utf-8 -*-
"""
Dos cosas que faltaban para que la demo sea de Brack y no de Islas:

1) LA VITRINA. El array STARS del JS todavía apuntaba a los PNG de los relojes.
   Se reemplaza por las 8 prendas recortadas, con su nombre, su categoría y su
   precio REAL, y el mensaje de WhatsApp armado por prenda.

2) LOS TESTIMONIOS. 🔴 Los de Islas son reseñas REALES de otro cliente. No se
   traducen ni se “adaptan”: se eliminan. Inventarle testimonios a Brack sería
   exactamente lo que la casa tiene prohibido. En su lugar va lo que sí es
   verdad y sí vende: sus condiciones (20% efectivo, 6 cuotas, envío gratis) y
   el dato de que las medidas están publicadas talle por talle.
"""
import json, pathlib, re, sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
BASE = pathlib.Path(r"c:\Users\46094\Desktop\WESEKA_IA_STRUCTURE\01_CLIENTES\BRACK_INDUMENTARIA\02_DEMO_WEB")
P = BASE / "index.html"
s = P.read_text(encoding="utf-8")

cat = json.loads((BASE / "data" / "catalogo.js").read_text(encoding="utf-8")
                 .split("window.CATALOGO = ", 1)[1].rsplit(";", 1)[0])
estrellas = [p for p in cat if p.get("featured")]
disponibles = {f.stem.replace("-star", "") for f in (BASE / "fotos" / "stars").glob("*.png")}
estrellas = [p for p in estrellas if p["id"] in disponibles]

# ── 1) el array de la vitrina ────────────────────────────────────────────────
def fmt(n):
    return f"${n:,.0f}".replace(",", ".")

items = []
for p in estrellas:
    talles = p["material"] if p["material"] != "Talle único" else "Talle único"
    items.append(
        "    { img: 'fotos/stars/%s-star.png', name: %s, brand: %s, wa: %s }" % (
            p["id"],
            json.dumps(p["model"], ensure_ascii=False),
            json.dumps(f"{p['cond']} — {fmt(p['range'])} · {talles}", ensure_ascii=False),
            json.dumps(p["model"], ensure_ascii=False),
        ))

viejo = re.search(r"var STARS = \[.*?\];", s, re.S)
if viejo:
    s = s.replace(viejo.group(0), "var STARS = [\n" + ",\n".join(items) + "\n  ];")
    print(f"✓ vitrina: {len(items)} prendas reales (antes: relojes)")
else:
    # el array puede no llamarse STARS: se busca por el primer PNG de relojes
    bloque = re.search(r"\[\s*\{[^\]]*stars/rolex[^\]]*\]", s, re.S)
    if bloque:
        s = s.replace(bloque.group(0), "[\n" + ",\n".join(items) + "\n  ]")
        print(f"✓ vitrina (por patrón): {len(items)} prendas reales")
    else:
        print("⚠️ no encontré el array de la vitrina")

# las tres <img> del HTML que arrancan la sección
if len(estrellas) >= 3:
    s = s.replace("fotos/stars/rolex-submariner_hulk-46meft-0.png", f"fotos/stars/{estrellas[0]['id']}-star.png")
    s = s.replace("fotos/stars/cartier-santos-y8p7u3-0.png", f"fotos/stars/{estrellas[-1]['id']}-star.png")
    s = s.replace("fotos/stars/rolex-daytona-n6fx4w-0.png", f"fotos/stars/{estrellas[1]['id']}-star.png")
    print("✓ imágenes iniciales de la vitrina")

s = s.replace('<small id="starBrand">Rolex — Discontinuado 2020</small>',
              f'<small id="starBrand">{estrellas[0]["cond"]} — {fmt(estrellas[0]["range"])}</small>')
s = s.replace('<span id="starName">Submariner “Hulk”</span>',
              f'<span id="starName">{estrellas[0]["model"]}</span>')
s = s.replace('<div class="estrella-count"><span id="starIdxLbl">01</span> — 04</div>',
              f'<div class="estrella-count"><span id="starIdxLbl">01</span> — {len(estrellas):02d}</div>')
s = s.replace("Piezas estrella de la casa", "Lo que está saliendo")
s = s.replace("Consultar por esta pieza", "Consultar por esta prenda")

# ── 2) fuera los testimonios de otro cliente ─────────────────────────────────
nuevas = [
    ("Todas las medidas publicadas, talle por talle. Sabés si te entra antes de comprar.", "Talles", "Cómo compramos"),
    ("20% off pagando en efectivo. Seis cuotas sin interés con tarjeta.", "Pagos", "Condiciones"),
    ("Envío gratis a todo el país superando $200.000.", "Envíos", "Condiciones"),
    ("Los drops salen por tanda y no se repiten: lo que queda, queda.", "Stock", "Cómo trabajamos"),
]
bloque = re.search(r"var revs = \[.*?\];", s, re.S)
if not bloque:
    bloque = re.search(r"\[\s*\{ q: 'Compré un Cuban Link.*?\];", s, re.S)
if bloque:
    js = "var revs = [\n" + ",\n".join(
        "    { q: %s, n: %s, t: %s }" % (json.dumps(q, ensure_ascii=False),
                                          json.dumps(n, ensure_ascii=False),
                                          json.dumps(t, ensure_ascii=False))
        for q, n, t in nuevas) + "\n  ];"
    s = s.replace(bloque.group(0), js)
    print("✓ testimonios de Islas ELIMINADOS → condiciones reales de Brack")
else:
    print("⚠️ no encontré el bloque de testimonios")

P.write_text(s, encoding="utf-8")
print(f"\nquedan 'Islas' visibles: {len(re.findall('Islas Group|ISLAS GROUP', s))}")
print(f"quedan 'rolex' en rutas: {len(re.findall('stars/rolex|stars/cartier', s))}")
