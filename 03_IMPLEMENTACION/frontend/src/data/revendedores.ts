import type { Revendedor } from "./types";

// ===== Revendedores (portal mayorista) =====
// Cada revendedor entra con su usuario y ve SU lista (precio de lista − su %),
// con su compra mínima y su cuenta corriente. Nadie más ve esos números.

export const revendedores: Revendedor[] = [
  {
    id: "REV-01",
    razon: "Electro Mitre",
    contacto: "Gustavo Arce",
    telefono: "+54 9 2932 42-1180",
    email: "compras@electromitre.com.ar",
    localidad: "Punta Alta",
    usuario: "electromitre",
    descuentoPct: 20,
    compraMinima: 500000,
    saldoCuenta: -1015997,
    ultimaCompraISO: "2026-07-28",
    activo: true,
  },
  {
    id: "REV-02",
    razon: "Casa Robles Hogar",
    contacto: "Mariana Robles",
    telefono: "+54 9 291 470-3345",
    email: "robleshogar@gmail.com",
    localidad: "Coronel Dorrego",
    usuario: "robleshogar",
    descuentoPct: 15,
    compraMinima: 400000,
    saldoCuenta: 0,
    ultimaCompraISO: "2026-07-22",
    activo: true,
  },
  {
    id: "REV-03",
    razon: "Distribuidora El Puente",
    contacto: "Fabián Suárez",
    telefono: "+54 9 291 511-8062",
    email: "elpuentedistribuciones@gmail.com",
    localidad: "Médanos",
    usuario: "elpuente",
    descuentoPct: 18,
    compraMinima: 600000,
    saldoCuenta: -240000,
    ultimaCompraISO: "2026-06-30",
    activo: true,
  },
  {
    id: "REV-04",
    razon: "Bazar Norte",
    contacto: "Claudia Peral",
    telefono: "+54 9 291 464-9921",
    email: "bazarnortebb@hotmail.com",
    localidad: "Bahía Blanca",
    usuario: "bazarnorte",
    descuentoPct: 12,
    compraMinima: 300000,
    saldoCuenta: 0,
    ultimaCompraISO: "2026-05-18",
    activo: false,
  },
];

export const getRevendedor = (id: string) => revendedores.find((r) => r.id === id);
export const getRevendedorPorUsuario = (usuario: string) =>
  revendedores.find((r) => r.usuario === usuario.toLowerCase().trim());
