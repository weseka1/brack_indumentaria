# Estándar iOS — WeSeka

> Referencia de sistema. Va en `CLAUDE.md` del repo o en `Estandares-Empresa.md`
> del vault. Se lee antes de tomar cualquier decisión visual.
> Pedido explícito de Juani: "basate mucho en iOS".

---

## 1. El principio que más se equivoca

**En modo oscuro, la elevación aclara. No oscurece.**

En modo claro, un elemento que "flota" se separa con una sombra. En modo oscuro
iOS no usa sombras para eso: **la superficie elevada es más clara que el fondo.**
Un modal está más arriba que la página, entonces es más claro. Una card está más
arriba que la sección, entonces es más clara.

Si en modo oscuro estás usando sombras para separar capas, estás haciendo modo
claro con los colores invertidos, que no es lo mismo.

---

## 2. Modo oscuro: los grises reales

iOS **no usa negro puro** para superficies (salvo OLED específico). Usa una escala
de grises muy oscuros y neutros:

| Rol | Valor | Uso |
|---|---|---|
| Fondo base | `#1C1C1E` | El fondo de la página |
| Elevación 1 | `#2C2C2E` | Secciones, paneles apoyados |
| Elevación 2 | `#3A3A3C` | Cards dentro de paneles, modales |
| Elevación 3 | `#48484A` | Elementos flotantes sobre modales |
| Separador | `#38383A` | Líneas divisorias |

Grises de texto en oscuro:

| Rol | Valor |
|---|---|
| Primario | `#FFFFFF` |
| Secundario | `rgba(235,235,245,0.60)` |
| Terciario | `rgba(235,235,245,0.30)` |
| Cuaternario | `rgba(235,235,245,0.18)` |

Notar que el texto secundario **no es gris**: es blanco azulado con alpha. Eso
mantiene el tinte del fondo detrás y es lo que evita el look "gris sucio".

**Nada de textura de grano.** iOS no tiene ruido en sus superficies. Si hay un
overlay de grano animado, se saca.

---

## 3. Materiales (el "liquid glass")

iOS define cinco espesores de material. En CSS se aproximan así:

| Material | blur | saturate | Fondo (oscuro) |
|---|---|---|---|
| ultraThin | 20px | 180% | `rgba(28,28,30,0.55)` |
| thin | 30px | 180% | `rgba(28,28,30,0.70)` |
| regular | 40px | 180% | `rgba(28,28,30,0.82)` |
| thick | 50px | 180% | `rgba(28,28,30,0.92)` |
| chrome | 30px | 200% | `rgba(44,44,46,0.90)` |

Reglas de material:

- **Siempre `saturate`.** El blur promedia los colores y los apaga; la saturación
  devuelve el color que ese promedio se comió. Sin saturate, el vidrio se ve gris.
- **Canto de luz superior.** Un borde de 1px, más claro arriba que abajo, que
  simula la luz cayendo sobre el filo del vidrio. No es un `border` parejo en los
  cuatro lados: es un gradiente.
- **El material va sobre contenido, no sobre vacío.** Un vidrio que difumina un
  fondo liso no se lee como vidrio. Si detrás no hay nada, usá un color sólido.

---

## 4. Radios

iOS usa **curva continua** (squircle), no arco circular. CSS todavía no lo soporta
bien de forma nativa, así que se aproxima con radios generosos.

Jerarquía obligatoria: **el radio interior siempre menor que el exterior.**

| Elemento | Radio |
|---|---|
| Panel de sección | 28px |
| Card dentro de panel | 20-22px |
| Imagen dentro de card | 14-16px |
| Botón / píldora | 999px (completo) |
| Chip / etiqueta | 999px |

---

## 5. Movimiento: resortes, no curvas de ease

iOS anima con **física de resorte**, no con `ease-in-out`. Es la diferencia más
audible entre algo que "se siente iOS" y algo que no.

Aproximaciones en CSS:

```css
/* Transición estándar de iOS */
--ios-spring: cubic-bezier(0.32, 0.72, 0, 1);
--ios-duration: 400ms;

/* Entrada rápida, salida suave (presentación de modales) */
--ios-emphasized: cubic-bezier(0.22, 1, 0.36, 1);
--ios-duration-long: 600ms;
```

Reglas de movimiento:

- Nada instantáneo, nada lento. El rango útil es 250–600ms.
- El elemento que sale se va más rápido que el que entra.
- `prefers-reduced-motion` siempre respetado: cambio de estado directo.

---

## 6. Foco y selección: el patrón correcto

**iOS no marca la selección con un glow de color.** Eso es lenguaje de gaming o
de neón, no de iOS.

Lo que hace iOS (patrón del selector de apps, de tvOS, de Fotos):

1. **El elemento activo escala** ligeramente hacia arriba: `scale(1.04)` a `1.08`.
   Nunca más — pasado eso se siente caricaturesco.
2. **El resto se desenfoca y se atenúa**: `blur(4px)` a `8px`, más
   `brightness(0.7)`. El desenfoque es lo que produce la profundidad.
3. **Reflejo especular** en el elemento activo: un gradiente lineal muy sutil
   sobre el borde superior, como si una luz lo tocara.
4. La transición usa el resorte, no una curva lineal.

El resultado buscado: el elemento activo **se acerca**, el resto **se aleja**.
Es profundidad, no iluminación.

---

## 7. Tipografía

iOS usa SF Pro. Si el proyecto tiene otra tipografía por identidad de marca, se
respeta la marca — pero se copia el **comportamiento** de la escala de iOS:

- Titulares con tracking **negativo** (`-0.02em` a `-0.03em`). El tracking amplio
  es de otro registro.
- Los labels chicos en mayúscula sí llevan tracking positivo amplio.
- Pesos: iOS alterna regular y semibold. Rara vez usa pesos intermedios.

---

## 8. Checklist antes de dar algo por terminado

- [ ] En modo oscuro, ¿las capas superiores son más claras que las inferiores?
- [ ] ¿El fondo es gris oscuro (`#1C1C1E`) y no negro puro?
- [ ] ¿Hay algún overlay de grano o ruido? Sacarlo.
- [ ] ¿Todos los `backdrop-filter` tienen `saturate`?
- [ ] ¿Los radios están anidados de mayor a menor?
- [ ] ¿Las transiciones usan la curva de resorte y duran entre 250 y 600ms?
- [ ] ¿La selección usa escala + desenfoque del resto, y no un glow de color?
- [ ] ¿`prefers-reduced-motion` está contemplado?
- [ ] ¿El contraste de todo el texto supera 4.5:1 en ambos temas?
