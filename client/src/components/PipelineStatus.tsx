import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PipelineRun } from "@shared/schema";

export function PipelineStatus() {
  const { data: runs = [], isLoading } = useQuery<PipelineRun[]>({
    queryKey: ["/api/pipeline/runs"],
    queryFn: () => apiRequest("GET", "/api/pipeline/runs").then((r) => r.json()),
  });

  const triggerMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/pipeline/run"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pipeline/runs"] });
    },
  });

  const latest = runs[0];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-lg">Pipeline Status</h2>
          <p className="text-xs text-muted-foreground">Daily data refresh · Runs automatically at 07:00 UTC</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => triggerMutation.mutate()}
          disabled={triggerMutation.isPending}
          data-testid="button-run-pipeline"
          className="gap-1.5 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${triggerMutation.isPending ? "animate-spin" : ""}`} />
          {triggerMutation.isPending ? "Running..." : "Run Now"}
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : latest ? (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            {latest.status === "ok" || latest.status === "partial" ? (
              <CheckCircle className="w-4 h-4 text-primary" />
            ) : (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
            <span className="text-xs font-semibold capitalize">{latest.status}</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {latest.ranAt ? new Date((latest.ranAt as unknown as number) * 1000).toLocaleString() : "—"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-display">{latest.dealsFound ?? 0}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Articles scanned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display text-primary">{latest.dealsAdded ?? 0}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">New deals added</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display">{latest.sources ? JSON.parse(latest.sources).length : 0}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Sources checked</div>
            </div>
          </div>
          {latest.error && (
            <p className="text-xs text-destructive mt-3 bg-destructive/10 rounded px-3 py-2">{latest.error}</p>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-5 text-center text-sm text-muted-foreground">
          No pipeline runs yet. Click "Run Now" to trigger the first scan, or add your <code className="text-xs bg-border px-1 rounded">OPENAI_API_KEY</code> to enable automatic runs.
        </div>
      )}
    </section>
  );
}
