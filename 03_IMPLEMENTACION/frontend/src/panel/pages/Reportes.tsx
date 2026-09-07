import { useMemo } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FileDown, FileSpreadsheet } from "lucide-react";
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
import { fmtARS } from "@/lib/format";
import { CATEGORIAS_PRODUCTO } from "@/data/types";
import { PageHeader } from "../components/PageShell";
import ChartCard from "../components/ChartCard";
import { Btn } from "../components/Controls";
import { useToast } from "../components/Toast";
import { canalLabel } from "../ui/estados";
import { COLORS, SERIE, tooltipStyle } from "../ui/chartTheme";

const catLabel = (cat: string) => CATEGORIAS_PRODUCTO.find((c) => c.key === cat)?.label ?? cat;

export default function Reportes() {
  const { push } = useToast();
  const { productos, leads, kpis, facturacionPorMes, servicePorMes, ventasPorCategoria, leadsPorCanal } = useData();

  // Conversión por canal (consultas vs ventas concretadas)
  const porCanal = useMemo(() => {
    const map = new Map<string, { canal: string; total: number; vendidos: number }>();
    leads.forEach((l) => {
      const cur = map.get(l.canal) ?? { canal: l.canal, total: 0, vendidos: 0 };
      cur.total += 1;
      if (l.estado === "vendido") cur.vendidos += 1;
      map.set(l.canal, cur);
    });
    return Array.from(map.values())
      .map((r) => ({
        ...r,
        nombre: canalLabel[r.canal] ?? r.canal,
        conv: r.total ? Math.round((r.vendidos / r.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [leads]);

  // Top productos por vendidos — el ranking que Marcos mira para reponer.
  const topProductos = useMemo(
    () => [...productos].sort((a, b) => b.vendidos - a.vendidos).slice(0, 8),
    [productos]
  );

  const totalFacturacion = facturacionPorMes.reduce((a, m) => a + m.tienda + m.service + m.mayorista, 0);

  // PDF real con jsPDF: cabecera de marca + resumen + dos tablas, y descarga directa.
  const exportarPDF = () => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const hoy = new Date();
      const fechaTxt = hoy.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });

      doc.setFillColor(223, 10, 10);
      doc.rect(0, 0, W, 72, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold"); doc.setFontSize(18);
      doc.text("Brack Indumentaria", 40, 34);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      doc.text("Electrodomésticos y service · Bahía Blanca", 40, 51);
      doc.setFont("helvetica", "bold"); doc.setFontSize(11);
      doc.text("Reporte de gestión", W - 40, 34, { align: "right" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      doc.text(fechaTxt, W - 40, 51, { align: "right" });

      doc.setTextColor(35, 35, 35); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.text("Resumen", 40, 104);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(95, 95, 95);
      doc.text(
        `${kpis.productosPublicados} productos publicados  ·  ${fmtARS(kpis.ventasMesARS)} vendidos en el mes  ·  ${kpis.serviceAbiertas} órdenes de service abiertas`,
        40, 121
      );

      autoTable(doc, {
        startY: 138,
        head: [["Producto", "Categoría", "Precio", "Stock", "Vendidos"]],
        body: topProductos.map((p) => [p.nombre, catLabel(p.categoria), fmtARS(p.precio), String(p.stock), String(p.vendidos)]),
        headStyles: { fillColor: [223, 10, 10], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 9, cellPadding: 5 },
        alternateRowStyles: { fillColor: [246, 246, 247] },
        columnStyles: { 2: { halign: "right" }, 3: { halign: "center" }, 4: { halign: "center" } },
        margin: { left: 40, right: 40 },
      });

      const y = (doc as any).lastAutoTable.finalY + 26;
      doc.setTextColor(35, 35, 35); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.text("Conversión por canal", 40, y);
      autoTable(doc, {
        startY: y + 12,
        head: [["Canal", "Consultas", "Vendidas", "Conversión"]],
        body: porCanal.map((r) => [r.nombre, String(r.total), String(r.vendidos), `${r.conv}%`]),
        headStyles: { fillColor: [223, 10, 10], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 9, cellPadding: 5 },
        alternateRowStyles: { fillColor: [246, 246, 247] },
        columnStyles: { 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "right" } },
        margin: { left: 40, right: 40 },
      });

      const ph = doc.internal.pageSize.getHeight();
      doc.setFontSize(8); doc.setTextColor(150, 150, 150);
      doc.text("Generado por el panel de Brack Indumentaria · Santa Fe 85, Bahía Blanca", 40, ph - 24);

      doc.save(`Brack-Reporte-${hoy.toISOString().slice(0, 10)}.pdf`);
      push("Reporte PDF descargado", "success");
    } catch {
      push("No se pudo generar el PDF", "error");
    }
  };

  // Excel real: CSV (separador ; para que Excel en español lo abra en columnas) con BOM para acentos.
  const exportarExcel = () => {
    try {
      const hoy = new Date();
      const esc = (v: any) => {
        const s = String(v ?? "");
        return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const rows: (string | number)[][] = [];
      rows.push(["Brack Indumentaria — Reporte de gestión", hoy.toLocaleDateString("es-AR")]);
      rows.push([]);
      rows.push(["Top productos"]);
      rows.push(["Producto", "Categoría", "Precio ARS", "Stock", "Vendidos"]);
      topProductos.forEach((p) => rows.push([p.nombre, catLabel(p.categoria), p.precio, p.stock, p.vendidos]));
      rows.push([]);
      rows.push(["Ventas por categoría"]);
      rows.push(["Categoría", "Facturación ARS"]);
      ventasPorCategoria.forEach((r) => rows.push([r.name, Math.round(r.value)]));
      rows.push([]);
      rows.push(["Conversión por canal"]);
      rows.push(["Canal", "Consultas", "Vendidas", "Conversión %"]);
      porCanal.forEach((r) => rows.push([r.nombre, r.total, r.vendidos, r.conv]));

      const csv = "﻿" + rows.map((r) => r.map(esc).join(";")).join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Brack-Reporte-${hoy.toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      push("Reporte Excel descargado", "success");
    } catch {
      push("No se pudo generar el Excel", "error");
    }
  };

  return (
    <div>
      <PageHeader
        title="Reportes"
        subtitle="Ventas, service y demanda — para decidir con números"
        actions={
          <>
            <Btn variant="ghost" onClick={exportarExcel}>
              <FileSpreadsheet size={16} /> Exportar Excel
            </Btn>
            <Btn variant="primary" onClick={exportarPDF}>
              <FileDown size={16} /> Exportar PDF
            </Btn>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* facturación apilada */}
        <ChartCard
          title="Facturación por mes"
          subtitle={`Tienda + service + mayorista · ${fmtARS(totalFacturacion, { short: true })} en el semestre`}
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={facturacionPorMes}>
              <defs>
                <linearGradient id="rTienda" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.brand} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS.brand} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="rService" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.graphite} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={COLORS.graphite} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="rMayorista" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.amber} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={COLORS.amber} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.ink10} vertical={false} />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: COLORS.ink60 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: COLORS.ink60 }} width={44} tickFormatter={(v) => fmtARS(v, { short: true })} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtARS(v)} />
              <Area type="monotone" stackId="f" dataKey="tienda" name="Tienda" stroke={COLORS.brand} strokeWidth={2.5} fill="url(#rTienda)" />
              <Area type="monotone" stackId="f" dataKey="service" name="Service" stroke={COLORS.graphite} strokeWidth={2} fill="url(#rService)" />
              <Area type="monotone" stackId="f" dataKey="mayorista" name="Mayorista" stroke={COLORS.amber} strokeWidth={2} fill="url(#rMayorista)" />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: COLORS.ink60, fontSize: 12 }}>{v}</span>} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ventas por categoría */}
        <ChartCard title="Ventas por categoría" subtitle="Qué rubro mueve la caja">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={ventasPorCategoria}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.ink10} vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: COLORS.ink60 }} interval={0} angle={-18} height={44} textAnchor="end" />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: COLORS.ink60 }} width={44} tickFormatter={(v) => fmtARS(v, { short: true })} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtARS(v)} />
              <Bar dataKey="value" name="Facturación" radius={[6, 6, 0, 0]} maxBarSize={44}>
                {ventasPorCategoria.map((_, i) => (
                  <Cell key={i} fill={SERIE[i % SERIE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* service por mes */}
        <ChartCard title="Órdenes de service por mes" subtitle="El oficio que sostiene la casa">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={servicePorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.ink10} vertical={false} />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: COLORS.ink60 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: COLORS.ink60 }} width={28} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(22,22,26,0.03)" }} />
              <Bar dataKey="ordenes" name="Órdenes" fill={COLORS.green} radius={[6, 6, 0, 0]} maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* consultas por canal */}
        <ChartCard title="Distribución de consultas" subtitle="Por dónde llegan" className="lg:col-span-2 xl:col-span-1">
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={leadsPorCanal} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={3} stroke="none">
                {leadsPorCanal.map((_, i) => (
                  <Cell key={i} fill={SERIE[i % SERIE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: COLORS.ink60, fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* top productos */}
        <div className="pcard overflow-hidden lg:col-span-2 xl:col-span-1">
          <div className="border-b border-graph/[0.07] px-5 py-4">
            <h3 className="font-display text-base font-semibold text-graph">Top productos</h3>
            <p className="text-xs text-graph-400">Los más vendidos del catálogo</p>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-graph/[0.07] bg-graph/[0.03] text-left text-xs font-semibold uppercase tracking-wide text-graph-400">
                <th className="px-5 py-2.5">Producto</th>
                <th className="px-5 py-2.5 text-right">Precio</th>
                <th className="px-5 py-2.5 text-center">Stock</th>
                <th className="px-5 py-2.5 text-center">Vendidos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graph/[0.07]">
              {topProductos.map((p) => (
                <tr key={p.id} className="transition hover:bg-graph/[0.03]">
                  <td className="px-5 py-2.5">
                    <p className="line-clamp-1 font-medium text-graph">{p.nombre}</p>
                    <p className="text-xs text-graph-400">{catLabel(p.categoria)}</p>
                  </td>
                  <td className="px-5 py-2.5 text-right font-display font-semibold text-graph">{fmtARS(p.precio, { short: true })}</td>
                  <td className={`px-5 py-2.5 text-center font-semibold ${p.stock <= 1 ? "text-red-700" : "text-graph-500"}`}>{p.stock}</td>
                  <td className="px-5 py-2.5 text-center font-semibold text-graph">{p.vendidos}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>

      {/* conversión por canal */}
      <div className="mt-4 grid grid-cols-1 gap-4">
        <div className="pcard overflow-hidden">
          <div className="border-b border-graph/[0.07] px-5 py-4">
            <h3 className="font-display text-base font-semibold text-graph">Conversión por canal</h3>
            <p className="text-xs text-graph-400">Efectividad de cada fuente de consultas</p>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[460px] text-sm">
            <thead>
              <tr className="border-b border-graph/[0.07] bg-graph/[0.03] text-left text-xs font-semibold uppercase tracking-wide text-graph-400">
                <th className="px-5 py-2.5">Canal</th>
                <th className="px-5 py-2.5 text-center">Consultas</th>
                <th className="px-5 py-2.5 text-center">Vendidas</th>
                <th className="px-5 py-2.5 text-right">Conversión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graph/[0.07]">
              {porCanal.map((r) => (
                <tr key={r.canal} className="transition hover:bg-graph/[0.03]">
                  <td className="px-5 py-2.5 font-medium text-graph">{r.nombre}</td>
                  <td className="px-5 py-2.5 text-center text-graph-500">{r.total}</td>
                  <td className="px-5 py-2.5 text-center text-graph-500">{r.vendidos}</td>
                  <td className="px-5 py-2.5 text-right">
                    <span className="inline-flex items-center gap-2">
                      <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-graph/[0.08] sm:inline-block">
                        <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.min(r.conv, 100)}%` }} />
                      </span>
                      <span className="font-display font-semibold text-graph">{r.conv}%</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>
    </div>
  );
}
