# -*- coding: utf-8 -*-
"""Segundo pase: la categoría REAL de cada producto + talles, recorriendo las
páginas de categoría de la tienda (mucho más confiable que el breadcrumb)."""
import json, re, sys, urllib.request, gzip
from concurrent.futures import ThreadPoolExecutor

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36"}

CATS = {
    "buzos/remeras": "Remeras",
    "buzos/buzos-y-camperas": "Buzos y camperas",
    "buzos/jeans-y-joggings": "Jeans y joggings",
    "buzos/bermudas": "Bermudas",
    "buzos/chombas-y-camisas": "Chombas y camisas",
    "buzos/camisetas-deportivas": "Camisetas deportivas",
    "buzos/gorras": "Gorras",
    "buzos/mallas-y-musculosas": "Mallas y musculosas",
    "zapatillas": "Zapatillas",
}


def get(url, t=30):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=t) as r:
        b = r.read()
        if r.headers.get("Content-Encoding") == "gzip":
            b = gzip.decompress(b)
        return b.decode("utf-8", "replace")


def slugs_de(ruta):
    """Recorre las páginas de una categoría y devuelve los slugs de sus productos."""
    encontrados, pagina = set(), 1
    while pagina <= 12:
        url = f"https://brack.mitiendanube.com/{ruta}/?page={pagina}"
        try:
            html = get(url)
        except Exception:
            break
        slugs = set(re.findall(r"/productos/([a-z0-9\-]+)/", html))
        nuevos = slugs - encontrados
        if not nuevos:
            break
        encontrados |= slugs
        pagina += 1
    return encontrados


def main():
    cat = json.load(open("brack_catalogo.json", encoding="utf-8"))
    por_slug = {p["slug"]: p for p in cat}

    with ThreadPoolExecutor(max_workers=6) as ex:
        res = dict(zip(CATS, ex.map(slugs_de, CATS.keys())))

    for ruta, slugs in res.items():
        nombre = CATS[ruta]
        n = 0
        for s in slugs:
            if s in por_slug:
                # una prenda puede estar en dos categorías; gana la primera que la reclama
                if not por_slug[s].get("categoria_real"):
                    por_slug[s]["categoria_real"] = nombre
                    n += 1
        print(f"  {nombre:24} {len(slugs):4} en la página · {n} asignados")

    sin = [p for p in cat if not p.get("categoria_real")]
    for p in sin:
        p["categoria_real"] = "Otros"
    print(f"\nsin categoría (van a 'Otros'): {len(sin)}")

    json.dump(cat, open("brack_catalogo.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    vend = [p for p in cat if p.get("precio") and p["disponible"]]
    import collections
    print("\nCATÁLOGO VENDIBLE por categoría:")
    for c, n in collections.Counter(p["categoria_real"] for p in vend).most_common():
        print(f"   {n:4}  {c}")


if __name__ == "__main__":
    main()
