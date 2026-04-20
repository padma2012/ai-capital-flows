import { TrendingUp } from "lucide-react";

export function Header() {
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">AI Capital Flows</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">Seed · Series A · Series B</div>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Report Period</div>
          <div className="text-xs font-semibold">Jan 1, 2026 — {today}</div>
        </div>
      </div>
    </header>
  );
}
