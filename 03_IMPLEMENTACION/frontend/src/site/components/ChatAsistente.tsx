import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X, Send, Loader2, Check, MessageCircle } from "lucide-react";
import { useData } from "@/lib/DataProvider";
import { hoyISO } from "@/lib/fechas";
import { fmtARS } from "@/lib/format";
import {
  consultarAsistente,
  linkWhatsApp,
  type ChatMsg,
  type ProductoLite,
  type IntencionAsistente,
} from "@/lib/asistente";
import type { Lead, Producto } from "@/data/types";
import { valorCuota } from "@/data/types";
import type { Conversacion, MensajeConv } from "@/data/conversaciones";

// Saludo aprobado en 00_BRIEF/ESTRATEGIA_COPY_ADER.md (espejo de netlify/functions/_config.ts).
const SALUDO =
  "Hola, soy Camila, la asistente virtual de Brack Indumentaria. Puedo informarle precios, cuotas y stock, o consultar si reparamos su equipo. ¿En qué lo puedo ayudar?";

// 4 preguntas sugeridas del copy doc.
const CHIPS = [
  "¿Qué precio y cuotas tiene una heladera?",
  "¿Reparan mi modelo de lavarropas?",
  "¿Tienen stock para entrega inmediata?",
  "Quiero comprar como revendedor",
];

type Burbuja = { rol: "cliente" | "asistente"; texto: string; productos?: Producto[] };

// Ícono propio de Camila: globo de conversación con copo (frío), trazo fino.
function IconoCamila({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3.6c-4.6 0-8.3 3.1-8.3 7 0 2.2 1.2 4.2 3.1 5.5-.1 1-.5 2-1.3 3 1.6-.2 2.9-.8 3.9-1.4.8.2 1.7.3 2.6.3 4.6 0 8.3-3.1 8.3-7s-3.7-7.4-8.3-7.4Z" />
      <path d="M12 7.1v7" />
      <path d="M9 8.85l6 3.5" />
      <path d="M15 8.85l-6 3.5" />
    </svg>
  );
}

// Placa tipográfica para productos sin foto (regla: nada de fotos falsas).
function MiniFoto({ p }: { p: Producto }) {
  if (p.fotos?.[0]) {
    return (
      <img
        src={p.fotos[0]}
        alt=""
        loading="lazy"
        className="h-12 w-14 shrink-0 rounded-lg bg-paper-200 object-contain p-1"
        onError={(e) => (e.currentTarget.style.visibility = "hidden")}
      />
    );
  }
  return (
    <span className="grid h-12 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-paper-200 px-1 text-center text-[9px] font-semibold uppercase leading-tight tracking-wide text-graph-500">
      {p.marca}
    </span>
  );
}

let msgSeq = 0;
const nuevoMsg = (de: MensajeConv["de"], texto: string): MensajeConv => ({
  id: "MSG-W" + Date.now().toString(36) + (++msgSeq),
  de,
  texto,
  horaISO: new Date().toISOString(),
});

