# -*- coding: utf-8 -*-
"""
data/catalogo.js para la demo de Brack, en el formato que ya consume el
esqueleto de Islas (window.CATALOGO).

Traducción del dominio, reloj → prenda:
    brand   → la línea/marca de la prenda (Shato, Casaclan, Bartone, Rusty…)
    model   → el nombre del producto
    cond    → categoría (Remeras, Buzos, Zapatillas…)
    range   → precio real en pesos
    mm      → sin uso en ropa: va el talle base
    material→ los talles disponibles
    gender  → Unisex salvo que el nombre diga otra cosa
Se mantienen los nombres de campo del molde para no tener que tocar el JS del
carrusel, el filtro ni el panel. Lo que cambia son las etiquetas visibles.
"""
import json, pathlib, re, sys, unicodedata

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
SALIDA = pathlib.Path(r"c:\Users\46094\Desktop\WESEKA_IA_STRUCTURE\01_CLIENTES\BRACK_INDUMENTARIA\02_DEMO_WEB\data\catalogo.js")
FOTOS = pathlib.Path(r"c:\Users\46094\Desktop\WESEKA_IA_STRUCTURE\01_CLIENTES\BRACK_INDUMENTARIA\02_DEMO_WEB\fotos")

ETIQ = {"remeras": "Remeras", "musculosas": "Musculosas", "buzos": "Buzos y sweaters",
        "camperas": "Camperas", "pantalones": "Pantalones", "bermudas": "Bermudas y mallas",
        "chombas": "Chombas y camisas", "camisetas": "Camisetas", "zapatillas": "Zapatillas",
        "gorras": "Gorras", "accesorios": "Accesorios", "perfumes": "Perfumes importados",
        "otros": "Otros"}

# Las líneas que él vende. Salen de los nombres reales de sus productos.
LINEAS = ["Shato", "Casaclan", "Bartone", "Hannover", "Kiech", "Rusty", "Vans", "Campus",
          "Puma", "New Balance", "Adidas", "Nike", "Straye", "NFL", "NBA", "MLB", "TNF",
          "Hawas", "Khamrah", "Asad", "Bharara", "Lionheart", "Amber Oud"]


def sin_tildes(s):
    return "".join(c for c in unicodedata.normalize("NFD", s or "") if not unicodedata.combining(c)).lower()


def linea_de(nombre):
    t = sin_tildes(nombre)
    for m in LINEAS:
        if sin_tildes(m) in t:
            return m
    return "Brack"


def main():
    prods = json.load(open("brack_catalogo.json", encoding="utf-8"))
    vend = [p for p in prods if p.get("precio") and p.get("disponible") and p.get("fotos")]
    vend.sort(key=lambda p: -float(p["precio"]))

    # el generador de productos.ts ya clasificó: se reusa el mismo criterio
    sys.path.insert(0, ".")
    import importlib.util
    spec = importlib.util.spec_from_file_location("g", "gen_productos_brack.py")
    g = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(g)

    out, sin_foto, usados = [], 0, set()
    for p in vend:
        # solo las fotos que de verdad se bajaron
        fotos = []
        for n in range(len(p["fotos"][:6])):
            f = FOTOS / f"{p['slug']}-{n}.webp"
            if f.exists():
                fotos.append(f.name)
        if not fotos:
            sin_foto += 1
            continue
        cat = g.categoria(p["nombre"], p.get("descripcion", ""))
        talles = g.talles_de(p)
        # 🔴 El id NO se trunca. Antes iba `slug[:24]` y los cuatro
        # "Perfume Árabe Importado …" colapsaban en el MISMO id: se pisaban el
        # PNG de la vitrina, y en la web habrían compartido carrito, favoritos
        # y link. Un id repetido en un catálogo es un bug silencioso y caro.
        idp = p["slug"]
        if idp in usados:
            n = 2
            while f"{idp}-{n}" in usados:
                n += 1
            idp = f"{idp}-{n}"
        usados.add(idp)
        out.append({
            "id": idp,
            "brand": linea_de(p["nombre"]),
            "model": p["nombre"],
            "cond": ETIQ[cat],
            "cat": cat,
            "era": "Temporada 2026",
            "range": int(float(p["precio"])),
            "mm": talles[0] if talles else "Único",
            "material": ", ".join(talles) if talles else "Talle único",
            "color": "",
            "gender": "Unisex",
            "featured": False,
            "photos": fotos,
            "medidas": [{"talle": t, "cm": v} for t, v in g.medidas_de(p)][:10],
            "url": p["url"],
        })

    # destacados: los 8 más caros que tengan 3+ fotos (para que el carrusel luzca)
    for p in [x for x in out if len(x["photos"]) >= 3][:8]:
        p["featured"] = True

    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    cabecera = (
        "// CATÁLOGO REAL de Brack Indumentaria — generado el 19-ago-2026 desde\n"
        "// brack.mitiendanube.com. Nombres, precios, talles, medidas y fotos son\n"
        "// los que él publica hoy. Solo entran los productos DISPONIBLES: su tienda\n"
        "// tiene 320 pero 191 están agotados y sin precio.\n"
        "// Archivo GENERADO — no editar a mano.\n")
    SALIDA.write_text(cabecera + "window.CATALOGO = " + json.dumps(out, ensure_ascii=False) + ";\n",
                      encoding="utf-8")

    import collections
    print(f"✓ {len(out)} productos → catalogo.js   (sin fotos bajadas: {sin_foto})")
    print(f"  fotos referenciadas: {sum(len(p['photos']) for p in out)}")
    print(f"  destacados: {sum(1 for p in out if p['featured'])}")
    print("\n  por categoría:", dict(collections.Counter(p["cond"] for p in out).most_common()))
    print("  por línea:", dict(collections.Counter(p["brand"] for p in out).most_common(8)))


if __name__ == "__main__":
    main()
