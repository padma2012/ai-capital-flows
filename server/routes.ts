import type { Express } from "express";
import type { Server } from "http";
import { storage, pendingStorage } from "./storage";
import { runPipeline } from "./pipeline";
import { insertDealSchema } from "@shared/schema";
import { Resend } from "resend";
import { randomBytes } from "crypto";

const ADMIN_EMAIL = "savjanipriyanka@gmail.com";
function getResend() { return new Resend(process.env.RESEND_API_KEY || "no-key"); }

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

  // Public deal submission — held for approval, email sent to admin
  app.post("/api/deals/submit", async (req, res) => {
    const { company, amount, stage, sector, lead, region, location, description, source, submitterEmail } = req.body;
    if (!company || !amount || !stage) {
      return res.status(400).json({ error: "company, amount and stage are required" });
    }
    const raw = String(amount).replace(/[^0-9.]/g, "");
    const multiplier = /[Bb]/.test(String(amount)) ? 1000 : 1;
    const parsedAmount = parseFloat(raw) * multiplier;
    if (isNaN(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ error: "Invalid amount" });

    const token = randomBytes(32).toString("hex");
    const baseUrl = process.env.BASE_URL || `https://ai-capital-flows-production.up.railway.app`;

    pendingStorage.insert({
      company: String(company).trim(),
      amount: parsedAmount,
      stage: String(stage),
      sector: String(sector || "Enterprise AI"),
      lead: String(lead || "Undisclosed"),
      region: String(region || "North America"),
      location: String(location || ""),
      description: String(description || ""),
      source: String(source || ""),
      submitterEmail: String(submitterEmail || ""),
      token,
    });

    const approveUrl = `${baseUrl}/api/deals/approve?token=${token}`;
    const rejectUrl = `${baseUrl}/api/deals/reject?token=${token}`;
    const amountStr = parsedAmount >= 1000 ? `$${(parsedAmount/1000).toFixed(1)}B` : `$${parsedAmount}M`;

    await getResend().emails.send({
      from: "AI Capital Flows <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject: `New deal submission: ${company} (${amountStr} ${stage})`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="margin:0 0 4px">New Deal Submission</h2>
          <p style="color:#888;margin:0 0 24px">Submitted via AI Capital Flows — awaiting your approval</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#888;width:140px">Company</td><td style="padding:8px 0;font-weight:600">${company}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Amount</td><td style="padding:8px 0">${amountStr}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Stage</td><td style="padding:8px 0">${stage}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Sector</td><td style="padding:8px 0">${sector || "—"}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Lead Investor</td><td style="padding:8px 0">${lead || "—"}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Region</td><td style="padding:8px 0">${region || "—"}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Location</td><td style="padding:8px 0">${location || "—"}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Description</td><td style="padding:8px 0">${description || "—"}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Source URL</td><td style="padding:8px 0">${source ? `<a href="${source}">${source}</a>` : "—"}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Submitter</td><td style="padding:8px 0">${submitterEmail || "Anonymous"}</td></tr>
          </table>
          <div style="margin-top:32px;display:flex;gap:12px">
            <a href="${approveUrl}" style="display:inline-block;padding:12px 28px;background:#10b981;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">✓ Approve &amp; Publish</a>
            <a href="${rejectUrl}" style="display:inline-block;padding:12px 28px;background:#ef4444;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">✗ Reject</a>
          </div>
          <p style="margin-top:24px;color:#aaa;font-size:12px">AI Capital Flows · savjanipriyanka@gmail.com</p>
        </div>
      `,
    });

    res.status(201).json({ ok: true });
  });

  // Approve a pending deal — one-click from email
  app.get("/api/deals/approve", (req, res) => {
    const { token } = req.query as { token: string };
    if (!token) return res.status(400).send("Missing token");
    const pending = pendingStorage.getByToken(token);
    if (!pending) return res.status(404).send("Submission not found");
    if (pending.status !== "pending") return res.send(`<h2>Already ${pending.status}.</h2>`);
    storage.insertDeal({
      company: pending.company,
      amount: pending.amount,
      stage: pending.stage,
      sector: pending.sector,
      lead: pending.lead,
      region: pending.region ?? undefined,
      location: pending.location ?? undefined,
      description: pending.description ?? undefined,
      source: pending.source ?? undefined,
      date: new Date().toISOString().split("T")[0],
    });
    pendingStorage.approve(token);
    res.send(`<html><body style="font-family:sans-serif;max-width:500px;margin:80px auto;text-align:center"><h2 style="color:#10b981">✓ Deal Published</h2><p><strong>${pending.company}</strong> has been added to AI Capital Flows.</p><a href="https://ai-capital-flows-production.up.railway.app" style="color:#10b981">View Dashboard →</a></body></html>`);
  });

  // Reject a pending deal
  app.get("/api/deals/reject", (req, res) => {
    const { token } = req.query as { token: string };
    if (!token) return res.status(400).send("Missing token");
    const pending = pendingStorage.getByToken(token);
    if (!pending) return res.status(404).send("Submission not found");
    if (pending.status !== "pending") return res.send(`<h2>Already ${pending.status}.</h2>`);
    pendingStorage.reject(token);
    res.send(`<html><body style="font-family:sans-serif;max-width:500px;margin:80px auto;text-align:center"><h2 style="color:#ef4444">✗ Deal Rejected</h2><p><strong>${pending.company}</strong> has been rejected and will not appear on the dashboard.</p><a href="https://ai-capital-flows-production.up.railway.app" style="color:#10b981">View Dashboard →</a></body></html>`);
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
