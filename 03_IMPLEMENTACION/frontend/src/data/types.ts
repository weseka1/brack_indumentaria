// ===== Tipos del dominio BRACK Indumentaria =====
// Indumentaria urbana + zapatillas + perfumería importada. Tienda, panel e IA
// tipan contra este archivo: es la fuente de verdad del dominio.
//
// Viene del molde de Brack (el e-commerce de la casa) adaptado a ropa. Lo que
// cambió y por qué:
//   · Las categorías son las de SU tienda real, no las de electrodomésticos.
//   · Entra `talles: string[]` — en ropa el talle es el eje de todo: define el
//     stock, la consulta más frecuente y la causa nº1 de cambio.
//   · `condicion` (nuevo/reacondicionado) no aplica y se fue.
//   · `stock` es booleano: Tiendanube NO publica cantidades y no se inventan
//     números (decisión de Juani, 19-ago). Se muestra disponible o agotado.

// ── Producto (tienda) ─────────────────────────────────────────────────────────

export type CategoriaProducto =
  | "remeras"
  | "musculosas"
  | "buzos"
  | "camperas"
  | "pantalones"
  | "bermudas"
  | "chombas"
  | "camisetas"
  | "zapatillas"
  | "gorras"
  | "accesorios"
  | "perfumes"
  | "otros";

export interface Producto {
  id: string; // BRK-001
  nombre: string; // "Buzo Shato Frizado"
  marca: string;
  categoria: CategoriaProducto;
  /** Los talles que él publica. Vacío = talle único (gorras, perfumes). */
  talles: string[];
  precio: number; // ARS, precio de lista
  cuotas: number; // 6 sin interés (los de su tienda)
  descuentoEfectivoPct: number; // 20% en efectivo (el de su tienda)
  /**
   * 🔴 Disponibilidad REAL, no cantidad. Tiendanube no publica el stock y acá
   * no se inventan números: la tienda muestra "disponible" o "agotado", que es
   * exactamente lo que él muestra hoy.
   */
  stock: boolean;
  fotos: string[];
  descripcion: string;
  /** Talles y la tabla de medidas que él escribe en cada ficha ("40: 26,5cm"). */
  specs: { rotulo: string; valor: string }[];
  destacado: boolean;
  publicado: boolean; // false = borrador interno, no sale en la tienda
  vendidos: number; // métrica del panel
  altaISO: string;
  /** La ficha en su Tiendanube, para cotejar que el dato es suyo. */
  urlOriginal?: string;
}

export const CATEGORIAS_PRODUCTO: { key: CategoriaProducto; label: string; plural: string }[] = [
  { key: "remeras", label: "Remera", plural: "Remeras" },
  { key: "buzos", label: "Buzo", plural: "Buzos y sweaters" },
  { key: "camperas", label: "Campera", plural: "Camperas" },
  { key: "pantalones", label: "Pantalón", plural: "Pantalones" },
  { key: "bermudas", label: "Bermuda", plural: "Bermudas y mallas" },
  { key: "chombas", label: "Chomba", plural: "Chombas y camisas" },
  { key: "camisetas", label: "Camiseta", plural: "Camisetas" },
  { key: "musculosas", label: "Musculosa", plural: "Musculosas" },
  { key: "zapatillas", label: "Zapatilla", plural: "Zapatillas" },
  { key: "gorras", label: "Gorra", plural: "Gorras" },
  { key: "perfumes", label: "Perfume", plural: "Perfumes importados" },
  { key: "accesorios", label: "Accesorio", plural: "Accesorios" },
  { key: "otros", label: "Otro", plural: "Otros" },
];

/** Valor de una cuota sin interés, redondeado al peso. */
export const valorCuota = (p: Producto) => Math.round(p.precio / (p.cuotas || 1));
/** Precio pagando en efectivo (descuento aplicado). */
export const precioEfectivo = (p: Producto) => Math.round(p.precio * (1 - p.descuentoEfectivoPct / 100));

// ── Pedido (e-commerce + mostrador + mayorista) ───────────────────────────────

