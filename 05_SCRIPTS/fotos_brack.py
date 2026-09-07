# -*- coding: utf-8 -*-
"""
Baja las fotos REALES de Brack y las deja listas para la demo cine.

Por qué locales y no hotlink: la demo de Islas sirve sus fotos del propio disco
en .webp — carga instantánea y no depende de que Tiendanube siga sirviendo. Acá
se hace igual.

Salida:
  fotos/<slug>-<n>.webp        catálogo (ancho 1000, calidad 82)
  fotos/stars/<slug>-star.png  las piezas estrella, CON EL FONDO RECORTADO
                               (rembg) para que floten como los relojes de Islas
"""
import io, json, pathlib, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from PIL import Image

DEST = pathlib.Path(r"c:\Users\46094\Desktop\WESEKA_IA_STRUCTURE\01_CLIENTES\BRACK_INDUMENTARIA\02_DEMO_WEB\fotos")
CAT = pathlib.Path("brack_catalogo.json")
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/150 Safari/537.36"}


def baja(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read()


def procesar(args):
    slug, n, url = args
    salida = DEST / f"{slug}-{n}.webp"
    if salida.exists():
        return ("cache", slug)
    try:
        im = Image.open(io.BytesIO(baja(url))).convert("RGB")
        if im.width > 1000:
            im = im.resize((1000, round(im.height * 1000 / im.width)), Image.LANCZOS)
        im.save(salida, "WEBP", quality=82, method=5)
        return ("ok", slug)
    except Exception as e:
        return ("err", f"{slug}: {str(e)[:40]}")


def main():
    cat = json.load(open(CAT, encoding="utf-8"))
    vend = [p for p in cat if p.get("precio") and p.get("disponible") and p.get("fotos")]
    vend.sort(key=lambda p: -float(p["precio"]))
    DEST.mkdir(parents=True, exist_ok=True)
    (DEST / "stars").mkdir(exist_ok=True)

    trabajos = []
    for p in vend:
        for n, u in enumerate(p["fotos"][:6]):
            trabajos.append((p["slug"], n, u))
    print(f"fotos a bajar: {len(trabajos)}")

    ok = err = cache = 0
    with ThreadPoolExecutor(max_workers=10) as ex:
        for i, (estado, dato) in enumerate(ex.map(procesar, trabajos), 1):
            if estado == "ok":
                ok += 1
            elif estado == "cache":
                cache += 1
            else:
                err += 1
                if err <= 5:
                    print("   ERR", dato)
            if i % 60 == 0:
                print(f"   {i}/{len(trabajos)} · ok {ok}")
    print(f"\nbajadas: {ok} · ya estaban: {cache} · errores: {err}")
    peso = sum(f.stat().st_size for f in DEST.glob("*.webp")) / 1e6
    print(f"peso total: {peso:.1f} MB en {len(list(DEST.glob('*.webp')))} archivos")


if __name__ == "__main__":
    main()
