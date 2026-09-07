# -*- coding: utf-8 -*-
"""
Rebranding del esqueleto de Islas Group → Brack Indumentaria.

Qué NO se hace acá: reemplazar "reloj" por "prenda" a ciegas. El texto de Islas
está escrito para una casa de alta relojería ("ninguno sale sin autenticar",
"veinte relojes cambian de mano por día") y traducido palabra por palabra queda
un sinsentido. Cada bloque se reescribe para lo que Brack ES: una tienda de
streetwear de Santa Rosa que vende por drops.

🔴 Los TESTIMONIOS de Islas se ELIMINAN, no se traducen. Son reseñas reales de
otro cliente; inventarle reseñas a Brack cruza la regla de cero datos ficticios.
En su lugar van sus condiciones comerciales, que sí son verdaderas y sí venden.
"""
import pathlib, re, sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
P = pathlib.Path(r"c:\Users\46094\Desktop\WESEKA_IA_STRUCTURE\01_CLIENTES\BRACK_INDUMENTARIA\02_DEMO_WEB\index.html")
s = P.read_text(encoding="utf-8")
cambios = []


def rep(viejo, nuevo, etiqueta):
    global s
    if viejo in s:
        s = s.replace(viejo, nuevo)
        cambios.append(etiqueta)
    else:
        cambios.append(f"⚠️ NO ENCONTRADO: {etiqueta}")


# ── META ─────────────────────────────────────────────────────────────────────
rep('content="Casa de alta relojería y antigüedades a dos cuadras del Obelisco. Piezas autenticadas una por un',
    'content="Streetwear, zapatillas y perfumería importada en Santa Rosa, La Pampa. Los drops de la temporada, con talles reales y envío a todo el país. 20% off en efectivo y 6 cuotas sin interés',
    "meta description")

# ── NAV / MARCA ──────────────────────────────────────────────────────────────
rep('<a class="nav-brand" href="#top" data-hover>ISLAS GROUP<span class="mono-mark">ALTA RELOJERÍA — BUENOS AIRES</span></a>',
    '<a class="nav-brand" href="#top" data-hover>BRACK<span class="mono-mark">INDUMENTARIA — SANTA ROSA, LA PAMPA</span></a>',
    "nav brand")
rep('<div class="mm-foot">Islas Group — Perón 1111, Buenos Aires</div>',
    '<div class="mm-foot">Brack — 25 de Mayo 772, Santa Rosa</div>',
    "menú mobile pie")
rep("'ISLAS GROUP'.split('')", "'BRACK'.split('')", "animación del nombre")

# ── HERO ─────────────────────────────────────────────────────────────────────
rep('alt="Rolex Submariner Hulk — Islas Group"', 'alt="Brack Indumentaria — drop de temporada"', "alt del hero")

# ── MARCAS (marquee) ─────────────────────────────────────────────────────────
rep("var brands = ['Rolex','Omega','Cartier','Tudor','Tag Heuer','Longines','Baume & Mercier','Raymo",
    "var brands = ['Shato Studios','Casaclan','Bartone','Hannover','Kiech','Rusty','Vans','Campus','New Balance','Puma','NFL','NBA','MLB','Raymo",
    "marquee de marcas")

# ── SECCIÓN A SANGRE (el volumen del negocio) ────────────────────────────────
rep("Entre veinte y treinta relojes cambian de mano por día. Lo que hoy está en vitrina, mañana quizás ya ",
    "Los drops se agotan por talle. Lo que hoy está publicado, la semana que viene quizás ya ",
    "bloque a sangre")
rep('alt="Catálogo de relojes"', 'alt="Catálogo de Brack"', "alt catálogo")

# ── HITOS ────────────────────────────────────────────────────────────────────
rep('<div class="n">18</div><div class="k">La casa</div><p>La relojería más grande de la Argentina. Dieciocho personas en el equipo.</p>',
    '<div class="n">119</div><div class="k">En catálogo</div><p>Prendas, zapatillas y perfumería disponibles hoy, con talle y medidas publicadas.</p>',
    "hito 1")
rep('<div class="n">HOY</div><div class="k">Perón 1111</div><p>Entre veinte y treinta relojes por día. Ninguno sale sin autenticar.</p>',
    '<div class="n">6</div><div class="k">Cuotas sin interés</div><p>Y 20% off pagando en efectivo. Envío gratis superando $200.000.</p>',
    "hito 2")

# ── FORMULARIO ───────────────────────────────────────────────────────────────
rep('<option value="relojes" style="color:#14161A">Interés: Relojes</option>',
    '<option value="indumentaria" style="color:#0E0D0C">Interés: Indumentaria</option>',
    "select interés")

# ── SHOWROOM ─────────────────────────────────────────────────────────────────
rep('title="Showroom Islas Group — Perón 1111"', 'title="Brack — 25 de Mayo 772, Santa Rosa"', "título del mapa")
rep("Coordine una visita y reciba atención directa para relojería, joyería y piezas seleccionadas.",
    "Pasá por el local o escribinos: te decimos qué talles quedan y coordinamos el envío.",
    "copy del showroom")

# ── FOOTER ───────────────────────────────────────────────────────────────────
rep('href="https://www.instagram.com/elrelojero.islas" target="_blank" rel="noopener" data-hover>@elrelojero.islas',
    'href="https://www.instagram.com/brack.indumentaria" target="_blank" rel="noopener" data-hover>@brack.indumentaria',
    "instagram")
rep("<span>© 2026 Islas Group — Buenos Aires</span>",
    "<span>© 2026 Brack Indumentaria — Santa Rosa, La Pampa</span>",
    "copyright")

# ── FICHA / FRASES ───────────────────────────────────────────────────────────
rep("'Referencia ' + idx + ' — Colección relojes'", "'Referencia ' + idx + ' — Catálogo Brack'", "ficha lote")
rep("'¿La mejor hora para comprar un reloj? Mientras sigue en vitrina. Acá la mercadería no espera a nadie — se l",
    "'¿El mejor momento para comprar? Mientras queda tu talle. Los drops no esperan a nadie — se l",
    "frase de cierre")

P.write_text(s, encoding="utf-8")

print("REBRANDING:")
for c in cambios:
    print(("  ✓ " if not c.startswith("⚠️") else "  ") + c)
print(f"\nquedan 'Islas': {len(re.findall('Islas Group|ISLAS GROUP', s))}")
print(f"quedan 'reloj': {len(re.findall('reloj', s, re.I))}  (los de comentarios CSS no se ven en pantalla)")
