// Quick feed test — run with: node server/test-feeds.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Parser = require('rss-parser');
const p = new Parser({ timeout: 8000 });

const feeds = [
  ['TechCrunch Funding',  'https://techcrunch.com/tag/funding/feed/'],
  ['TechCrunch AI',       'https://techcrunch.com/category/artificial-intelligence/feed/'],
  ['VentureBeat AI',      'https://venturebeat.com/category/ai/feed/'],
  ['Crunchbase News',     'https://news.crunchbase.com/feed/'],
  ['EU-Startups',         'https://www.eu-startups.com/feed/'],
  ['StrictlyVC',          'https://strictlyvc.com/feed/'],
  ['Semafor Tech',        'https://www.semafor.com/feed/technology'],
  ['Globe Newswire',      'https://www.globenewswire.com/RssFeed/subjectcode/24-Technology'],
  ['Bloomberg Tech',      'https://feeds.bloomberg.com/technology/news.rss'],
  ['CNBC Tech',           'https://www.cnbc.com/id/19854910/device/rss/rss.html'],
];

const FUND = ['raises','raised','funding','series a','series b','seed round','million','venture','investors','backed','round','capital','led by','closes','secures'];
const AI   = ['ai','artificial intelligence','machine learning','llm','generative ai','deep learning','robotics','autonomous','foundation model','neural','agentic','agent','chatbot'];

const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - 30);

let total = 0;
const found = [];

for (const [name, url] of feeds) {
  try {
    const feed = await p.parseURL(url);
    let c = 0;
    for (const item of (feed.items || [])) {
      const d = item.pubDate ? new Date(item.pubDate) : new Date();
      if (d < cutoff) continue;
      const t = ((item.title||'') + ' ' + (item.contentSnippet||'')).toLowerCase();
      if (FUND.some(k=>t.includes(k)) && AI.some(k=>t.includes(k))) {
        c++; total++;
        found.push({ date: d.toISOString().slice(0,10), source: name, title: item.title?.slice(0,90) });
      }
    }
    console.log(`  ✅ ${name}: ${c} candidates`);
  } catch(e) {
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

console.log(`\nTOTAL candidates (last 30d): ${total}\n`);
found.sort((a,b) => b.date.localeCompare(a.date));
found.slice(0, 30).forEach(r => console.log(`[${r.date}] [${r.source}] ${r.title}`));
