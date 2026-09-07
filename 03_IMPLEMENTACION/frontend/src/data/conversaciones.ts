// ===== Bandeja de conversaciones =====
// Todo lo que entra por cualquier canal cae acá: lo que escribe la persona, lo que
// contesta la IA sola, y lo que responde el humano cuando toma la conversación.
//
// Regla de honestidad: el panel NO puede saber si un mensaje salió por WhatsApp
// (es una app afuera). Por eso un mensaje del humano nace "abierto" —abrimos el
// canal con el texto listo— y solo pasa a "enviado" cuando la persona lo confirma.
// El único canal que el sistema sí controla es el chat de la web propia.

export type CanalConv = "whatsapp" | "instagram" | "messenger" | "web" | "mail" | "telefono";

/** Quién escribió el mensaje. */
export type AutorMensaje = "cliente" | "ia" | "humano";

/** Estado de un mensaje escrito por el humano desde el panel. */
export type EstadoEnvio = "abierto" | "enviado";

export interface MensajeConv {
  id: string;
  de: AutorMensaje;
  texto: string;
  horaISO: string;
  /** Solo en mensajes del humano. Sin esto, no afirmamos que se envió. */
  envio?: EstadoEnvio;
}

/** Quién está atendiendo la conversación ahora mismo. */
export type EstadoConv = "ia" | "vos" | "cerrada";

export interface Conversacion {
  id: string;
  canal: CanalConv;
  nombre: string;
  /** Teléfono, mail o usuario, según el canal. */
  contacto: string;
  productoId?: string;
  ordenId?: string;
  leadId?: string;
  estado: EstadoConv;
  noLeida: boolean;
  /** Por qué la IA la derivó a una persona. */
  motivo?: string;
  mensajes: MensajeConv[];
}

/* ===== Cómo se responde cada canal ===== */
export type ModoRespuesta =
  | "wa" // wa.me con el texto ya cargado
  | "mail" // mailto con asunto y cuerpo
  | "tel" // tel: — no se manda texto, se llama
  | "app" // Instagram / Messenger: no aceptan texto en el link → copiamos y abrimos
  | "widget"; // chat de nuestra propia web: el mensaje sale del sistema

export const CANALES_CONV: Record<
  CanalConv,
  { label: string; corto: string; color: string; modo: ModoRespuesta; meta?: boolean }
> = {
  whatsapp: { label: "WhatsApp", corto: "WhatsApp", color: "#25D366", modo: "wa", meta: true },
  instagram: { label: "Instagram", corto: "Instagram", color: "#E1306C", modo: "app", meta: true },
  messenger: { label: "Messenger", corto: "Messenger", color: "#0084FF", modo: "app", meta: true },
  web: { label: "Chat en tu web", corto: "Web", color: "#DF0A0A", modo: "widget" },
  mail: { label: "Email", corto: "Mail", color: "#B0731F", modo: "mail" },
  telefono: { label: "Teléfono", corto: "Teléfono", color: "#71717A", modo: "tel" },
};

export const ORDEN_CANALES: CanalConv[] = ["whatsapp", "instagram", "messenger", "web", "mail", "telefono"];

/* ===== Semilla de demo ===== */
// Las horas se calculan contra el día real para que la bandeja nunca se vea vieja.
const hace = (minutos: number) => new Date(Date.now() - minutos * 60_000).toISOString();

let seq = 0;
const m = (de: AutorMensaje, texto: string, minutos: number, envio?: EstadoEnvio): MensajeConv => ({
  id: "MSG-" + String(++seq).padStart(3, "0"),
  de,
  texto,
  horaISO: hace(minutos),
  ...(envio ? { envio } : {}),
});

