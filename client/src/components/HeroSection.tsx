import type { Stats } from "@/pages/Dashboard";
import { Skeleton } from "@/components/ui/skeleton";

function StatBlock({ label, value, loading }: { label: string; value: string; loading?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      {loading ? (
        <Skeleton className="h-10 w-32" />
      ) : (
        <span className="font-display text-4xl sm:text-5xl font-normal text-foreground">{value}</span>
      )}
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

function Divider() {
  return <div className="hidden sm:block w-px h-12 bg-border" />;
}

export function HeroSection({ stats, loading }: { stats?: Stats; loading: boolean }) {
  const totalB = stats ? (stats.totalCapital / 1000).toFixed(2) : "—";
  const avg = stats && stats.totalDeals ? Math.round(stats.totalCapital / stats.totalDeals) : "—";

  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-card to-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <p className="text-xs uppercase tracking-[0.2em] text-primary mb-4">VC Intelligence Report</p>
        <h1 className="font-display text-4xl sm:text-6xl font-normal leading-tight mb-4">
          Where the Smart Money<br /><em className="text-primary not-italic">Moved This Quarter</em>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg mb-10 max-w-xl">
          {loading ? "Loading..." : `${stats?.totalDeals ?? "—"} AI companies · $${totalB}B+ raised · Updated daily`}
        </p>
        <div className="flex flex-wrap gap-8 sm:gap-12 items-center">
          <StatBlock label="Deals Tracked" value={String(stats?.totalDeals ?? "—")} loading={loading} />
          <Divider />
          <StatBlock label="Total Deployed" value={`$${totalB}B+`} loading={loading} />
          <Divider />
          <StatBlock label="Avg Deal Size" value={avg === "—" ? "—" : `$${avg}M`} loading={loading} />
          <Divider />
          <StatBlock label="Sectors Covered" value={stats ? String(stats.sectorTotals.length) : "—"} loading={loading} />
        </div>
      </div>
    </section>
  );
}
