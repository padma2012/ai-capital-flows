import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { deals, pipelineRuns, pendingDeals, type Deal, type InsertDeal, type PipelineRun, type PendingDeal } from "@shared/schema";
import { desc, eq, gte, lte, and, like, sql } from "drizzle-orm";
import path from "path";

const dbPath = path.join(process.cwd(), "data.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// Create tables if not exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    amount REAL NOT NULL,
    stage TEXT NOT NULL,
    sector TEXT NOT NULL,
    subsector TEXT,
    lead TEXT NOT NULL,
    valuation REAL,
    date TEXT NOT NULL,
    location TEXT,
    region TEXT,
    description TEXT,
    source TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );
  CREATE TABLE IF NOT EXISTS pending_deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    amount REAL NOT NULL,
    stage TEXT NOT NULL,
    sector TEXT NOT NULL,
    lead TEXT NOT NULL,
    region TEXT,
    location TEXT,
    description TEXT,
    source TEXT,
    submitter_email TEXT,
    token TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at INTEGER DEFAULT (unixepoch())
  );
  CREATE TABLE IF NOT EXISTS pipeline_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ran_at INTEGER DEFAULT (unixepoch()),
    deals_found INTEGER DEFAULT 0,
    deals_added INTEGER DEFAULT 0,
    sources TEXT,
    status TEXT DEFAULT 'ok',
    error TEXT
  );
`);

export interface IStorage {
  getAllDeals(filters?: { stage?: string; sector?: string; region?: string; search?: string }): Deal[];
  getDealById(id: number): Deal | undefined;
  insertDeal(deal: InsertDeal): Deal;
  dealExists(company: string, date: string): boolean;
  getStats(): { totalDeals: number; totalCapital: number; lastUpdated: string | null };
  logPipelineRun(run: { dealsFound: number; dealsAdded: number; sources: string[]; status: string; error?: string }): void;
  getRecentRuns(limit?: number): PipelineRun[];
}

export const storage: IStorage = {
  getAllDeals(filters = {}) {
    let query = db.select().from(deals);
    const conditions = [];
    if (filters.stage && filters.stage !== "all") conditions.push(eq(deals.stage, filters.stage));
    if (filters.sector && filters.sector !== "all") conditions.push(eq(deals.sector, filters.sector));
    if (filters.region && filters.region !== "all") conditions.push(eq(deals.region, filters.region));
    if (filters.search) conditions.push(like(deals.company, `%${filters.search}%`));
    if (conditions.length > 0) {
      return db.select().from(deals).where(and(...conditions)).orderBy(desc(deals.date)).all();
    }
    return db.select().from(deals).orderBy(desc(deals.date)).all();
  },

  getDealById(id) {
    return db.select().from(deals).where(eq(deals.id, id)).get();
  },

  insertDeal(deal) {
    return db.insert(deals).values(deal).returning().get();
  },

  dealExists(company, date) {
    const result = db.select({ id: deals.id }).from(deals)
      .where(and(eq(deals.company, company), eq(deals.date, date))).get();
    return !!result;
  },

  getStats() {
    const all = db.select().from(deals).all();
    const totalCapital = all.reduce((s, d) => s + d.amount, 0);
    const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
    return {
      totalDeals: all.length,
      totalCapital,
      lastUpdated: sorted[0]?.date ?? null,
    };
  },

  logPipelineRun({ dealsFound, dealsAdded, sources, status, error }) {
    db.insert(pipelineRuns).values({
      dealsFound,
      dealsAdded,
      sources: JSON.stringify(sources),
      status,
      error: error ?? null,
    }).run();
  },

  getRecentRuns(limit = 10) {
    return db.select().from(pipelineRuns).orderBy(desc(pipelineRuns.ranAt)).limit(limit).all();
  },
};

// Pending deal helpers (outside IStorage — admin only)
export const pendingStorage = {
  insert(data: Omit<PendingDeal, "id" | "createdAt" | "status">) {
    sqlite.prepare(`
      INSERT INTO pending_deals (company, amount, stage, sector, lead, region, location, description, source, submitter_email, token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(data.company, data.amount, data.stage, data.sector, data.lead, data.region ?? "", data.location ?? "", data.description ?? "", data.source ?? "", data.submitterEmail ?? "", data.token);
  },

  getByToken(token: string): PendingDeal | undefined {
    const row = sqlite.prepare("SELECT * FROM pending_deals WHERE token = ?").get(token) as any;
    if (!row) return undefined;
    return { ...row, submitterEmail: row.submitter_email, createdAt: new Date(row.created_at * 1000) };
  },

  approve(token: string) {
    sqlite.prepare("UPDATE pending_deals SET status = 'approved' WHERE token = ?").run(token);
  },

  reject(token: string) {
    sqlite.prepare("UPDATE pending_deals SET status = 'rejected' WHERE token = ?").run(token);
  },
};
