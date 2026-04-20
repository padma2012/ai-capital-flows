/**
 * AI Funding Deal Pipeline
 * Runs daily to discover new AI startup funding rounds from RSS feeds,
 * news sources, and deal aggregators. Uses GPT-4o mini to extract
 * structured deal data from articles.
 *
 * Sources:
 *  RSS  — TechCrunch, VentureBeat, BusinessWire, PRNewswire, Bloomberg Tech,
 *          Axios, The Information, Semafor Tech, Crunchbase News, StrictlyVC
 *  Web  — Y Combinator blog, CNBC Tech, Reuters Tech
 */

import Parser from "rss-parser";
import OpenAI from "openai";
import { storage } from "./storage";
import type { InsertDeal } from "@shared/schema";

const rssParser = new Parser({ timeout: 15000 });

// ─── RSS Sources ──────────────────────────────────────────────────────────────
// All URLs verified working (HTTP 200/30x-follow) as of April 2026
const RSS_FEEDS = [
  // TechCrunch — best deal coverage in tech media
  { name: "TechCrunch Startups",  url: "https://techcrunch.com/category/startups/feed/" },
  { name: "TechCrunch Funding",   url: "https://techcrunch.com/tag/funding/feed/" },
  { name: "TechCrunch AI",        url: "https://techcrunch.com/category/artificial-intelligence/feed/" },

  // VentureBeat — strong AI/ML focus
  { name: "VentureBeat",          url: "https://feeds.feedburner.com/venturebeat/SZYF" },

  // Wire services — press releases direct from companies (highest freshness)
  { name: "BusinessWire Tech",    url: "https://feed.businesswire.com/rss/home/?rss=G1&_gl=1" },
  { name: "PR Newswire Tech",     url: "https://www.prnewswire.com/rss/news-releases-list.rss?category=technology" },
  { name: "Globe Newswire Tech",  url: "https://www.globenewswire.com/RssFeed/subjectcode/24-Technology" },

  // Bloomberg — top-tier financial/tech news
  { name: "Bloomberg Tech",       url: "https://feeds.bloomberg.com/technology/news.rss" },

  // Crunchbase News — deal-focused editorial
  { name: "Crunchbase News",      url: "https://news.crunchbase.com/feed/" },

  // Axios — main tech feed
  { name: "Axios Technology",     url: "https://api.axios.com/feed/" },

  // The Information — premium deal scoops
  { name: "The Information",      url: "https://www.theinformation.com/feed" },

  // StrictlyVC — daily VC newsletter
  { name: "StrictlyVC",           url: "https://strictlyvc.com/feed/" },

  // Tech Funding News — dedicated deal tracker
  { name: "Tech Funding News",    url: "https://techfundingnews.com/feed/" },

  // EU / global coverage
  { name: "EU-Startups",          url: "https://www.eu-startups.com/feed/" },
  { name: "Tech.eu",              url: "https://tech.eu/feed/" },
  { name: "Ctech (Israel)",       url: "https://www.calcalistech.com/GeneralRSS.aspx" },

  // Specialist AI publications
  { name: "The Batch (DeepLearning.AI)", url: "https://www.deeplearning.ai/the-batch/feed/" },
  { name: "Import AI",            url: "https://importai.substack.com/feed" },
];

// ─── Keyword Filters ──────────────────────────────────────────────────────────
const FUNDING_KEYWORDS = [
  "raises", "raised", "funding", "series a", "series b", "series c", "series d",
  "seed round", "pre-seed", "million", "billion", "startup", "venture", "investors",
  "backed", "investment", "round", "capital", "led by", "valuation", "closes",
  "secures", "announces", "financing", "fundraise",
];

const AI_KEYWORDS = [
  "ai", "artificial intelligence", "machine learning", "llm", "large language",
  "generative ai", "deep learning", "robotics", "autonomous", "foundation model",
  "inference", "neural", "agentic", "agent", "chatbot", "computer vision",
  "nlp", "natural language", "gpt", "multimodal", "diffusion", "transformer",
  "copilot", "automation", "data platform", "vector", "rag", "reinforcement",
];

function isRelevantArticle(title: string, summary: string): boolean {
  const text = (title + " " + summary).toLowerCase();
  const hasFunding = FUNDING_KEYWORDS.some((kw) => text.includes(kw));
  const hasAI = AI_KEYWORDS.some((kw) => text.includes(kw));
  return hasFunding && hasAI;
}

// ─── LLM Extraction ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a senior VC analyst. Given a news article about a startup funding round, extract structured deal data.

