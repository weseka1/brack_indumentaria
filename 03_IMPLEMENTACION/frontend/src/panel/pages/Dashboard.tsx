import { Link } from "react-router-dom";
import {
  Banknote,
  ShoppingCart,
  Wrench,
  Inbox,
  Package,
  Percent,
  ArrowRight,
  Truck,
  UserPlus,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useData } from "@/lib/DataProvider";
import { fmtARS, desde } from "@/lib/format";
import { useProfiles } from "../profiles";
import KpiCard from "../components/KpiCard";
import ChartCard from "../components/ChartCard";
import Badge from "../components/Badge";
import ChannelIcon from "../components/ChannelIcon";
import { PageHeader } from "../components/PageShell";
import { estadoPedido, estadoOrden, estadoLead, canalPedido } from "../ui/estados";
import { COLORS, SERIE, tooltipStyle } from "../ui/chartTheme";

export default function Dashboard() {
  const {
    kpis,
    leads,
    pedidos,
    ordenes,
    consultasPorMes,
    facturacionPorMes,
    leadsPorCanal,
    embudoPedidos,
    ventasPorCategoria,
  } = useData();
  const { activo } = useProfiles();

  const hoyLargo = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // ===== Bloque "Hoy": lo que hay que atender ya, con link directo =====
  const pedidosNuevos = pedidos.filter((p) => p.estado === "nuevo");
  const ordenesPorEntregar = ordenes.filter((o) => o.estado === "lista");
  const consultasSinAsignar = leads.filter((l) => l.estado === "nueva" && l.asignado === "Sin asignar");

  const ultimosPedidos = [...pedidos]
    .sort((a, b) => +new Date(b.fechaISO) - +new Date(a.fechaISO))
    .slice(0, 5);

  const serviceEnCurso = [...ordenes]
    .filter((o) => !["entregada", "cancelada"].includes(o.estado))
    .sort((a, b) => +new Date(b.fechaISO) - +new Date(a.fechaISO))
    .slice(0, 4);

  const hoyItems = [
    { to: "/panel/pedidos", icon: ShoppingCart, label: "Pedidos nuevos para confirmar", count: pedidosNuevos.length },
    { to: "/panel/service", icon: Truck, label: "Reparaciones listas para entregar", count: ordenesPorEntregar.length },
    { to: "/panel/bandeja", icon: UserPlus, label: "Consultas sin asignar", count: consultasSinAsignar.length },
  ];

  return (
    <div>
      <PageHeader
        title={`Buen día, ${activo?.nombre ?? "equipo"}`}
        subtitle={`Resumen operativo de Brack Indumentaria · ${hoyLargo}`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Ventas del mes"
          value={fmtARS(kpis.ventasMesARS, { short: true })}
          icon={Banknote}
          hint="tienda + mostrador + mayorista"
          accent="brand"
        />
        <KpiCard
          label="Pedidos nuevos"
          value={`${kpis.pedidosNuevos}`}
          icon={ShoppingCart}
          hint={`${kpis.pedidosActivos} activos en total`}
          accent="ink"
        />
        <KpiCard
          label="Service abierto"
          value={`${kpis.serviceAbiertas}`}
          icon={Wrench}
          hint={`${kpis.serviceListas} lista${kpis.serviceListas === 1 ? "" : "s"} para entregar`}
          accent="sea"
        />
        <KpiCard
          label="Consultas nuevas"
          value={`${kpis.consultasNuevas}`}
          icon={Inbox}
          hint={`${kpis.consultasTotal} en total`}
          accent="ink"
        />
        <KpiCard
          label="Stock bajo"
          value={`${kpis.stockBajo}`}
          icon={Package}
          hint={kpis.stockBajo > 0 ? "productos con 1 o menos" : "todo con stock"}
          accent={kpis.stockBajo > 0 ? "red" : "sea"}
        />
        <KpiCard
          label="Conversión"
          value={`${kpis.conversion}%`}
          icon={Percent}
          hint="de consulta a venta"
          accent="amber"
        />
      </div>

      {/* Charts + panel lateral */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* columna izquierda: gráficos */}
        <div className="min-w-0 space-y-4 xl:col-span-2">
          <ChartCard
            title="Facturación por mes"
            subtitle="Tienda, service y mayorista — en pesos"
            right={
              <span className="inline-flex flex-wrap items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-graph-400">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.brand }} /> Tienda
                </span>
                <span className="inline-flex items-center gap-1.5 text-graph-400">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.graphite }} /> Service
                </span>
                <span className="inline-flex items-center gap-1.5 text-graph-400">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.amber }} /> Mayorista
                </span>
              </span>
            }
          >
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={facturacionPorMes}>
                <defs>
                  <linearGradient id="gTienda" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.brand} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={COLORS.brand} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gService" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.graphite} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={COLORS.graphite} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gMayorista" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.amber} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={COLORS.amber} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.ink10} vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: COLORS.ink60 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: COLORS.ink60 }} width={44} tickFormatter={(v) => fmtARS(v, { short: true })} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtARS(v)} />
                <Area type="monotone" stackId="f" dataKey="tienda" name="Tienda" stroke={COLORS.brand} strokeWidth={2.2} fill="url(#gTienda)" />
                <Area type="monotone" stackId="f" dataKey="service" name="Service" stroke={COLORS.graphite} strokeWidth={2} fill="url(#gService)" />
                <Area type="monotone" stackId="f" dataKey="mayorista" name="Mayorista" stroke={COLORS.amber} strokeWidth={2} fill="url(#gMayorista)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ChartCard
              title="Consultas vs. ventas"
              subtitle="Evolución mensual de la demanda"
              right={
                <span className="inline-flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-graph-400">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.graphite }} /> Consultas
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-graph-400">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.brand }} /> Ventas
                  </span>
                </span>
              }
            >
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={consultasPorMes} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.ink10} vertical={false} />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: COLORS.ink60 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: COLORS.ink60 }} width={28} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(22,22,26,0.03)" }} />
                  <Bar dataKey="consultas" name="Consultas" fill={COLORS.graphite} radius={[6, 6, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="ventas" name="Ventas" fill={COLORS.brand} radius={[6, 6, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Ventas por categoría" subtitle="Facturación por rubro de producto">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={ventasPorCategoria}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {ventasPorCategoria.map((_, i) => (
                      <Cell key={i} fill={SERIE[i % SERIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtARS(v, { short: true })} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => <span style={{ color: COLORS.ink60, fontSize: 12 }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ChartCard title="Embudo de pedidos" subtitle="Cuántos pedidos hay en cada estado">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={embudoPedidos} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.ink10} horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: COLORS.ink60 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="etapa"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: COLORS.ink60 }}
                    width={82}
                  />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(22,22,26,0.03)" }} />
                  <Bar dataKey="cantidad" name="Pedidos" fill={COLORS.brand} radius={[0, 6, 6, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="De dónde llegan las consultas" subtitle="WhatsApp, web, Instagram, mail, teléfono">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={leadsPorCanal}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={44}
                    outerRadius={66}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {leadsPorCanal.map((_, i) => (
                      <Cell key={i} fill={SERIE[i % SERIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => <span style={{ color: COLORS.ink60, fontSize: 12 }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>

        {/* columna derecha: lo operativo de hoy */}
        <div className="min-w-0 space-y-4">
          {/* Hoy */}
          <div className="pcard">
            <div className="border-b border-graph/[0.07] px-5 py-4">
              <h3 className="font-display text-base font-semibold text-graph">Hoy</h3>
              <p className="text-xs text-graph-400">Lo que espera una acción del equipo</p>
            </div>
            <ul className="divide-y divide-graph/[0.07]">
              {hoyItems.map((it) => (
                <li key={it.label}>
                  <Link to={it.to} className="flex min-h-[44px] items-center gap-3 px-5 py-3 transition hover:bg-graph/[0.03]">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${it.count > 0 ? "bg-brand/10 text-brand-700" : "bg-graph/[0.05] text-graph-400"}`}>
                      <it.icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-medium text-graph">{it.label}</span>
                    <span className={`min-w-[24px] rounded-full px-2 py-0.5 text-center text-xs font-bold ${it.count > 0 ? "bg-brand text-white" : "bg-graph/[0.06] text-graph-400"}`}>
                      {it.count}
                    </span>
                    <ArrowRight size={14} className="shrink-0 text-graph-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* últimos pedidos */}
          <div className="pcard">
            <div className="flex items-center justify-between border-b border-graph/[0.07] px-5 py-4">
              <h3 className="font-display text-base font-semibold text-graph">Últimos pedidos</h3>
              <Link to="/panel/pedidos" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-600">
                Ver todos <ArrowRight size={13} />
              </Link>
            </div>
            <ul className="divide-y divide-graph/[0.07]">
              {ultimosPedidos.map((p) => {
                const e = estadoPedido[p.estado];
                const c = canalPedido[p.canal];
                return (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3 transition hover:bg-graph/[0.03]">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-graph">{p.cliente}</p>
                      <p className="truncate text-xs text-graph-400">
                        {p.id} · {c?.label ?? p.canal} · {fmtARS(p.total, { short: true })}
                      </p>
                    </div>
                    <Badge tone={e.tone} dot>{e.label}</Badge>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* service en curso */}
          <div className="pcard">
            <div className="flex items-center justify-between border-b border-graph/[0.07] px-5 py-4">
              <h3 className="font-display text-base font-semibold text-graph">Service en curso</h3>
              <Link to="/panel/service" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-600">
                Taller <ArrowRight size={13} />
              </Link>
            </div>
            <ul className="divide-y divide-graph/[0.07]">
              {serviceEnCurso.map((o) => {
                const e = estadoOrden[o.estado];
                return (
                  <li key={o.id} className="flex items-center gap-3 px-5 py-3 transition hover:bg-graph/[0.03]">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-graph/[0.05] text-graph-500">
                      <Wrench size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-graph">{o.equipo}</p>
                      <p className="truncate text-xs text-graph-400">{o.cliente} · {o.tecnico}</p>
                    </div>
                    <Badge tone={e.tone} dot>{e.label}</Badge>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* últimas consultas */}
          <div className="pcard">
            <div className="flex items-center justify-between border-b border-graph/[0.07] px-5 py-4">
              <h3 className="font-display text-base font-semibold text-graph">Últimas consultas</h3>
              <Link to="/panel/bandeja" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-600">
                Bandeja <ArrowRight size={13} />
              </Link>
            </div>
            <ul className="divide-y divide-graph/[0.07]">
              {[...leads]
                .sort((a, b) => +new Date(b.fechaISO) - +new Date(a.fechaISO))
                .slice(0, 4)
                .map((l) => (
                  <li key={l.id} className="flex items-center gap-3 px-5 py-3 transition hover:bg-graph/[0.03]">
                    <ChannelIcon canal={l.canal} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-graph">{l.nombre}</p>
                      <p className="truncate text-xs text-graph-400">{desde(l.fechaISO)}</p>
                    </div>
                    <Badge tone={estadoLeadTone(l.estado)} dot>{estadoLeadLabel(l.estado)}</Badge>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const estadoLeadTone = (e: string) => estadoLead[e]?.tone ?? "neutral";
const estadoLeadLabel = (e: string) => estadoLead[e]?.label ?? e;
