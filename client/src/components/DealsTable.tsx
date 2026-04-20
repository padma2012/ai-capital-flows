import { useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { Deal } from "@shared/schema";

const STAGE_CLASS: Record<string, string> = {
  "Pre-Seed":   "badge-preSeed",
  "Seed":       "badge-seed",
  "Series A":   "badge-seriesA",
  "Series B":   "badge-seriesB",
  "Series C":   "badge-seriesC",
  "Series D":   "badge-seriesD",
  "Series E":   "badge-seriesE",
  "Series F":   "badge-seriesF",
  "Series G":   "badge-seriesG",
  "Growth":     "badge-growth",
  "Mega Round": "badge-mega",
};
const REGION_FLAG: Record<string, string> = {
  "North America": "🇺🇸", Europe: "🇪🇺", Israel: "🇮🇱", Asia: "🌏",
  "Middle East": "🌍", "Latin America": "🌎", Africa: "🌍",
};

function SortIcon({ col, active, dir }: { col: string; active: boolean; dir: 1 | -1 }) {
  if (!active) return <ChevronsUpDown className="w-3 h-3 inline ml-1 opacity-30" />;
  return dir === -1 ? <ChevronDown className="w-3 h-3 inline ml-1" /> : <ChevronUp className="w-3 h-3 inline ml-1" />;
}

function Th({ children, col, sortKey, sortDir, onSort }: { children: React.ReactNode; col: keyof Deal; sortKey: keyof Deal; sortDir: 1 | -1; onSort: (k: keyof Deal) => void }) {
  return (
    <th
      className="text-left text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-3 cursor-pointer whitespace-nowrap hover:text-foreground transition-colors"
      onClick={() => onSort(col)}
    >
      {children}
      <SortIcon col={col} active={sortKey === col} dir={sortDir} />
    </th>
  );
}

interface DealsTableProps {
  deals: Deal[];
  loading: boolean;
  sortKey: keyof Deal;
  sortDir: 1 | -1;
  onSort: (key: keyof Deal) => void;
}

export function DealsTable({ deals, loading, sortKey, sortDir, onSort }: DealsTableProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggle = (id: number) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="font-semibold text-lg">Deal Log</h2>
          <p className="text-xs text-muted-foreground">Click any row to expand · Sort by any column</p>
        </div>
        <span className="text-sm text-muted-foreground">{deals.length} deal{deals.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card">
              <tr>
                <Th col="company" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Company</Th>
                <Th col="amount" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Amount</Th>
                <Th col="stage" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Stage</Th>
                <Th col="sector" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Sector</Th>
                <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-3 whitespace-nowrap">Lead Investor</th>
                <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-3">What They Build</th>
                <Th col="region" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Region</Th>
                <Th col="date" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Date</Th>
                <Th col="valuation" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Val.</Th>
                <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-3 whitespace-nowrap">Source</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : deals.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-muted-foreground text-sm">No deals match the current filters</td>
                </tr>
              ) : (
                deals.map((deal) => (
                  <>
                    <tr
                      key={deal.id}
                      data-testid={`row-deal-${deal.id}`}
                      className="border-t border-border hover:bg-card/60 cursor-pointer transition-colors"
                      onClick={() => toggle(deal.id!)}
                    >
                      <td className="px-3 py-3 font-semibold text-xs">{deal.company}</td>
                      <td className="px-3 py-3 text-xs font-mono text-accent font-semibold">${deal.amount >= 1000 ? `${(deal.amount / 1000).toFixed(1)}B` : `${deal.amount}M`}</td>
                      <td className="px-3 py-3">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", STAGE_CLASS[deal.stage] || "")}>
                          {deal.stage}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{deal.sector?.replace(" & Physical AI", "")}</td>
                      <td className="px-3 py-3 text-xs max-w-[160px] truncate text-muted-foreground">{deal.lead}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground max-w-[260px]">
                        <span className="line-clamp-2 leading-relaxed">{deal.description || "—"}</span>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{REGION_FLAG[deal.region || ""] || "🌐"} {deal.location}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(deal.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{deal.valuation ? `$${(deal.valuation / 1000).toFixed(1)}B` : "—"}</td>
                      <td className="px-3 py-3 text-xs">
                        {deal.source ? (
                          <a href={deal.source} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}>
                            <ExternalLink className="w-3 h-3" /> View
                          </a>
                        ) : "—"}
                      </td>
                    </tr>
                    {expanded === deal.id && (
                      <tr key={`expand-${deal.id}`} className="border-t border-border bg-card/40">
                        <td colSpan={10} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                              {deal.description || "No description available."}
                            </p>
                            {deal.source && (
                              <a
                                href={deal.source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Source <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
