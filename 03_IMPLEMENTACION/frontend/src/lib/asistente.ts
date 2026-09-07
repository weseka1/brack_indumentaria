// Cliente fino de las DOS capas de IA:
//  · consultarAsistente → Camila, el asistente de la web pública
//  · chatCopiloto       → el copiloto interno del panel (system libre)
// Ambos hablan con un backend (la ANTHROPIC_API_KEY vive SOLO ahí, nunca acá):
//  · Render/local:      server/index.ts sirve /api/asistente y /api/chat
//  · Netlify:           /api/* redirige a netlify/functions
//  · Deploy estático (wsk.com.ar/demos/brack): VITE_ASISTENTE_URL / VITE_CHAT_URL
//    apuntan a la edge function de Supabase (03_IMPLEMENTACION/edge-function-brack).

export type ChatMsg = { rol: "cliente" | "asistente"; texto: string };

// Ítem liviano del catálogo que viaja a la function (espejo de netlify/functions/_prompt.ts).
export type ProductoLite = {
  id: string;
  nombre: string;
  marca: string;
  categoria: string;
  condicion: string;   // "nuevo" | "usado reacondicionado"
  precio: string;      // formateado ARS, ej. "$450.000"
  cuotas: number;
  valorCuota: string;  // formateado ARS, ej. "$75.000"
  stock: number;
};

export type IntencionAsistente = "producto" | "service" | "mayorista" | "otro";

export type RespuestaAsistente = {
  respuesta: string;
  productosIds: string[];
  lead: { nombre: string; contacto: string } | null;
  intencion: IntencionAsistente;
};

// WhatsApp al que deriva el asistente: Brack Indumentaria (Marcos).
// Solo dígitos, formato internacional: +54 9 291 436-4529 → 5492914364529.
export const WHATSAPP = "5492914364529";

export function linkWhatsApp(texto: string): string {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

// Endpoints con fallback de despliegue: si el build trae VITE_ASISTENTE_URL /
// VITE_CHAT_URL (edge function de Supabase) se usan esas; si no, /api/* (Render/Netlify).
const env = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env) || {};
const ASISTENTE_URL = env.VITE_ASISTENTE_URL || "/api/asistente";
const CHAT_URL = env.VITE_CHAT_URL || "/api/chat";

export async function consultarAsistente(
  mensaje: string,
  historial: ChatMsg[],
  catalogo: ProductoLite[]
): Promise<RespuestaAsistente> {
  const r = await fetch(ASISTENTE_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    // "accion" permite que la edge function única atienda las dos rutas.
    body: JSON.stringify({ accion: "asistente", mensaje, historial, catalogo }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || "El asistente no está disponible.");
  const intenciones: IntencionAsistente[] = ["producto", "service", "mayorista", "otro"];
  return {
    respuesta: String(data.respuesta || ""),
    productosIds: Array.isArray(data.productosIds) ? data.productosIds.map(String) : [],
    lead: data.lead && data.lead.contacto ? data.lead : null,
    intencion: intenciones.includes(data.intencion) ? data.intencion : "otro",
  };
}

// Chat genérico con system libre — lo usa el copiloto del panel.
export async function chatCopiloto(
  system: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const r = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ accion: "chat", system, messages }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const m: string = data?.error || "";
    if (r.status === 503 || /no está configurado|ANTHROPIC_API_KEY/i.test(m)) {
      throw new Error("SIN_BACKEND");
    }
    if (/credit balance/i.test(m)) {
      throw new Error("La cuenta de Anthropic no tiene créditos. Cargá saldo en console.anthropic.com.");
    }
    throw new Error(m || "No se pudo conectar con el copiloto.");
  }
  return String(data?.text || "");
}
