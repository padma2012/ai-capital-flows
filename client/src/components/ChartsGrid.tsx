import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Stats } from "@/pages/Dashboard";
import type { Deal } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const SECTOR_COLORS: Record<string, string> = {
  "Foundation Models": "#4f98a3",
  "AI Infrastructure": "#e8a838",
  "Robotics & Physical AI": "#7b5ea7",
  "Developer Tools": "#4caf82",
  "Healthcare AI": "#e05c5c",
  "Security AI": "#5c8de0",
  "Enterprise AI": "#a0a0a0",
  "Consumer AI": "#e07a5c",
};
const STAGE_COLORS: Record<string, string> = {
  "Pre-Seed": "#5b4a8a",
  "Seed": "#7b5ea7",
  "Series A": "#4f98a3",
  "Series B": "#e8a838",
  "Series C": "#e87d38",
  "Series D": "#e85038",
  "Series E": "#c0392b",
  "Series F": "#922b21",
  "Series G": "#641e16",
  "Growth": "#1e8449",
  "Mega Round": "#0e6655",
};

const TooltipStyle = {
  contentStyle: { background: "hsl(35 8% 11%)", border: "1px solid hsl(35 8% 20%)", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "hsl(40 15% 85%)" },
  itemStyle: { color: "hsl(40 15% 70%)" },
};

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function ChartsGrid({ stats, filtered, loading }: { stats?: Stats; filtered: Deal[]; loading: boolean }) {
  // Compute sector totals from filtered data
  const sectorMap: Record<string, number> = {};
  filtered.forEach((d) => { sectorMap[d.sector] = (sectorMap[d.sector] || 0) + d.amount; });
  const sectorData = Object.entries(sectorMap)
    .sort((a, b) => b[1] - a[1])
    .map(([sector, total]) => ({ sector: sector.replace(" & Physical AI", "").replace(" Models", ""), total: Math.round(total), full: sector }));

  const stageMap: Record<string, number> = {};
  filtered.forEach((d) => { stageMap[d.stage] = (stageMap[d.stage] || 0) + 1; });
  const stageData = Object.entries(stageMap).map(([stage, count]) => ({ stage, count }));

  // Top investors from filtered
  const invMap: Record<string, { total: number; count: number; companies: string[] }> = {};
  filtered.forEach((d) => {
    if (!d.lead || d.lead === "Undisclosed") return;
    d.lead.split(/\s*[&,]\s*/).forEach((lead) => {
      const n = lead.trim();
      if (!n) return;
      if (!invMap[n]) invMap[n] = { total: 0, count: 0, companies: [] };
      invMap[n].total += d.amount;
      invMap[n].count++;
      invMap[n].companies.push(d.company);
    });
  });
  const investors = Object.entries(invMap).sort((a, b) => b[1].total - a[1].total).slice(0, 8)
    .map(([investor, data]) => ({ investor, ...data }));
  const maxInvTotal = investors[0]?.total ?? 1;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Sector Bar */}
      <ChartCard title="Capital by Sector" subtitle="Total $M deployed by vertical">
        <div className="flex flex-wrap gap-2 mb-3">
          {sectorData.map((s) => (
            <span key={s.full} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: SECTOR_COLORS[s.full] || "#888" }} />
              {s.sector}
            </span>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sectorData} margin={{ top: 0, right: 0, bottom: 30, left: 0 }}>
            <XAxis dataKey="sector" tick={{ fontSize: 9, fill: "hsl(40 10% 55%)" }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 9, fill: "hsl(40 10% 55%)" }} tickFormatter={(v) => `$${v}M`} />
            <Tooltip {...TooltipStyle} formatter={(v: number) => [`$${v}M`, "Deployed"]} />
            <Bar dataKey="total" radius={[3, 3, 0, 0]}>
              {sectorData.map((s) => <Cell key={s.full} fill={SECTOR_COLORS[s.full] || "#888"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Stage Donut */}
      <ChartCard title="Stage Split" subtitle="Deal count by funding stage">
        <div className="flex justify-center items-center h-[200px] gap-8">
          <ResponsiveContainer width="60%" height={200}>
            <PieChart>
              <Pie data={stageData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="count" paddingAngle={3}>
                {stageData.map((s) => <Cell key={s.stage} fill={STAGE_COLORS[s.stage] || "#888"} />)}
              </Pie>
              <Tooltip {...TooltipStyle} formatter={(v: number) => [v, "Deals"]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3 shrink-0">
            {stageData.map((s) => (
              <div key={s.stage} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: STAGE_COLORS[s.stage] || "#888" }} />
                <div>
                  <div className="text-xs font-medium">{s.stage}</div>
                  <div className="text-[11px] text-muted-foreground">{s.count} deals</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>

      {/* Investor Leaderboard */}
      <ChartCard title="Top Investors" subtitle="Lead checks written this period">
        <div className="space-y-3 mt-1">
          {investors.map((inv, i) => (
            <div key={inv.investor} className="flex items-start gap-3">
              <span className="text-[10px] text-muted-foreground w-4 shrink-0 pt-0.5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs font-semibold truncate">{inv.investor}</span>
                  <span className="text-xs text-primary shrink-0 ml-2">${Math.round(inv.total)}M</span>
                </div>
                <div className="h-1 bg-border rounded-full">
                  <div
                    className="h-1 rounded-full"
                    style={{ width: `${(inv.total / maxInvTotal) * 100}%`, background: i === 0 ? "#4f98a3" : i === 1 ? "#e8a838" : i === 2 ? "#7b5ea7" : "#5c8de0" }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{inv.companies.slice(0, 3).join(" · ")}</div>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 pt-0.5">{inv.count}d</span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
