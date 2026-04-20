import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const deals = sqliteTable("deals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  company: text("company").notNull(),
  amount: real("amount").notNull(),
  stage: text("stage").notNull(),          // Seed | Series A | Series B
  sector: text("sector").notNull(),
  subsector: text("subsector"),
  lead: text("lead").notNull(),
  valuation: real("valuation"),
  date: text("date").notNull(),            // YYYY-MM-DD
  location: text("location"),
  region: text("region"),
  description: text("description"),
  source: text("source"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const pendingDeals = sqliteTable("pending_deals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  company: text("company").notNull(),
  amount: real("amount").notNull(),
  stage: text("stage").notNull(),
  sector: text("sector").notNull(),
  lead: text("lead").notNull(),
  region: text("region"),
  location: text("location"),
  description: text("description"),
  source: text("source"),
  submitterEmail: text("submitter_email"),
  token: text("token").notNull(),          // approve/reject token
  status: text("status").default("pending"), // pending | approved | rejected
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type PendingDeal = typeof pendingDeals.$inferSelect;

export const pipelineRuns = sqliteTable("pipeline_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ranAt: integer("ran_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  dealsFound: integer("deals_found").default(0),
  dealsAdded: integer("deals_added").default(0),
  sources: text("sources"),               // JSON array of sources checked
  status: text("status").default("ok"),   // ok | error
  error: text("error"),
});

export const insertDealSchema = createInsertSchema(deals).omit({ id: true, createdAt: true });
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;
export type PipelineRun = typeof pipelineRuns.$inferSelect;
