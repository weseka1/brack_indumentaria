// ===== Series históricas para los gráficos del panel =====
// Los últimos 6 meses de la operación Brack (demo). Los KPIs "vivos" se calculan
// en el DataProvider a partir de pedidos/órdenes/consultas reales del estado.

/** Consultas recibidas y ventas concretadas por mes (barras del Dashboard). */
export const consultasPorMes = [
  { mes: "Feb", consultas: 38, ventas: 9 },
  { mes: "Mar", consultas: 42, ventas: 11 },
  { mes: "Abr", consultas: 35, ventas: 8 },
  { mes: "May", consultas: 47, ventas: 12 },
  { mes: "Jun", consultas: 55, ventas: 14 },
  { mes: "Jul", consultas: 63, ventas: 17 },
];

/** Facturación mensual en ARS (línea del Dashboard): tienda + service + mayorista. */
export const facturacionPorMes = [
  { mes: "Feb", tienda: 2850000, service: 940000, mayorista: 1620000 },
  { mes: "Mar", tienda: 3120000, service: 1010000, mayorista: 1480000 },
  { mes: "Abr", tienda: 2640000, service: 1180000, mayorista: 1890000 },
  { mes: "May", tienda: 3480000, service: 1250000, mayorista: 2140000 },
  { mes: "Jun", tienda: 3910000, service: 1320000, mayorista: 2310000 },
  { mes: "Jul", tienda: 4370000, service: 1410000, mayorista: 2560000 },
];

/** Órdenes de service por mes (el oficio que sostiene la casa). */
export const servicePorMes = [
  { mes: "Feb", ordenes: 31 },
  { mes: "Mar", ordenes: 34 },
  { mes: "Abr", ordenes: 38 },
  { mes: "May", ordenes: 36 },
  { mes: "Jun", ordenes: 41 },
  { mes: "Jul", ordenes: 45 },
];
