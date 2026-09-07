import Anthropic from "@anthropic-ai/sdk";
import { CONFIG } from "./_config";
import { buildSystem, type ProductoLite } from "./_prompt";

// ── Núcleo del asistente, agnóstico de plataforma ─────────────────────────────
// Lo usan: netlify/functions/asistente.ts (Netlify) y server/index.ts (Render).
// Acá vive TODA la lógica; los envoltorios solo traducen request/response.

const INTENCIONES = ["producto", "service", "mayorista", "otro"] as const;
export type Intencion = (typeof INTENCIONES)[number];

// Structured output: la IA responde SIEMPRE este JSON (Haiku 4.5 soporta structured outputs).
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["respuesta", "productos_ids", "lead_nombre", "lead_contacto", "intencion"],
  properties: {
    respuesta: { type: "string", description: "Lo que le decís al visitante (2-4 oraciones, formal de usted, sin emojis)." },
    productos_ids: {
      type: "array",
      items: { type: "string" },
      description: "IDs de productos del catálogo a recomendar (0 a 3).",
    },
    lead_nombre: { type: "string", description: "Nombre si lo dio, si no cadena vacía." },
    lead_contacto: { type: "string", description: "Teléfono o mail si lo dio, si no cadena vacía." },
    intencion: {
      type: "string",
      enum: INTENCIONES as unknown as string[],
      description: "Tema principal de la conversación: producto | service | mayorista | otro.",
    },
  },
} as const;

// Extrae el primer objeto JSON válido de la respuesta del modelo (tolera fences o texto extra/cortado).
function extractJson(text: string): any {
  if (!text) return null;
  const t = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(t); } catch { /* seguimos intentando */ }
  const i = t.indexOf("{");
  const j = t.lastIndexOf("}");
  if (i >= 0 && j > i) {
    try { return JSON.parse(t.slice(i, j + 1)); } catch { /* nada */ }
  }
  return null;
}

export type ResultadoAsistente = { status: number; data: Record<string, unknown> };

// Chat genérico con system prompt libre (lo usa el copiloto interno del panel).
// La key vive en el servidor; el navegador no la ve.
export async function chatGenerico(body: any): Promise<ResultadoAsistente> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { status: 503, data: { error: "El asistente no está configurado en el servidor (falta ANTHROPIC_API_KEY)." } };

  const system = String(body?.system ?? "").slice(0, 12000);
  const raw = Array.isArray(body?.messages) ? body.messages.slice(-16) : [];
  const messages = raw
    .map((m: any) => ({
      role: (m?.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
      content: String(m?.content ?? "").slice(0, 4000),
    }))
    .filter((m: any) => m.content);
  if (!messages.length) return { status: 400, data: { error: "Sin mensajes." } };

  const client = new Anthropic({ apiKey });
  try {
    const resp = await client.messages.create({ model: "claude-haiku-4-5", max_tokens: 700, system, messages });
    const text = (resp.content.find((b: any) => b.type === "text") as any)?.text ?? "";
    return { status: 200, data: { text } };
  } catch (e: any) {
    return { status: 502, data: { error: String(e?.message ?? e) } };
  }
}

export async function atenderAsistente(body: any): Promise<ResultadoAsistente> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { status: 503, data: { error: "El asistente no está configurado (falta ANTHROPIC_API_KEY)." } };

  const mensaje = String(body?.mensaje ?? "").trim().slice(0, 2000);
  if (!mensaje) return { status: 400, data: { error: "Mensaje vacío." } };

  const historial = Array.isArray(body?.historial) ? body.historial.slice(-12) : [];
  const catalogo: ProductoLite[] = Array.isArray(body?.catalogo) ? body.catalogo.slice(0, 60) : [];

  const messages = [
    ...historial
      .map((m: any) => ({
        role: (m?.rol === "asistente" ? "assistant" : "user") as "assistant" | "user",
        content: String(m?.texto ?? "").slice(0, 2000),
      }))
      .filter((m: any) => m.content),
    { role: "user" as const, content: mensaje },
  ];

  const client = new Anthropic({ apiKey });

  try {
    const resp = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: buildSystem(CONFIG, catalogo),
      messages,
      // structured outputs (cuando aplica) + el formato JSON también va explícito en el prompt
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
    } as any);

    const text = (resp.content.find((b: any) => b.type === "text") as any)?.text ?? "";
    const data = extractJson(text) ?? {};

    const respuesta =
      String(data?.respuesta ?? "").trim() ||
      "Disculpe, no le entendí bien. ¿Me lo repite? Puedo informarle precios, cuotas y stock, o consultar si reparamos su equipo.";
    const productosIds = Array.isArray(data?.productos_ids) ? data.productos_ids.map(String).slice(0, 3) : [];
    const contacto = String(data?.lead_contacto ?? "").trim();
    const lead = contacto ? { nombre: String(data?.lead_nombre ?? "").trim(), contacto } : null;
    const intencion: Intencion = INTENCIONES.includes(data?.intencion) ? data.intencion : "otro";

    return { status: 200, data: { respuesta, productosIds, lead, intencion } };
  } catch (e: any) {
    return { status: 502, data: { error: "El asistente no está disponible en este momento.", detail: String(e?.message ?? e) } };
  }
}