export const conversaciones: Conversacion[] = [
  {
    id: "CONV-01",
    canal: "whatsapp",
    nombre: "Andrea Villalba",
    contacto: "+54 9 291 457-2214",
    productoId: "Brack-004",
    leadId: "LEAD-201",
    estado: "vos",
    noLeida: true,
    motivo: "Quiere congelar el precio con una seña — los números finos los cierra una persona",
    mensajes: [
      m("cliente", "Hola, buenas. Vi la heladera Eslabón de Lujo No Frost en la página. ¿La tienen para entregar esta semana?", 96),
      m("ia", "Buenas Andrea, sí: la Eslabón de Lujo No Frost está en stock. Sale $450.000, en 6 cuotas sin interés de $75.000, o $405.000 en efectivo. La entrega en Bahía es sin cargo. ¿Le reservo una?", 95),
      m("cliente", "¿Puedo dejar una seña hoy y pagar el resto cuando la traen?", 88),
      m("ia", "Sí se puede. El monto de la seña y la fecha de entrega se los confirma Marcos directamente, así queda todo por escrito. Ya le pasé su consulta con prioridad.", 87),
    ],
  },
  {
    id: "CONV-02",
    canal: "instagram",
    nombre: "Paula Genta",
    contacto: "@pau.genta",
    productoId: "Brack-015",
    leadId: "LEAD-204",
    estado: "ia",
    noLeida: false,
    mensajes: [
      m("cliente", "hola! vi la heladera gafa reacondicionada en la historia, ¿qué garantía tiene?", 205),
      m("ia", "Hola Paula. Todos los reacondicionados salen del taller con garantía escrita de 6 meses: motor revisado, burletes nuevos y gas cargado. Esa Gafa de 289 litros está $180.000, o $162.000 en efectivo. ¿Quiere pasar a verla por Santa Fe 85?", 204),
      m("cliente", "puede ser el sábado a la mañana?", 198),
      m("ia", "Sábado a la mañana el local está abierto, sí. Si me deja un teléfono le aviso apenas alguien la aparte, así no viaja de gusto.", 197),
    ],
  },
  {
    id: "CONV-03",
    canal: "web",
    nombre: "Diego Manfredi",
    contacto: "+54 9 291 464-8930",
    leadId: "LEAD-202",
    estado: "ia",
    noLeida: false,
    mensajes: [
      m("cliente", "Tengo una heladera Columbia vieja que dejó de enfriar. ¿Ese tipo de equipos los reparan?", 152),
      m("ia", "Sí, las Columbia las trabajamos hace años: el taller repara heladeras y lavarropas de cualquier marca y antigüedad. Lo habitual en ese síntoma es el relé o el termostato; el diagnóstico se lo confirma el técnico al revisarla. ¿Le tomo los datos y coordinamos que la vea?", 151),
      m("cliente", "Dale. Soy Diego, 291 464-8930.", 145),
      m("ia", "Listo Diego, quedó registrada su consulta de service. Marcos o Diego (el técnico) lo contactan hoy para coordinar. Si prefiere adelantar por WhatsApp: +54 9 291 436-4529.", 144),
    ],
  },
  {
    id: "CONV-04",
    canal: "whatsapp",
    nombre: "Ferretería El Tornillo",
    contacto: "+54 9 291 455-6640",
    leadId: "LEAD-210",
    estado: "vos",
    noLeida: true,
    motivo: "Alta de cuenta mayorista — el descuento y la compra mínima los define Marcos",
    mensajes: [
      m("cliente", "Buenas, tenemos una ferretería en Ingeniero White y queremos revender microondas y secarropas. ¿Manejan precio mayorista?", 310),
      m("ia", "Buenas. Sí, Brack tiene canal mayorista con lista propia por revendedor y compra mínima. Las condiciones puntuales (descuento y mínimo) las define Marcos según la zona y el volumen. ¿Me pasa el CUIT y un mail así le arman el acceso al portal?", 309),
      m("cliente", "30-71455812-3, ferreteriaeltornillo@gmail.com", 300),
      m("ia", "Perfecto, ya quedó todo cargado para el alta. En el día le llega el usuario del portal mayorista con su lista de precios. Gracias por escribir.", 299),
    ],
  },
  {
    id: "CONV-05",
    canal: "mail",
    nombre: "Colegio San Vicente",
    contacto: "administracion@sanvicentebb.edu.ar",
    ordenId: "OS-2213",
    estado: "ia",
    noLeida: false,
    mensajes: [
      m("cliente", "Estimados: consultamos por el estado del aire del aula magna y si llegan a terminarlo antes del acto del viernes. Saludos.", 420),
      m("ia", "Estimados: la orden OS-2213 (split BGH 4500, aula magna) está en reparación: carga de gas y limpieza de serpentina. La fecha estimada de entrega es el jueves 30, un día antes del acto. Cualquier novedad se la informamos por este medio. Saludos, Brack Indumentaria.", 418),
      m("cliente", "Perfecto, quedamos atentos. Gracias.", 400),
    ],
  },
  {
    id: "CONV-06",
    canal: "messenger",
    nombre: "Rodolfo Páez",
    contacto: "Rodolfo Páez",
    productoId: "Brack-012",
    estado: "ia",
    noLeida: false,
    mensajes: [
      m("cliente", "Hola, ¿el microondas BGH se puede pagar en cuotas?", 230),
      m("ia", "Hola Rodolfo. Sí: el BGH Quick Chef de 23 litros sale $190.000 y se puede llevar en 6 cuotas sin interés de $31.667. En efectivo queda $171.000 con el 10% de descuento. ¿Se lo apartamos?", 229),
    ],
  },
  {
    id: "CONV-07",
    canal: "telefono",
    nombre: "Mirta Sagasti",
    contacto: "+54 9 291 436-1174",
    leadId: "LEAD-209",
    estado: "vos",
    noLeida: true,
    motivo: "Pidió que la llamen para coordinar el retiro del lavarropas",
    mensajes: [
      m("cliente", "(Llamada entrante · 2 min 10 s)", 380),
      m("ia", "Consulta registrada: lavarropas Longvie que pierde agua por abajo. Se coordina retiro del equipo el jueves a la mañana. Pidió que la llamen después de las 17 para confirmar.", 379),
    ],
  },
  {
    id: "CONV-08",
    canal: "whatsapp",
    nombre: "Kiosco El Paso",
    contacto: "+54 9 291 464-1002",
    productoId: "Brack-018",
    estado: "cerrada",
    noLeida: false,
    mensajes: [
      m("cliente", "Hola, ¿tienen exhibidora de dos puertas? Se me quemó la del kiosco.", 2900),
      m("ia", "Buenas. Sí, hay una exhibidora vertical de 2 puertas reacondicionada por el taller: $750.000, o $675.000 en efectivo/transferencia. Antes de entregarla queda 48 hs probada en el local. ¿Le interesa verla?", 2899),
      m("cliente", "Me interesa. ¿La pueden traer el viernes?", 2880),
      m("humano", "Hola, le escribe Marcos de Brack. Le confirmo la exhibidora para el viernes a la mañana, va probada y con garantía escrita de 6 meses. Cualquier cosa me avisa por acá. Gracias.", 2820, "enviado"),
      m("cliente", "Buenísimo, los espero el viernes. Gracias.", 2760),
    ],
  },
];
