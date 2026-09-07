# -*- coding: utf-8 -*-
"""
El hero y la navegación: lo último que quedaba hablando de relojería.

El molde decía "El tiempo bien elegido, a dos cuadras del Obelisco" — el
argumento de una casa de relojes de Buenos Aires. Brack vende streetwear en
Santa Rosa y su fuerte es otro: los drops se agotan por talle. Ese es el
gancho, y es verdad.
"""
import json, pathlib, re, shutil, sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
BASE = pathlib.Path(r"c:\Users\46094\Desktop\WESEKA_IA_STRUCTURE\01_CLIENTES\BRACK_INDUMENTARIA\02_DEMO_WEB")
P = BASE / "index.html"
s = P.read_text(encoding="utf-8")
hechos, faltan = [], []


def rep(viejo, nuevo, etq):
    global s
    if viejo in s:
        s = s.replace(viejo, nuevo)
        hechos.append(etq)
    else:
        faltan.append(etq)


# ── HERO ─────────────────────────────────────────────────────────────────────
rep("El tiempo bien elegido,", "Lo que hay,", "hero línea 1")
rep("a dos cuadras del", "mientras", "hero línea 2")
rep("Obelisco.", "queda tu talle.", "hero línea 3")
rep("Piezas seleccionadas y autenticadas una por una. Documentación completa, garantía escrita y atención privada.",
    "Los drops salen por tanda y no se repiten. Todas las medidas publicadas talle por talle, 20% off en efectivo y envío gratis superando $200.000.",
    "hero bajada")
rep("DESCUBRIR LAS PIEZAS", "VER EL CATÁLOGO", "hero CTA")
rep("Descubrir las piezas", "Ver el catálogo", "hero CTA (minúsculas)")

# ── NAV ──────────────────────────────────────────────────────────────────────
rep("PIEZAS ESTRELLA", "LO QUE SALE", "nav 1")
rep("Piezas estrella", "Lo que sale", "nav 1b")
rep("LA COLECCIÓN", "EL CATÁLOGO", "nav 2")
rep("La colección", "El catálogo", "nav 2b")
rep("LA CASA", "LA MARCA", "nav 3")
rep("La casa", "La marca", "nav 3b")
rep("SHOWROOM", "EL LOCAL", "nav 4")
rep("Showroom", "El local", "nav 4b")
rep("VISITA PRIVADA", "ESCRIBINOS", "cta nav")
rep("Visita privada", "Escribinos", "cta nav b")
rep("REGISTRARSE", "MI CUENTA", "registrarse")
rep("DESCIENDA", "BAJÁ", "hint scroll")
rep("Descienda", "Bajá", "hint scroll b")
rep("DESLICE", "DESLIZÁ", "hint deslizar")
rep("Deslice", "Deslizá", "hint deslizar b")

# ── el relojito del hero: en una tienda de ropa no pinta nada ────────────────
s = re.sub(r'<div class="hero-reloj".*?</div>\s*(?=<)', "", s, flags=re.S, count=1)
hechos.append("reloj analógico del hero (fuera)")
rep("BUENOS AIRES — GMT-", "SANTA ROSA — LA PAMPA", "huso horario")

# ── el hero necesita una imagen: va una foto real de su catálogo ─────────────
cat = json.loads((BASE / "data" / "catalogo.js").read_text(encoding="utf-8")
                 .split("window.CATALOGO = ", 1)[1].rsplit(";", 1)[0])
# una prenda con foto grande y buena: la primera destacada con 3+ fotos
elegida = next((p for p in cat if p.get("featured") and len(p["photos"]) >= 3), cat[0])
origen = BASE / "fotos" / elegida["photos"][0]
destino = BASE / "fotos" / "hero_poster.webp"
if origen.exists():
    shutil.copy(origen, destino)
    hechos.append(f"hero_poster ← {elegida['model'][:38]}")

P.write_text(s, encoding="utf-8")

print("HERO Y NAVEGACIÓN:")
for h in hechos:
    print("  ✓", h)
if faltan:
    print("\n  no encontrados (puede que ya estuvieran):")
    for f in faltan:
        print("   ·", f)
print(f"\nquedan 'Obelisco/Buenos Aires/reloj' visibles: "
      f"{len(re.findall('Obelisco|Buenos Aires', s))}")
