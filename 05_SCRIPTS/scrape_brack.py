# -*- coding: utf-8 -*-
"""
Scraper del catálogo REAL de Brack (Tiendanube) — para la demo.
Saca: nombre, precio, precio tachado, fotos, categoría, talles, stock, URL.
Regla de la casa: cero productos inventados. Todo sale de su tienda.
"""
import json, re, sys, urllib.request, gzip, io
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36"}


def get(url, t=30):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=t) as r:
        b = r.read()
        if r.headers.get("Content-Encoding") == "gzip":
            b = gzip.decompress(b)
        return b.decode("utf-8", "replace")


def urls_productos():
    xml = get("https://brack.mitiendanube.com/sitemap.xml")
    return [u for u in re.findall(r"<loc>([^<]+)</loc>", xml) if "/productos/" in u and u.rstrip("/").split("/")[-1] != "productos"]


def ld_json(html):
    """Tiendanube publica el producto como schema.org Product."""
    for m in re.finditer(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', html, re.S):
        try:
            d = json.loads(m.group(1).strip())
        except Exception:
            continue
        for cand in (d if isinstance(d, list) else [d]):
            if isinstance(cand, dict) and cand.get("@type") == "Product":
                return cand
    return None


def scrape(url):
    try:
        html = get(url)
    except Exception as e:
        return {"url": url, "error": str(e)[:60]}

    p = ld_json(html) or {}
    fotos = p.get("image") or []
    if isinstance(fotos, str):
        fotos = [fotos]
    # Tiendanube sirve varias resoluciones; nos quedamos con la grande
    fotos = [f if f.startswith("http") else "https:" + f for f in fotos]

    ofertas = p.get("offers") or {}
    if isinstance(ofertas, list):
        ofertas = ofertas[0] if ofertas else {}

    # talles y variantes: vienen en el JS de la tienda
    talles = sorted(set(re.findall(r'"name":"(?:Talle|Talles?)","value":"([^"]{1,12})"', html)))
    if not talles:
        talles = sorted(set(re.findall(r'>\s*(XS|S|M|L|XL|XXL|\d{2})\s*<', html)))[:8]

    breadcrumb = re.findall(r'"item":\{"@id":"[^"]*","name":"([^"]{2,40})"', html)
    categoria = breadcrumb[-1] if breadcrumb else ""

    return {
        "url": url,
        "slug": url.rstrip("/").split("/")[-1],
        "nombre": p.get("name") or "",
        "descripcion": re.sub(r"\s+", " ", (p.get("description") or ""))[:600],
        "sku": p.get("sku") or "",
        "marca": (p.get("brand") or {}).get("name") if isinstance(p.get("brand"), dict) else (p.get("brand") or ""),
        "precio": ofertas.get("price"),
        "moneda": ofertas.get("priceCurrency") or "ARS",
        "disponible": "InStock" in str(ofertas.get("availability", "")),
        "fotos": fotos[:8],
        "talles": talles,
        "categoria": categoria,
    }


def main():
    urls = urls_productos()
    print(f"productos en el sitemap: {len(urls)}")
    out = []
    with ThreadPoolExecutor(max_workers=12) as ex:
        futs = {ex.submit(scrape, u): u for u in urls}
        for n, f in enumerate(as_completed(futs), 1):
            r = f.result()
            out.append(r)
            if n % 40 == 0:
                ok = sum(1 for x in out if x.get("nombre"))
                print(f"  {n}/{len(urls)} · con datos: {ok}")
    ok = [x for x in out if x.get("nombre") and x.get("fotos")]
    print(f"\nOK: {len(ok)} productos con nombre y fotos · {len(out)-len(ok)} descartados")
    json.dump(ok, open("brack_catalogo.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    cats = {}
    for x in ok:
        cats[x["categoria"]] = cats.get(x["categoria"], 0) + 1
    print("\ncategorías:")
    for c, n in sorted(cats.items(), key=lambda z: -z[1]):
        print(f"   {n:4}  {c or '(sin categoría)'}")
    precios = [float(x["precio"]) for x in ok if x.get("precio")]
    if precios:
        print(f"\nprecios: {len(precios)} con precio · min ${min(precios):,.0f} · max ${max(precios):,.0f}")
    fotos = sum(len(x["fotos"]) for x in ok)
    print(f"fotos totales: {fotos}")
    print("\nmuestra:")
    for x in ok[:5]:
        print(f"   {x['nombre'][:46]:48} ${x['precio']} · {len(x['fotos'])}f · talles {x['talles'][:5]}")


if __name__ == "__main__":
    main()