export default function ChatAsistente() {
  const { productos, addLead, addConversacion, updateConversacion, agregarMensaje } = useData();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Burbuja[]>([{ rol: "asistente", texto: SALUDO }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [leadEnviado, setLeadEnviado] = useState(false);
  const [leadNombre, setLeadNombre] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  // La conversación reflejada en la bandeja del panel (canal "web").
  const convIdRef = useRef<string | null>(null);

  // Mensaje pre-armado para WhatsApp, con el contexto de la charla. Registro formal.
  const waTexto = () => {
    const ultimoUser = [...msgs].reverse().find((m) => m.rol === "cliente")?.texto || "";
    const recom = [...new Set(msgs.flatMap((m) => m.productos || []).map((p) => p.nombre))].slice(0, 3);
    const partes = ["Hola, escribo desde la web de Brack Indumentaria."];
    if (leadNombre) partes.push(`Mi nombre es ${leadNombre}.`);
    if (ultimoUser) partes.push(`Consultaba por: ${ultimoUser}`);
    if (recom.length) partes.push(`Me interesó: ${recom.join(", ")}.`);
    return partes.join(" ");
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy, open]);

  // Cualquier sección de la web puede abrir a Camila (con consulta opcional ya escrita):
  // window.dispatchEvent(new CustomEvent("camila:abrir", { detail: { mensaje } }))
  const enviarRef = useRef<(t?: string) => void>(() => {});
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onAbrir = (e: Event) => {
      const detalle = (e as CustomEvent).detail as { mensaje?: string } | undefined;
      setOpen(true);
      const mensaje = detalle?.mensaje?.trim();
      if (mensaje) enviarRef.current(mensaje);
      else setTimeout(() => inputRef.current?.focus(), 250);
    };
    window.addEventListener("camila:abrir", onAbrir);
    return () => window.removeEventListener("camila:abrir", onAbrir);
  }, []);

  // Catálogo liviano que viaja a la function: SOLO productos publicados, precios ya formateados.
  const catalogo = (): ProductoLite[] =>
    productos
      .filter((p) => p.publicado)
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        marca: p.marca,
        categoria: p.categoria,
        condicion: p.condicion === "usado" ? "usado reacondicionado" : "nuevo",
        precio: fmtARS(p.precio),
        cuotas: p.cuotas,
        valorCuota: fmtARS(valorCuota(p)),
        stock: p.stock,
      }));

  // Refleja cada mensaje en la bandeja del panel (la conversación nace con el primer mensaje).
  const volcarEnBandeja = (de: MensajeConv["de"], texto: string) => {
    if (!convIdRef.current) {
      const id = "CONV-WEB-" + Date.now().toString(36);
      convIdRef.current = id;
      const conv: Conversacion = {
        id,
        canal: "web",
        nombre: "Visitante web",
        contacto: "",
        estado: "ia",
        noLeida: true,
        mensajes: [nuevoMsg("ia", SALUDO), nuevoMsg(de, texto)],
      };
      addConversacion(conv);
    } else {
      agregarMensaje(convIdRef.current, nuevoMsg(de, texto));
    }
  };

  const enviar = async (textoDirecto?: string) => {
    const texto = (textoDirecto ?? input).trim();
    if (!texto || busy) return;
    const historial: ChatMsg[] = msgs.map((m) => ({ rol: m.rol, texto: m.texto }));
    setMsgs((m) => [...m, { rol: "cliente", texto }]);
    setInput("");
    setBusy(true);
    volcarEnBandeja("cliente", texto);
    try {
      const r = await consultarAsistente(texto, historial, catalogo());
      const recomendados = r.productosIds
        .map((id) => productos.find((p) => p.id === id))
        .filter((p): p is Producto => Boolean(p));
      setMsgs((m) => [...m, { rol: "asistente", texto: r.respuesta, productos: recomendados.length ? recomendados : undefined }]);
      volcarEnBandeja("ia", r.respuesta);

      if (r.lead && !leadEnviado) {
        registrarLead(r.lead, r.intencion, recomendados[0]?.id ?? null);
      }
    } catch {
      const aviso =
        "Disculpe, el asistente no está disponible en este momento. Puede escribirnos por WhatsApp al +54 9 291 436-4529 y lo atendemos a la brevedad.";
      setMsgs((m) => [...m, { rol: "asistente", texto: aviso }]);
    } finally {
      setBusy(false);
    }
  };
  enviarRef.current = enviar;

  // Lead → panel (consultas) con la conversación referenciada.
  const registrarLead = (
    datos: { nombre: string; contacto: string },
    intencion: IntencionAsistente,
    productoId: string | null
  ) => {
    const lead: Lead = {
      id: "WEB-" + Date.now().toString(36),
      fechaISO: hoyISO(),
      nombre: datos.nombre || "Consulta web",
      contacto: datos.contacto,
      productoId,
      interes: intencion === "service" ? "service" : intencion === "mayorista" ? "mayorista" : "producto",
      canal: "web",
      estado: "nueva",
      asignado: "Sin asignar",
      notas:
        "La cargó Camila (asistente web)." +
        (convIdRef.current ? ` Conversación ${convIdRef.current} en la bandeja.` : ""),
    };
    addLead(lead);
    // La conversación de la bandeja deja de ser anónima: nombre, contacto y lead vinculado.
    if (convIdRef.current) {
      updateConversacion(convIdRef.current, {
        ...(datos.nombre ? { nombre: datos.nombre } : {}),
        ...(datos.contacto ? { contacto: datos.contacto } : {}),
        leadId: lead.id,
        ...(productoId ? { productoId } : {}),
      });
    }
    setLeadEnviado(true);
    if (datos.nombre) setLeadNombre(datos.nombre);
  };

  const hayCharla = msgs.some((m) => m.rol === "cliente");

  return (
    <>
      {/* burbuja flotante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir el chat de Camila, asistente virtual"
          className="group fixed bottom-5 right-5 z-[60] flex h-14 items-center overflow-hidden rounded-full bg-brand pl-4 pr-4 text-white shadow-[0_14px_34px_-10px_rgba(223,10,10,0.55)] transition-[padding,box-shadow,background-color] duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-brand-600 hover:pr-5 hover:shadow-[0_18px_42px_-10px_rgba(223,10,10,0.65)]"
        >
          <IconoCamila size={24} className="relative shrink-0" />
          <span className="relative ml-0 max-w-0 whitespace-nowrap text-sm font-semibold opacity-0 transition-[max-width,margin,opacity] duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:ml-2.5 group-hover:max-w-[13rem] group-hover:opacity-100">
            Consultar con Camila
          </span>
          {/* presencia: en línea, sin animaciones estridentes */}
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-sea transition-opacity duration-300 group-hover:opacity-0" />
        </button>
      )}

      {/* panel del chat */}
      {open && (
        <div className="fixed bottom-4 left-4 right-4 z-[60] flex h-[min(78dvh,600px)] max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border border-graph/10 bg-paper-100 shadow-[0_28px_70px_-24px_rgba(22,22,26,0.35)] sm:left-auto sm:w-[min(92vw,390px)]">
          {/* header glass claro */}
          <div className="flex items-center justify-between gap-3 border-b border-graph/10 bg-paper-100/85 px-4 py-3 backdrop-blur-xl">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white">
                <IconoCamila size={20} />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold text-graph">Camila · Brack Indumentaria</p>
                <p className="flex items-center gap-1.5 text-[11px] text-graph-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-sea" /> Asistente virtual
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar el chat"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-graph-400 transition hover:bg-graph/[0.06] hover:text-graph"
            >
              <X size={18} />
            </button>
          </div>

          {/* mensajes */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-paper px-3 py-4">
            {msgs.map((m, i) => (
              <div key={i} className={m.rol === "cliente" ? "flex justify-end" : "flex justify-start"}>
                <div className="max-w-[85%]">
                  <div
                    className={
                      m.rol === "cliente"
                        ? "rounded-2xl rounded-br-sm bg-brand px-3.5 py-2 text-sm leading-relaxed text-white"
                        : "rounded-2xl rounded-bl-sm bg-paper-100 px-3.5 py-2 text-sm leading-relaxed text-graph shadow-sm ring-1 ring-graph/10"
                    }
                  >
                    {m.texto}
                  </div>
                  {m.productos && (
                    <div className="mt-2 space-y-2">
                      {m.productos.map((p) => (
                        <Link
                          key={p.id}
                          to={`/producto/${p.id}`}
                          onClick={() => setOpen(false)}
                          className="flex min-h-[44px] items-center gap-3 rounded-xl border border-graph/10 bg-paper-100 p-2 transition hover:border-brand/40 hover:shadow-sm"
                        >
                          <MiniFoto p={p} />
                          <div className="min-w-0 leading-tight">
                            <p className="truncate text-[13px] font-semibold text-graph">{p.nombre}</p>
                            <p className="text-[12px] font-semibold text-graph">
                              {fmtARS(p.precio)}
                              {p.condicion === "usado" && (
                                <span className="ml-1.5 font-medium text-graph-400">Reacondicionado</span>
                              )}
                            </p>
                            <p className="truncate text-[11px] font-medium text-brand">
                              {p.cuotas} cuotas sin interés de {fmtARS(valorCuota(p))}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* 4 preguntas sugeridas (solo al inicio) */}
            {!hayCharla && !busy && (
              <div className="grid gap-1.5 pt-1">
                {CHIPS.map((c) => (
                  <button
                    key={c}
                    onClick={() => enviar(c)}
                    className="flex min-h-[44px] items-center rounded-xl border border-graph/10 bg-paper-100 px-3.5 py-2 text-left text-[13px] font-medium text-graph transition hover:border-brand/40 hover:text-brand"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {busy && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-paper-100 px-3.5 py-2.5 text-sm text-graph-400 shadow-sm ring-1 ring-graph/10">
                  <Loader2 size={15} className="animate-spin text-brand" /> Escribiendo…
                </div>
              </div>
            )}

            {leadEnviado && (
              <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[11px] text-graph-400">
                <Check size={13} className="text-sea" /> Sus datos quedaron registrados. Lo contactamos a la brevedad.
              </p>
            )}
          </div>

          {/* CTA WhatsApp: seguir la charla con Marcos (aparece apenas arranca la conversación) */}
          {hayCharla && (
            <a
              href={linkWhatsApp(waTexto())}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-3 mb-1.5 flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-2 text-sm font-semibold text-white transition hover:brightness-95"
            >
              <MessageCircle size={16} /> Seguir por WhatsApp
            </a>
          )}

          {/* input */}
          <div className="flex items-center gap-2 border-t border-graph/10 bg-paper-100 px-3 py-2.5">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") enviar();
              }}
              aria-label="Escriba su consulta"
              placeholder="Escriba su consulta…"
              className="h-11 min-w-0 flex-1 rounded-xl border border-graph/15 bg-paper-100 px-3 text-sm text-graph outline-none transition placeholder:text-graph-400 focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
            />
            <button
              onClick={() => enviar()}
              disabled={busy || !input.trim()}
              aria-label="Enviar"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand text-white transition hover:bg-brand-600 disabled:opacity-40"
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
