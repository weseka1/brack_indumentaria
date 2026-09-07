# -*- coding: utf-8 -*-
"""
Datos del panel de Brack, en el MISMO contrato que consume el panel de Diego.

Por qué encaja tan bien: el panel de Miami Import está escrito contra la forma
Tiendanube (name.es, variants[].values[].es = el talle, images[].src). Brack
también vende por Tiendanube, así que el panel habla su idioma sin traducir
nada — incluidas las VARIANTES POR TALLE, que en ropa es lo que más importa.

Genera src/data/demo.ts:
  · productos: los 119 disponibles, una variante por talle
  · stats: calculadas de esos productos, no inventadas
  · store: los datos reales de su tienda
"""
import json, pathlib, sys, unicodedata
from datetime import date, timedelta

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
SALIDA = pathlib.Path(r"c:\Users\46094\Desktop\WESEKA_IA_STRUCTURE\01_CLIENTES\BRACK_INDUMENTARIA\04_PANEL\src\data\demo.ts")

CATS = {"remeras": "Remeras", "musculosas": "Musculosas", "buzos": "Buzos y sweaters",
        "camperas": "Camperas", "pantalones": "Pantalones", "bermudas": "Bermudas y mallas",
        "chombas": "Chombas y camisas", "camisetas": "Camisetas", "zapatillas": "Zapatillas",
        "gorras": "Gorras", "accesorios": "Accesorios", "perfumes": "Perfumes importados",
        "otros": "Otros"}


def slugify(s):
    s = "".join(c for c in unicodedata.normalize("NFD", s) if not unicodedata.combining(c)).lower()
    return "".join(c if c.isalnum() else "-" for c in s).strip("-")[:60]


def main():
    prods = json.load(open("brack_catalogo.json", encoding="utf-8"))
    vend = [p for p in prods if p.get("precio") and p.get("disponible") and p.get("fotos")]
    vend.sort(key=lambda p: -float(p["precio"]))

    sys.path.insert(0, ".")
    import importlib.util
    spec = importlib.util.spec_from_file_location("g", "gen_productos_brack.py")
    g = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(g)

    hoy = date.today()
    salida, cat_ids, vid, iid = [], {}, 1, 1
    for i, p in enumerate(vend, 1):
        c = g.categoria(p["nombre"], p.get("descripcion", ""))
        if c not in cat_ids:
            cat_ids[c] = len(cat_ids) + 1
        talles = g.talles_de(p) or ["Único"]
        precio = float(p["precio"])

        variantes = []
        for n, t in enumerate(talles):
            # 🔴 Stock: Tiendanube no publica cantidades y no se inventan (decisión
            # de Juani, 19-ago). Todos estos productos están DISPONIBLES en su
            # tienda: se marca 1 por talle, que es lo único que consta.
            variantes.append({
                "id": vid, "product_id": i, "position": n + 1,
                "price": f"{precio:.2f}", "compare_at_price": None,
                "promotional_price": f"{precio * 0.8:.2f}",   # el 20% off en efectivo, real
                "usd_price": None, "stock": 1,
                "sku": f"BRK-{i:03d}-{slugify(t).upper()[:6]}",
                "values": [{"es": t}], "visible": True,
            })
            vid += 1

        imagenes = []
        for n, u in enumerate(p["fotos"][:6]):
            imagenes.append({"id": iid, "product_id": i, "src": u, "position": n + 1,
                             "alt": [p["nombre"]], "width": 1024, "height": 1024})
            iid += 1

        salida.append({
            "id": i,
            "name": {"es": p["nombre"]},
            "handle": {"es": p["slug"]},
            "brand": "Brack",
            "published": True,
            "a_pedido": False,
            "destacado": i <= 8,
            "mas_vendido": 9 <= i <= 16,
            "free_shipping": precio >= 200000,      # su envío gratis real
            "variants": variantes,
            "images": imagenes,
            "categories": [{"id": cat_ids[c], "name": {"es": CATS[c]},
                            "handle": {"es": c}, "parent": None}],
            "description": {"es": g.limpiar_desc(p)[:400]},
            "created_at": (hoy - timedelta(days=(i * 2) % 120)).isoformat(),
            "updated_at": hoy.isoformat(),
        })

    stock_total = sum(v["stock"] for p in salida for v in p["variants"])
    variantes_total = sum(len(p["variants"]) for p in salida)
    stats = {
        "productos": {"total": len(salida), "publicados": len(salida), "sin_stock": 0,
                      "variantes": variantes_total, "stock_total": stock_total},
        "pedidos": {"total": 0, "pagados": 0, "pendientes": 0,
                    "facturado_total": 0, "ticket_promedio": 0},
        "top_vendidos": [],
        "stock_bajo": [],
    }
    store = {"name": "Brack Indumentaria", "url": "https://brack.mitiendanube.com",
             "product_url_base": "https://brack.mitiendanube.com/productos/", "usd_rate": 0}

    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    SALIDA.write_text(
        "import type { MiamiProducto, MiamiStats, MiamiStore } from \"@/panel/api/miamiApi\";\n\n"
        "// ============================================================================\n"
        f"//  DATOS DE LA DEMO — catálogo REAL de Brack: {len(salida)} productos,\n"
        f"//  {variantes_total} variantes por talle, {iid-1} fotos.\n"
        "//  Origen: brack.mitiendanube.com (19-ago-2026). Su tienda tiene 320 productos\n"
        "//  pero 191 están agotados y sin precio: entran solo los que se venden hoy.\n"
        "//  El panel los consume igual que los de Miami Import — mismo contrato\n"
        "//  Tiendanube, incluidas las variantes por talle.\n"
        "//  Archivo GENERADO — no editar a mano.\n"
        "// ============================================================================\n\n"
        f"export const productosDemo: MiamiProducto[] = {json.dumps(salida, ensure_ascii=False)};\n\n"
        f"export const statsDemo: MiamiStats = {json.dumps(stats, ensure_ascii=False)};\n\n"
        f"export const storeDemo: MiamiStore = {json.dumps(store, ensure_ascii=False)};\n",
        encoding="utf-8")

    print(f"✓ {len(salida)} productos · {variantes_total} variantes (talles) · {iid-1} fotos")
    print(f"  destacados: {sum(1 for p in salida if p['destacado'])} · "
          f"más vendidos: {sum(1 for p in salida if p['mas_vendido'])} · "
          f"envío gratis: {sum(1 for p in salida if p['free_shipping'])}")
    print(f"  categorías: {len(cat_ids)}")
    print(f"  peso: {SALIDA.stat().st_size/1024:.0f} KB")


if __name__ == "__main__":
    main()