export type EstadoPedido = "nuevo" | "confirmado" | "preparando" | "entregado" | "cancelado";
export type MedioPago = "efectivo" | "transferencia" | "tarjeta_cuotas" | "cuenta_corriente";
export type CanalPedido = "web" | "local" | "whatsapp" | "mayorista";

export interface ItemPedido {
  productoId: string;
  nombre: string; // snapshot al momento de la venta
  cantidad: number;
  precioUnit: number; // ARS, el precio que se cobró (mayorista ≠ lista)
}

export interface Pedido {
  id: string; // PED-1041
  fechaISO: string;
  cliente: string;
  contacto: string; // tel o mail
  clienteId?: string;
  revendedorId?: string; // si es un pedido del portal mayorista
  items: ItemPedido[];
  total: number; // ARS
  medioPago: MedioPago;
  cuotas?: number; // si pagó con tarjeta en cuotas
  entrega: "retiro" | "envio";
  direccion?: string;
  estado: EstadoPedido;
  canal: CanalPedido;
  notas?: string;
}

// ── Orden de service (el oficio original) ─────────────────────────────────────

export type EstadoOrden =
  | "ingresada" // el equipo llegó / se agendó la visita
  | "diagnostico" // el técnico lo está revisando
  | "presupuestada" // se pasó el número, espera el OK del cliente
  | "reparacion" // aprobada y en el banco de trabajo
  | "lista" // reparada, avisar al cliente
  | "entregada"
  | "cancelada";

export interface OrdenServicio {
  id: string; // OS-2210
  fechaISO: string;
  cliente: string;
  contacto: string;
  clienteId?: string;
  equipo: string; // "Heladera Gafa HGF-357 blanca"
  categoria: CategoriaProducto;
  falla: string; // lo que reporta el cliente
  diagnostico?: string; // lo que encontró el técnico
  presupuesto?: number; // ARS
  senia?: number;
  estado: EstadoOrden;
  tecnico: string;
  /** Vínculo venta ↔ service: el equipo se compró en Brack. */
  compradoEnAder: boolean;
  pedidoId?: string; // el pedido original, si se compró acá
  enGarantia: boolean; // reparación cubierta por la garantía
  entregaEstimadaISO?: string;
  notas?: string;
}

// ── Cliente (CRM) ─────────────────────────────────────────────────────────────

export type TipoCliente = "minorista" | "mayorista" | "service";

export interface Cliente {
  id: string;
  nombre: string;
  tipo: TipoCliente;
  telefono: string;
  email: string;
  localidad: string;
  /** Equipos que le vendimos (para vincular cuando llama por una reparación). */
  equipos: string[];
  comprasARS: number; // total histórico
  operaciones: number; // cantidad de compras + services
  desdeISO: string;
  notas: string;
}

// ── Consulta / lead (lo que cae de todos los canales) ────────────────────────

export type Canal = "web" | "whatsapp" | "instagram" | "mail" | "telefono";
export type EstadoLead = "nueva" | "contactado" | "cotizado" | "vendido" | "perdido";
export type InteresLead = "producto" | "service" | "mayorista";

export interface Lead {
  id: string;
  fechaISO: string;
  nombre: string;
  contacto: string;
  productoId: string | null; // producto por el que preguntó (si aplica)
  interes: InteresLead;
  canal: Canal;
  estado: EstadoLead;
  asignado: string;
  notas: string;
}

// ── Mayorista (revendedores con lista propia) ────────────────────────────────

export interface Revendedor {
  id: string; // REV-01
  razon: string; // "Electro Mitre (Punta Alta)"
  contacto: string; // nombre de la persona
  telefono: string;
  email: string;
  localidad: string;
  usuario: string; // login del portal mayorista
  /** Su lista = precio de lista − descuentoPct. Cada revendedor tiene el suyo. */
  descuentoPct: number;
  compraMinima: number; // ARS mínimo por pedido
  saldoCuenta: number; // cuenta corriente (negativo = debe)
  ultimaCompraISO: string;
  activo: boolean;
}

/** Precio de un producto para un revendedor puntual. */
export const precioMayorista = (p: Producto, r: Revendedor) =>
  Math.round(p.precio * (1 - r.descuentoPct / 100));
