import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Deal } from "@shared/schema";
import { HeroSection } from "@/components/HeroSection";
import { FilterBar } from "@/components/FilterBar";
import { ChartsGrid } from "@/components/ChartsGrid";
import { DealsTable } from "@/components/DealsTable";
import { SectorCards } from "@/components/SectorCards";
import { Header } from "@/components/Header";
import { PipelineStatus } from "@/components/PipelineStatus";

export interface Stats {
  totalDeals: number;
  totalCapital: number;
  lastUpdated: string | null;
  sectorTotals: { sector: string; total: number; count: number }[];
  stageCounts: { stage: string; count: number }[];
  regionCounts: { region: string; count: number }[];
  topInvestors: { investor: string; total: number; count: number; companies: string[] }[];
}

export default function Dashboard() {
  const [stage, setStage] = useState("all");
  const [sector, setSector] = useState("all");
  const [region, setRegion] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof Deal>("date");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const { data: allDeals = [], isLoading: dealsLoading } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
    queryFn: () => apiRequest("GET", "/api/deals").then((r) => r.json()),
  });

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    queryFn: () => apiRequest("GET", "/api/stats").then((r) => r.json()),
  });

  const filtered = useMemo(() => {
    let result = allDeals.filter((d) => {
      if (stage !== "all" && d.stage !== stage) return false;
      if (sector !== "all" && d.sector !== sector) return false;
      if (region !== "all" && d.region !== region) return false;
      if (search && !d.company.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    result = [...result].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (av < bv) return sortDir;
      if (av > bv) return -sortDir;
      return 0;
    });
    return result;
  }, [allDeals, stage, sector, region, search, sortKey, sortDir]);

  const handleSort = (key: keyof Deal) => {
    if (key === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(-1); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <HeroSection stats={stats} loading={statsLoading} />
      <FilterBar
        stage={stage} setStage={setStage}
        sector={sector} setSector={setSector}
        region={region} setRegion={setRegion}
        search={search} setSearch={setSearch}
      />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-10">
        <ChartsGrid stats={stats} filtered={filtered} loading={statsLoading} />
        <DealsTable
          deals={filtered}
          loading={dealsLoading}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
        />
        <SectorCards stats={stats} filtered={filtered} loading={statsLoading} />
        <PipelineStatus />
      </main>
      <footer className="border-t border-border mt-16 py-10 px-6 bg-card/30">
        <div className="max-w-[1400px] mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span className="font-semibold text-foreground text-sm">AI Capital Flows</span>
              <span className="ml-2 text-xs text-muted-foreground">Seed · Series A · Series B · Jan 1, 2026 – present</span>
            </div>
            <span className="text-xs text-muted-foreground">Built by <span className="text-foreground font-medium">Priyanka Savjani</span></span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
            <span className="font-medium text-foreground">Methodology:</span> Deals aggregated daily from 16 primary sources including TechCrunch, VentureBeat, BusinessWire, PR Newswire, Globe Newswire, Bloomberg Technology, Crunchbase News, EU-Startups, Tech.eu, The Information, StrictlyVC, Axios Technology, and regional wires. AI relevance and deal metadata (stage, sector, lead investor) extracted via GPT-4o. Only Seed, Series A, and Series B rounds included. Deduplication applied. Updates run automatically at 07:00 UTC daily.
          </p>
        </div>
      </footer>
    </div>
  );
}
