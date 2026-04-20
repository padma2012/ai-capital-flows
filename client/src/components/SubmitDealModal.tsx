import { useState } from "react";
import { PlusCircle, X, CheckCircle } from "lucide-react";

const SECTORS = [
  "AI Infrastructure", "Foundation Models", "Enterprise AI", "Developer Tools",
  "Security AI", "Healthcare AI", "Robotics & Physical AI", "Consumer AI", "Other"
];
const STAGES = ["Pre-Seed", "Seed", "Series A", "Series B"];
const REGIONS = ["North America", "Europe", "Israel", "Asia", "Middle East", "Latin America", "Africa"];

export function SubmitDealButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-semibold transition-colors"
      >
        <PlusCircle className="w-4 h-4" />
        Submit a Deal
      </button>
      {open && <SubmitDealModal onClose={() => setOpen(false)} />}
    </>
  );
}

function SubmitDealModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    company: "", amount: "", stage: "Seed", sector: "AI Infrastructure",
    lead: "", region: "North America", location: "", description: "", source: "", submitterEmail: ""
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company || !form.amount || !form.stage) {
      setError("Company, amount and stage are required.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/deals/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Submission failed. Please try again.");
    }
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,overflowY:"auto",background:"rgba(0,0,0,0.6)"}} onClick={onClose}>
      <div style={{margin:"40px auto",maxWidth:"520px",width:"calc(100% - 32px)",position:"relative"}} className="bg-card border border-border rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="font-semibold text-base">Submit a Deal</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Know a deal we missed? Add it to the tracker.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {status === "success" ? (
          <div className="px-6 py-12 flex flex-col items-center gap-4 text-center">
            <CheckCircle className="w-12 h-12 text-primary" />
            <h3 className="font-semibold text-lg">Deal Submitted</h3>
            <p className="text-sm text-muted-foreground max-w-xs">Thanks — we'll review and add it to the tracker within 24 hours.</p>
            <button onClick={onClose} className="mt-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 py-5 space-y-4">
            {/* Company + Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Company *</label>
                <input value={form.company} onChange={set("company")} placeholder="e.g. Acme AI"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Amount (USD) *</label>
                <input value={form.amount} onChange={set("amount")} placeholder="e.g. 25M or 25000000"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
            </div>

            {/* Stage + Sector */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Stage *</label>
                <select value={form.stage} onChange={set("stage")}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors">
                  {STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Sector</label>
                <select value={form.sector} onChange={set("sector")}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors">
                  {SECTORS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Lead + Region */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Lead Investor</label>
                <input value={form.lead} onChange={set("lead")} placeholder="e.g. Sequoia Capital"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Region</label>
                <select value={form.region} onChange={set("region")}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors">
                  {REGIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">City, Country</label>
              <input value={form.location} onChange={set("location")} placeholder="e.g. San Francisco, CA"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">What do they build?</label>
              <textarea value={form.description} onChange={set("description")} rows={2}
                placeholder="One sentence describing the company..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
            </div>

            {/* Source + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Source URL</label>
                <input value={form.source} onChange={set("source")} placeholder="https://..."
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Your Email (optional)</label>
                <input value={form.submitterEmail} onChange={set("submitterEmail")} placeholder="you@example.com"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex items-center justify-between pt-2">
              <p className="text-[10px] text-muted-foreground">Submissions reviewed before going live.</p>
              <button type="submit" disabled={status === "loading"}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {status === "loading" ? "Submitting..." : "Submit Deal"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