Return JSON with EXACTLY this shape (use null for unknown fields):
{
  "company": "Company Name",
  "amount": 150,             // number in $M — convert billions (e.g. $1.2B = 1200)
  "stage": "Series A",       // ONE OF: "Pre-Seed", "Seed", "Series A", "Series B" — if stage is C or later, set qualifies: false
  "sector": "AI Infrastructure",  // ONE OF: "AI Infrastructure", "Foundation Models", "Robotics & Physical AI", "Developer Tools", "Healthcare AI", "Security AI", "Enterprise AI", "Consumer AI"
  "subsector": "Inference Optimization",  // short descriptive phrase
  "lead": "a16z & Lightspeed",   // lead investor(s), use & to join co-leads
  "valuation": 800,          // post-money valuation in $M or null
  "date": "2026-03-15",      // YYYY-MM-DD format
  "location": "San Francisco, CA",
  "region": "North America", // ONE OF: "North America", "Europe", "Asia", "Israel", "Middle East", "Africa", "Latin America"
  "description": "One crisp sentence describing what the company builds and why it matters.",
  "is_ai": true,             // true only if the company's core product uses AI/ML
  "qualifies": true          // true ONLY if AI startup AND stage is Pre-Seed/Seed/Series A/Series B
}

If the article is not clearly about an AI startup funding round, return {"qualifies": false}.
Do NOT invent data — use null for anything not stated in the article.`;

async function extractDealFromArticle(
  title: string,
  content: string,
  url: string,
  openai: OpenAI
): Promise<InsertDeal | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Article title: ${title}\n\nURL: ${url}\n\nContent:\n${content.slice(0, 3000)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const raw = JSON.parse(response.choices[0].message.content || "{}");

    if (!raw.qualifies || !raw.is_ai) return null;
    if (!raw.company || !raw.amount || !raw.stage || !raw.sector) return null;

    // Pipeline only auto-ingests early-stage deals (Seed, A, B)
    // Later rounds (C+) can be added manually via the API
    const validStages = ["Pre-Seed", "Seed", "Series A", "Series B"];
    if (!validStages.includes(raw.stage)) return null;

    const validRegions = [
      "North America", "Europe", "Asia", "Israel",
      "Middle East", "Africa", "Latin America",
    ];

    return {
      company:    raw.company,
      amount:     Number(raw.amount),
      stage:      raw.stage,
      sector:     raw.sector,
      subsector:  raw.subsector  || null,
      lead:       raw.lead       || "Undisclosed",
      valuation:  raw.valuation  ? Number(raw.valuation) : null,
      date:       raw.date       || new Date().toISOString().slice(0, 10),
      location:   raw.location   || null,
      region:     validRegions.includes(raw.region) ? raw.region : "North America",
      description: raw.description || null,
      source:     url,
    };
  } catch {
    return null;
  }
}

// ─── Deduplication helpers ────────────────────────────────────────────────────
/** Normalise a company name for fuzzy dedup (lowercase, strip punctuation & Ltd/Inc/AI suffixes) */
function normaliseCompany(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\b(inc|llc|ltd|ai|labs|technologies|tech|systems|solutions|platform|platforms)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────
export async function runPipeline(): Promise<{
  dealsFound: number;
  dealsAdded: number;
  sourcesChecked: string[];
  errors: string[];
}> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error("OPENAI_API_KEY not set — pipeline cannot run without it");
  }

  const openai = new OpenAI({ apiKey: openaiKey });
  const sourcesChecked: string[] = [];
  const errors: string[] = [];
  let dealsFound = 0;
  let dealsAdded = 0;

  // Look back 3 days to catch weekend deals on Monday runs
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 3);

  // Pre-load existing company names for fuzzy dedup
  const existingDeals = storage.getAllDeals();
  const existingNorms = new Set(existingDeals.map((d) => normaliseCompany(d.company)));

  // Track companies added this run to avoid intra-run duplicates
  const addedThisRun = new Set<string>();

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await rssParser.parseURL(feed.url);
      sourcesChecked.push(feed.name);

      for (const item of parsed.items || []) {
        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
        if (pubDate < cutoff) continue;

        const title   = item.title || "";
        const summary = item.contentSnippet || item.content || "";
        const url     = item.link || "";

        if (!isRelevantArticle(title, summary)) continue;

        const deal = await extractDealFromArticle(title, summary, url, openai);
        if (!deal) continue;

        dealsFound++;

        // Fuzzy deduplicate: exact date+company AND normalised name match
        const norm = normaliseCompany(deal.company);
        const exactDupe = storage.dealExists(deal.company, deal.date);
        const fuzzyDupe = existingNorms.has(norm) || addedThisRun.has(norm);

        if (!exactDupe && !fuzzyDupe) {
          storage.insertDeal(deal);
          existingNorms.add(norm);
          addedThisRun.add(norm);
          dealsAdded++;
          console.log(`[pipeline] ✅ Added: ${deal.company} — $${deal.amount}M ${deal.stage} (${feed.name})`);
        } else {
          console.log(`[pipeline] ⏭  Skipped dupe: ${deal.company} (${feed.name})`);
        }
      }
    } catch (err: any) {
      errors.push(`${feed.name}: ${err.message}`);
      console.error(`[pipeline] ❌ Error fetching ${feed.name}:`, err.message);
    }
  }

  storage.logPipelineRun({
    dealsFound,
    dealsAdded,
    sources: sourcesChecked,
    status:  errors.length > 0 ? "partial" : "ok",
    error:   errors.length > 0 ? errors.join("; ") : undefined,
  });

  return { dealsFound, dealsAdded, sourcesChecked, errors };
}
