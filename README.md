# AI Capital Flows

**An AI-powered dashboard that tracks and summarizes capital-flow signals — funding rounds, investments, and money movement — by automatically aggregating news and data sources and using AI to surface the trends that matter.**

🔗 **Live demo:** [ai-capital-flows.vercel.app](https://ai-capital-flows.vercel.app)

<!-- Tip: a single screenshot or GIF of the dashboard here makes the biggest difference for a non-technical reader. Drop an image in the repo and uncomment the line below.
![Dashboard screenshot](docs/screenshot.png)
-->

---

## What it does

AI Capital Flows continuously pulls in data from news feeds and the web on a schedule daily at 7am, uses AI to analyze and summarize what's happening, and presents the results as an interactive dashboard with charts and trend views. Users can sign in, explore the data, and submit new deals by email.

<!-- Verify/adjust this paragraph so it matches exactly what you track and who it's for.
     e.g. "...tracks venture funding rounds across X sectors..." or "...monitors capital flows in public markets..." -->

## Key features

- **Automated data ingestion** — scheduled jobs collect data from RSS feeds and the web without manual effort.
- **AI-driven analysis** — uses the OpenAI API to interpret and summarize raw data into readable insights.
- **Interactive dashboard** — charts and visualizations built with Recharts, in a clean React + Tailwind interface.
- **User accounts** — secure sign-in so each user gets their own experience.
- **Email updates** — transactional/digest emails powered by Resend.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Radix UI / shadcn, Recharts |
| Backend | Node.js, Express 5, TypeScript |
| Database | SQLite via Drizzle ORM (`better-sqlite3`) |
| AI | OpenAI API |
| Data ingestion | `node-cron`, `rss-parser`, `cheerio`, `axios` |
| Auth & email | Passport (local), Resend |

## Getting started

**Prerequisites:** Node.js 20+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Set up your environment variables
cp .env.example .env
# then open .env and fill in your keys (OpenAI, email, database, etc.)

# 3. Initialise the database schema
npm run db:push

# 4. Start the development server
npm run dev
```

The app will start in development mode. Open the local URL printed in your terminal to view it.

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Run the app in development with live reload |
| `npm run build` | Build the production bundle |
| `npm start` | Run the built app in production |
| `npm run check` | Type-check the project with TypeScript |
| `npm run db:push` | Apply the database schema with Drizzle |

## Project structure

```
client/    Front-end React application
server/    Express backend and API
shared/    Code shared between client and server
script/    Build and utility scripts
```

## License

MIT
