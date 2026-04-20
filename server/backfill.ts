/**
 * Backfill script — fetches all RSS feeds and prints candidate articles
 * without needing OpenAI key. Used to verify source coverage.
 * Run with: npx tsx server/backfill.ts
 */

import Parser from "rss-parser";

const rssParser = new Parser({ timeout: 15000 });

const RSS_FEEDS = [
  { name: "TechCrunch Startups",  url: "https://techcrunch.com/category/startups/feed/" },
  { name: "TechCrunch Funding",   url: "https://techcrunch.com/tag/funding/feed/" },
  { name: "TechCrunch AI",        url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { name: "VentureBeat AI",       url: "https://venturebeat.com/category/ai/feed/" },
  { name: "VentureBeat",          url: "https://feeds.feedburner.com/venturebeat/SZYF" },
  { name: "BusinessWire Tech",    url: "https://feed.businesswire.com/rss/home/?rss=G1&_gl=1" },
  { name: "PR Newswire Tech",     url: "https://www.prnewswire.com/rss/news-releases-list.rss?category=technology" },
  { name: "Globe Newswire Tech",  url: "https://www.globenewswire.com/RssFeed/subjectcode/24-Technology" },
  { name: "Bloomberg Tech",       url: "https://feeds.bloomberg.com/technology/news.rss" },
  { name: "Crunchbase News",      url: "https://news.crunchbase.com/feed/" },
  { name: "Axios Technology",     url: "https://api.axios.com/feed/technology" },
  { name: "Axios Pro Rata",       url: "https://api.axios.com/feed/pro-rata" },
  { name: "Semafor Tech",         url: "https://www.semafor.com/feed/technology" },
  { name: "The Information",      url: "https://www.theinformation.com/feed" },
  { name: "Reuters Technology",   url: "https://feeds.reuters.com/reuters/technologyNews" },
  { name: "CNBC Technology",      url: "https://www.cnbc.com/id/19854910/device/rss/rss.html" },
  { name: "StrictlyVC",           url: "https://strictlyvc.com/feed/" },
  { name: "EU-Startups",          url: "https://www.eu-startups.com/feed/" },
  { name: "Tech.eu",              url: "https://tech.eu/feed/" },
  { name: "Ctech (Israel)",       url: "https://www.calcalistech.com/GeneralRSS.aspx" },
  { name: "The Batch",            url: "https://www.deeplearning.ai/the-batch/feed/" },
  { name: "Import AI",            url: "https://importai.substack.com/feed" },
];

const FUNDING_KEYWORDS = [
  "raises", "raised", "funding", "series a", "series b", "seed round",
  "million", "startup", "venture", "investors", "backed", "investment",
  "round", "capital", "led by", "valuation", "closes", "secures", "financing",
];
const AI_KEYWORDS = [
  "ai", "artificial intelligence", "machine learning", "llm", "generative ai",
  "deep learning", "robotics", "autonomous", "foundation model", "inference",
  "neural", "agentic", "agent", "chatbot", "computer vision", "nlp",
];

function isRelevant(title: string, summary: string) {
  const text = (title + " " + summary).toLowerCase();
  return FUNDING_KEYWORDS.some(k => text.includes(k)) && AI_KEYWORDS.some(k => text.includes(k));
}

const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - 110); // back to Jan 1

let total = 0;
const results: { source: string; title: string; date: string; url: string }[] = [];

for (const feed of RSS_FEEDS) {
  try {
    const parsed = await rssParser.parseURL(feed.url);
    let count = 0;
    for (const item of parsed.items || []) {
      const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
      if (pubDate < cutoff) continue;
      const title = item.title || "";
      const summary = item.contentSnippet || item.content || "";
      if (!isRelevant(title, summary)) continue;
      results.push({ source: feed.name, title, date: pubDate.toISOString().slice(0,10), url: item.link || "" });
      count++;
      total++;
    }
    console.log(`✅ ${feed.name}: ${count} candidates`);
  } catch (err: any) {
    console.log(`❌ ${feed.name}: ${err.message}`);
  }
}

console.log(`\n=== TOTAL CANDIDATES: ${total} ===\n`);
results.sort((a,b) => b.date.localeCompare(a.date));
for (const r of results.slice(0, 50)) {
  console.log(`[${r.date}] ${r.source} — ${r.title}`);
}
