import type { Stats } from "@/pages/Dashboard";
import type { Deal } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const THESES: Record<string, string> = {
  "AI Infrastructure": "Seed mega-rounds (Merge $252M, Inferact $150M) and Starcloud's orbital GPU data centers signal the infrastructure frontier has expanded beyond silicon. MatX and Nexthop absorbing $500M Series B rounds each confirms picks-and-shovels is table stakes.",
  "Foundation Models": "Bezos-backed AMI Labs ($1.03B seed) and humans& ($480M) show investors pre-empting efficiency-first labs before launch. Goodfire and Arena confirm interpretability and evaluation are the safety infrastructure for enterprise AI deployment.",
  "Robotics & Physical AI": "Accel + a16z co-leading Mind Robotics ($500M Series A) and Google backing Apptronik confirms tier-1 software VCs have fully embraced hardware bets. World models (AMI) are emerging as the paradigm replacing transformers for physical-world reasoning.",
  "Developer Tools": "Two bets dominating: agentic OS (Sycamore $65M, ex-Atlassian CTO) vs. formal verification (Axiom $200M, $1.6B val). As AI writes more code, the market needs both AI-native code governance and provably correct outputs.",
  "Healthcare AI": "Doctronic — first AI to legally practice medicine ($40M Series B) — is the structural signal. GV, Lightspeed, and Abstract writing healthcare checks signals regulation is a feature, not a bug. Molecular AI (Chai Discovery $130M) anchors drug discovery.",
  "Security AI": "Agentic security is 2026's breakout category — 10+ deals in Q1 alone. RunSybil (Khosla), JetStream (Redpoint + CrowdStrike), and Trent AI (UK) all emerged within 6 weeks. Every AI agent deployed creates a new attack surface incumbents can't address.",
  "Enterprise AI": "Fragmentation into micro-verticals: legal intelligence (Chamelio), AI document infrastructure (Factify $63M), and customer research (Listen Labs $69M Series B, Ribbit-led). Fintech-adjacent capital flowing into enterprise AI tooling is a structural signal.",
  "Consumer AI": "Product-market fit in two clear niches: AI creative tools (Flora $42M, used by Lionsgate + Pentagram) and AI commerce agents (Phia $35M, $185M val, Phoebe Gates co-founder). Celebrity-founder dynamics are attracting serious institutional capital.",
};

const SECTOR_COLORS: Record<string, string> = {
  "Foundation Models": "#4f98a3", "AI Infrastructure": "#e8a838", "Robotics & Physical AI": "#7b5ea7",
  "Developer Tools": "#4caf82", "Healthcare AI": "#e05c5c", "Security AI": "#5c8de0",
  "Enterprise AI": "#a0a0a0", "Consumer AI": "#e07a5c",
};

export function SectorCards({ stats, filtered, loading }: { stats?: Stats; filtered: Deal[]; loading: boolean }) {
  const sectorMap: Record<string, { total: number; count: number; companies: string[] }> = {};
  filtered.forEach((d) => {
    if (!sectorMap[d.sector]) sectorMap[d.sector] = { total: 0, count: 0, companies: [] };
    sectorMap[d.sector].total += d.amount;
    sectorMap[d.sector].count++;
    sectorMap[d.sector].companies.push(d.company);
  });
  const sectors = Object.entries(sectorMap).sort((a, b) => b[1].total - a[1].total);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    );
  }

  return (
    <section>
      <h2 className="font-semibold text-lg mb-4">Sector Intelligence</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {sectors.map(([sector, data]) => {
          const color = SECTOR_COLORS[sector] || "#888";
          return (
            <div key={sector} className="bg-card border border-border rounded-xl p-5" style={{ borderLeftColor: color, borderLeftWidth: 3 }}>
              <div className="flex justify-between items-baseline mb-2">
                <h3 className="text-sm font-semibold">{sector}</h3>
                <div className="text-right shrink-0 ml-4">
                  <div className="text-xs font-mono font-bold" style={{ color }}>${Math.round(data.total)}M</div>
                  <div className="text-[10px] text-muted-foreground">{data.count} deals</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{THESES[sector] || ""}</p>
              <div className="flex flex-wrap gap-1">
                {data.companies.slice(0, 6).map((c) => (
                  <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-border/50 text-muted-foreground">{c}</span>
                ))}
                {data.companies.length > 6 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-border/50 text-muted-foreground">+{data.companies.length - 6} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
