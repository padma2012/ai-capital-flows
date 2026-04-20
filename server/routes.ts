import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { runPipeline } from "./pipeline";
import { insertDealSchema } from "@shared/schema";

export function registerRoutes(httpServer: Server, app: Express) {
  // GET /api/deals — list with optional filters
  app.get("/api/deals", (req, res) => {
    const { stage, sector, region, search } = req.query as Record<string, string>;
    const deals = storage.getAllDeals({ stage, sector, region, search });
    res.json(deals);
  });

  // GET /api/stats — hero KPIs
  app.get("/api/stats", (_req, res) => {
    const stats = storage.getStats();
    const deals = storage.getAllDeals();

    // Sector totals
    const sectorMap: Record<string, { total: number; count: number }> = {};
    deals.forEach((d) => {
      if (!sectorMap[d.sector]) sectorMap[d.sector] = { total: 0, count: 0 };
      sectorMap[d.sector].total += d.amount;
      sectorMap[d.sector].count++;
    });
    const sectorTotals = Object.entries(sectorMap)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([sector, data]) => ({ sector, ...data }));

    // Stage counts
    const stageMap: Record<string, number> = {};
    deals.forEach((d) => { stageMap[d.stage] = (stageMap[d.stage] || 0) + 1; });
    const stageCounts = Object.entries(stageMap).map(([stage, count]) => ({ stage, count }));

    // Region counts
    const regionMap: Record<string, number> = {};
    deals.forEach((d) => { regionMap[d.region || "Unknown"] = (regionMap[d.region || "Unknown"] || 0) + 1; });
    const regionCounts = Object.entries(regionMap)
      .sort((a, b) => b[1] - a[1])
      .map(([region, count]) => ({ region, count }));

    // Top investors
    const investorMap: Record<string, { total: number; count: number; companies: string[] }> = {};
    deals.forEach((d) => {
      if (!d.lead || d.lead === "Undisclosed") return;
      const leads = d.lead.split(/\s*[&,]\s*/).map(l => l.trim()).filter(Boolean);
      const share = d.amount / leads.length; // split amount evenly among co-leads
      leads.forEach((name) => {
        if (!investorMap[name]) investorMap[name] = { total: 0, count: 0, companies: [] };
        investorMap[name].total += share;
        investorMap[name].count++;
        if (!investorMap[name].companies.includes(d.company)) {
          investorMap[name].companies.push(d.company);
        }
      });
    });
    const topInvestors = Object.entries(investorMap)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([investor, data]) => ({ investor, ...data }));

    res.json({ ...stats, sectorTotals, stageCounts, regionCounts, topInvestors });
  });

  // GET /api/pipeline/runs — recent pipeline run history
  app.get("/api/pipeline/runs", (_req, res) => {
    const runs = storage.getRecentRuns(20);
    res.json(runs);
  });

  // POST /api/pipeline/run — manually trigger pipeline (admin)
  app.post("/api/pipeline/run", async (_req, res) => {
    try {
      const result = await runPipeline();
      res.json({ ok: true, ...result });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // POST /api/deals — manually add a deal
  app.post("/api/deals", (req, res) => {
    const parsed = insertDealSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const deal = storage.insertDeal(parsed.data);
    res.status(201).json(deal);
  });

  // Vercel Cron endpoint — called daily at 7am UTC
  // In vercel.json: { "crons": [{ "path": "/api/cron/daily", "schedule": "0 7 * * *" }] }
  app.get("/api/cron/daily", async (req, res) => {
    // Verify Vercel cron signature in production
    const authHeader = req.headers["authorization"];
    if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const result = await runPipeline();
      res.json({ ok: true, ...result });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });
}
