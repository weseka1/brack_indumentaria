// ── Config del cliente (el "molde" replicable) ────────────────────────────────
// Para clonar el asistente a otro cliente: copiá este archivo y cambiá estos valores.
// El resto del código (prompt + function + widget) es genérico y no se toca.

export type AsistenteConfig = {
  negocio: string;        // nombre comercial
  rubro: string;          // qué hace, en una frase
  zona: string;           // zona de trabajo
  desde?: string;         // año de fundación (opcional)
  asistente: string;      // nombre de la asesora virtual
  itemSingular: string;   // "producto" | "campo" | "auto" | "turno"…
  itemPlural: string;     // "productos" | "campos"…
  saludo: string;         // primer mensaje que ve el visitante
  whatsapp: string;       // WhatsApp al que deriva (formato legible)
  contexto?: string;      // identidad del negocio con SU vocabulario (horarios, dirección, condiciones)
};

export const CONFIG: AsistenteConfig = {
  negocio: "Brack Indumentaria",
  rubro:
    "casa de electrodomésticos de Bahía Blanca con taller de service propio: venta de equipos nuevos y usados reacondicionados (heladeras, freezers, lavarropas, secarropas, cocinas, aires, microondas) y reparación de heladeras y lavarropas desde hace más de 30 años",
  zona: "Bahía Blanca",
  asistente: "Camila",
  itemSingular: "producto",
  itemPlural: "productos",
  saludo:
    "Hola, soy Camila, la asistente virtual de Brack Indumentaria. Puedo informarle precios, cuotas y stock, o consultar si reparamos su equipo. ¿En qué lo puedo ayudar?",
  whatsapp: "+54 9 291 436-4529",
  // Hechos reales del negocio (no inventar otros): dirección, condiciones y canales.
  contexto:
    "Local y taller en Santa Fe 85, Bahía Blanca. WhatsApp: +54 9 291 436-4529. Mail: adermarcosrefrigeracion@gmail.com. Instagram: @brack_refrigeracion_marcos. Referente: Marcos, dueño. " +
    "Condiciones de venta: 6 cuotas sin interés, 10% de descuento pagando en efectivo, envío e instalación sin cargo en Bahía Blanca, garantía de 6 meses por escrito (también en los usados reacondicionados, que se revisan y prueban en el taller antes de publicarse). " +
    "Service técnico: más de 30 años reparando heladeras y lavarropas; se reparan equipos de cualquier marca y antigüedad (heladeras, lavarropas, freezers y aires). El diagnóstico se confirma antes de hacer cualquier trabajo. " +
    "Canal mayorista: revendedores con usuario propio en el portal, lista de precios propia por revendedor y compra mínima; las condiciones puntuales las define Marcos.",
};
