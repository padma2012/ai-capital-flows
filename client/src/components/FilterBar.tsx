import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STAGES = ["all", "Pre-Seed", "Seed", "Series A", "Series B"];
const SECTORS = ["all", "AI Infrastructure", "Foundation Models", "Robotics & Physical AI", "Developer Tools", "Healthcare AI", "Security AI", "Enterprise AI", "Consumer AI"];
const SECTOR_LABELS: Record<string, string> = {
  "all": "All Sectors", "AI Infrastructure": "Infrastructure", "Foundation Models": "Foundation Models",
  "Robotics & Physical AI": "Robotics", "Developer Tools": "Dev Tools",
  "Healthcare AI": "Healthcare", "Security AI": "Security", "Enterprise AI": "Enterprise AI", "Consumer AI": "Consumer AI",
};
const REGIONS = ["all", "North America", "Europe", "Israel", "Asia", "Middle East", "Latin America", "Africa"];
const REGION_FLAGS: Record<string, string> = { "all": "", "North America": "🇺🇸", "Europe": "🇪🇺", "Israel": "🇮🇱", "Asia": "🌏", "Middle East": "🌍", "Latin America": "🌎", "Africa": "🌍" };

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
        active
          ? "bg-primary/20 border-primary text-primary"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground bg-transparent"
      )}
    >
      {children}
    </button>
  );
}

interface FilterBarProps {
  stage: string; setStage: (v: string) => void;
  sector: string; setSector: (v: string) => void;
  region: string; setRegion: (v: string) => void;
  search: string; setSearch: (v: string) => void;
}

export function FilterBar({ stage, setStage, sector, setSector, region, setRegion, search, setSearch }: FilterBarProps) {
  return (
    <div className="sticky top-14 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider mr-1 shrink-0">Stage</span>
          {STAGES.map((s) => (
            <FilterChip key={s} active={stage === s} onClick={() => setStage(s)}>
              {s === "all" ? "All Stages" : s}
            </FilterChip>
          ))}
          <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider mr-1 shrink-0">Sector</span>
          {SECTORS.map((s) => (
            <FilterChip key={s} active={sector === s} onClick={() => setSector(s)}>
              {SECTOR_LABELS[s]}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider mr-1 shrink-0">Region</span>
          {REGIONS.map((r) => (
            <FilterChip key={r} active={region === r} onClick={() => setRegion(r)}>
              {REGION_FLAGS[r]} {r === "all" ? "All Regions" : r}
            </FilterChip>
          ))}
          <div className="ml-auto relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company..."
              className="pl-8 h-7 text-xs w-44 bg-card border-border"
              data-testid="input-search"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
