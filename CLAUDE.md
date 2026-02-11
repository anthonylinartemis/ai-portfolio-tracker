# AI Portfolio Tracker — Project Context

## What This Is
A web app that tracks hypothetical $100K portfolios curated by AI agents (Claude, Gemini, GPT, Grok) and benchmarks them against SPY. Built for sharing with teammates — clarity and professionalism are the priorities.

**Thesis**: Can AI agents outperform the market?

## Quick Start
```bash
cd /Users/anthony_lin_99/code/ai-portfolio-tracker
npm run dev -- -p 3001        # Port 3000 is usually taken by pathfinder-etf
# Open http://localhost:3001
# Click "Update Prices" to sync market data from Yahoo Finance
```

## Build
```bash
npx next build                # Should be zero errors — always verify before marking done
```

## Resetting Seed Data
The DB auto-seeds on first request. If you change `seed.ts`, delete the DB to re-seed:
```bash
rm data/portfolio.db
# Then restart dev server or hit any API endpoint
```

---

## Tech Stack
| Layer | Package | Version | Notes |
|-------|---------|---------|-------|
| Framework | Next.js (App Router) | 16.1.6 | `src/` directory, TypeScript |
| Styling | Tailwind CSS | 4.x | CSS custom properties in `globals.css`, dark theme |
| Font | Inter (via `next/font/google`) | — | Weights 400/500/600/700 |
| Charts | lightweight-charts | 5.1.0 | **v5 API**: `chart.addSeries(LineSeries, opts)` not `addLineSeries()` |
| Charts | Recharts | 3.7.0 | Pie/donut (AllocationPie), grouped bar (ComparisonBar) |
| Tables | @tanstack/react-table | 8.x | HoldingsTable with sorting |
| Database | Drizzle ORM + better-sqlite3 | 0.45.1 / 12.6.2 | SQLite at `data/portfolio.db` |
| Data | yahoo-finance2 | 3.13.0 | **v3 API**: Must use `new YahooFinance()` instance, NOT static import |
| Icons | lucide-react | 0.563.0 | — |

### Critical API Gotchas
1. **yahoo-finance2 v3**: The default export is a class. Use `new YahooFinance()` to get an instance. The static `yahooFinance.chart()` returns `never` and won't compile.
2. **lightweight-charts v5**: No more `addLineSeries()`. Use `chart.addSeries(LineSeries, { color, lineWidth, ... })`. Import `LineSeries` from `lightweight-charts`. Series refs use `ISeriesApi<'Line'>`.
3. **better-sqlite3**: Must be in `serverExternalPackages` in `next.config.ts` (native module).
4. **Recharts Tooltip formatter**: Don't type the `value` param as `number` — use `(value) => [...]` and cast with `Number(value)` inside.

---

## Architecture

### Database Schema (SQLite — `data/portfolio.db`)
```
agents          → id (PK), name, color, inception_date, initial_capital, created_at
holdings        → id (PK auto), agent_id (FK), ticker, allocation_pct, shares
daily_prices    → ticker+date (composite PK), open, high, low, close, adj_close, volume
portfolio_snapshots → agent_id+date (composite PK), total_value, daily_return
```
Tables are auto-created on first DB connection (`src/lib/db/index.ts` → `migrate()` function). No migration files needed.

### Data Pipeline
```
Page Load / "Update Prices" click
  → POST /api/prices/sync
    → seedDatabase() if empty
    → For each unique ticker in holdings + SPY:
        → Check last date in daily_prices
        → Fetch only missing days from Yahoo Finance (500ms rate limit, sequential)
        → INSERT OR IGNORE into daily_prices
    → For each agent:
        → Compute initial shares from inception-date prices
        → Calculate daily portfolio values
        → INSERT OR IGNORE into portfolio_snapshots
```

Default sync start date: `2026-02-10` (in `sync.ts`). All agents incepted `2026-02-11`.

### KPI Calculations (`src/lib/finance/calculations.ts`)
All formulas use daily returns from `portfolio_snapshots`:
- Risk-free rate: 5% annualized (0.05/252 daily)
- Sharpe = `(mean_daily - rf) / std * sqrt(252)`
- Sortino = `(mean_daily - rf) / downside_dev * sqrt(252)`
- Max DD = max peak-to-trough drawdown
- Alpha = `portfolio_ann - (rf + beta * (spy_ann - rf))`
- Beta = `cov(p, spy) / var(spy)`
- 252 trading days per year

---

## File Map

### Pages (all `'use client'`)
| Route | File | What It Does |
|-------|------|-------------|
| `/` | `src/app/page.tsx` | Dashboard: agent cards, perf chart, KPI table, portfolio breakdown |
| `/portfolio/[agentId]` | `src/app/portfolio/[agentId]/page.tsx` | Detail: chart vs SPY, KPI grid, holdings table, allocation pie |
| `/compare` | `src/app/compare/page.tsx` | All agents overlaid + grouped bar chart |
| `/portfolio/new` | `src/app/portfolio/new/page.tsx` | Add new agent form (defaults inception to 2026-02-11) |

### API Routes
| Endpoint | Method | File |
|----------|--------|------|
| `/api/agents` | GET, POST | `src/app/api/agents/route.ts` — Seeds DB on first GET |
| `/api/agents/[id]` | GET | `src/app/api/agents/[id]/route.ts` — Returns agent + holdings |
| `/api/prices/sync` | POST | `src/app/api/prices/sync/route.ts` — Syncs all tickers + recomputes snapshots |
| `/api/portfolio/[agentId]/performance` | GET | `?timeframe=ALL\|1W\|1M\|3M\|6M\|1Y\|YTD` — Returns KPIs + chart data |
| `/api/portfolio/[agentId]/holdings` | GET | Returns holdings with per-ticker returns |

### Components
```
src/components/
├── layout/
│   └── Navbar.tsx              # Sticky top nav (dark bg), active tab highlighting
├── ui/
│   ├── Card.tsx                # Dark card (--card-bg), rounded-xl, shadow-sm
│   ├── Badge.tsx               # Positive/Negative/Neutral with dark-theme bg
│   ├── Tabs.tsx                # Pill-style tab selector (dark bg)
│   └── Spinner.tsx             # SVG loading spinner
├── dashboard/
│   ├── AgentCard.tsx           # Agent card with SVG logo (next/image), links to detail
│   ├── PerformanceTable.tsx    # KPI comparison table (self-fetching)
│   └── PortfolioBreakdown.tsx  # Cross-agent ticker matrix (weight %, value, return)
├── charts/
│   ├── PerformanceChart.tsx    # LWC v5 line chart with crosshair tooltip overlay
│   ├── AllocationPie.tsx       # Recharts donut chart (dark tooltip)
│   ├── ComparisonBar.tsx       # Recharts grouped bar chart (dark tooltip)
│   └── TimeframeSelector.tsx   # 1W/1M/3M/6M/1Y/YTD/All pill selector
└── portfolio/
    ├── KPIGrid.tsx             # 2x4 grid of Sharpe, Sortino, etc.
    ├── HoldingsTable.tsx       # TanStack Table (sortable, dark hover row)
    └── AddPortfolioForm.tsx    # Form with dynamic holdings + validation
```

### Lib
```
src/lib/
├── db/
│   ├── schema.ts              # Drizzle table definitions
│   └── index.ts               # getDb() singleton, auto-migrate via raw SQL
├── finance/
│   ├── yahoo.ts               # new YahooFinance() wrapper with rate limiting
│   ├── sync.ts                # Incremental sync + snapshot computation
│   └── calculations.ts        # All KPI formulas
├── seed.ts                    # 4 agents with 10 holdings each (inception 2026-02-11)
└── utils.ts                   # formatCurrency, formatPercent, cn(), getTimeframeStartDate()
```

### Static Assets
```
public/logos/
├── claude.svg                 # Purple circle + dot motif
├── gemini.svg                 # Gradient (blue→purple→red) gem shape
├── gpt.svg                    # Green hexagonal wireframe
└── grok.svg                   # Monospace "G" with blue accent dot
```
Agent cards and detail pages use `<Image src={`/logos/${agent.id}.svg`} />` for logos.

---

## Design System (Dark Theme)
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0B0E11` | Page bg (near-black) |
| Card | `#1E2329` | Cards, nav, tooltips |
| Primary | `#0052FF` | CTAs, active tabs |
| Primary Hover | `#3373FF` | Button hover state |
| Text | `#EAECEF` | Headings, body text |
| Secondary | `#848E9C` | Muted text, labels |
| Positive | `#0ECB81` | Binance-style green for gains |
| Negative | `#F6465D` | Binance-style red for losses |
| Border | `#2B3139` | Card borders, table dividers, grid lines |
| Claude | `#8B5CF6` | Purple |
| Gemini | `#4285F4` | Google Blue |
| GPT | `#10A37F` | OpenAI Green |
| Grok | `#1DA1F2` | Twitter/X Blue |

All colors defined as CSS custom properties in `src/app/globals.css` and mapped to Tailwind via `@theme inline`. Components reference vars (e.g. `bg-[var(--card-bg)]`) not hardcoded hex, so theming is centralized.

**Chart colors**: Lightweight Charts and Recharts tooltips use hardcoded dark values (`#1E2329` bg, `#2B3139` border, `#848E9C` text) matching the CSS vars.

---

## Seeded Portfolios (v1.1 — Real AI Picks)

All start at $100K on **2026-02-11**. Each agent has 10 holdings. SPY auto-tracked as benchmark.

| Agent | Holdings |
|-------|----------|
| Gemini | NVDA 15%, LLY 13%, VST 12%, VRT 10%, AMZN 10%, MSFT 9%, ETN 9%, BX 8%, MELI 7%, HWM 7% |
| Grok | NVDA 15%, MSFT 12%, AMZN 12%, TSM 10%, XOM 10%, AVGO 9%, BMY 8%, JNJ 8%, COST 8%, VRSK 8% |
| Claude | GOOGL 15%, LLY 13%, NEM 12%, VST 12%, GEV 10%, META 10%, AEM 8%, CEG 8%, GE 7%, FCX 5% |
| GPT | NVDA 12%, MSFT 12%, AMZN 10%, ANET 10%, ETN 10%, LLY 10%, JPM 10%, RTX 10%, GOOGL 8%, GEV 8% |

**Common themes**: Energy infrastructure (VST, CEG, GEV, ETN), AI compute (NVDA, AVGO, AMZN), pharma (LLY), gold miners (NEM, AEM, FCX).

---

## Key Patterns

### PerformanceChart Tooltip
The chart uses LWC's `subscribeCrosshairMove` to display a custom React tooltip overlay. Series are stored in `seriesMapRef` (a `Map<string, ISeriesApi<'Line'>>`) so the crosshair handler can look up values by label. Tooltip is positioned absolutely relative to the chart container.

### PortfolioBreakdown Table
A cross-agent matrix showing every ticker across all agents. Uses sticky first column (`sticky left-0 bg-[var(--card-bg)] z-10`). Fetches holdings for all agents in parallel on mount.

### Dark Theme Pattern
All UI components use CSS variable references (`var(--card-bg)`, `var(--border)`, etc.) instead of Tailwind color classes. This means theme changes only need to touch `globals.css`.

---

## What's NOT Built Yet (Future Work)
- No authentication (fully public)
- No real-time price updates (manual sync via button)
- No trade history / rebalancing — static allocations from inception
- No mobile-optimized charts (works but not ideal)
- No automated daily sync (could add cron or Vercel cron)
- No delete/edit agent functionality
- No SPY KPI row in comparison table

---

## Changelog

### v1.1 — 2026-02-10 (Dark Theme + Polish)
- Switched from light Coinbase theme to dark Binance-inspired theme
- Updated all CSS vars: bg `#0B0E11`, cards `#1E2329`, text `#EAECEF`, green `#0ECB81`, red `#F6465D`
- Updated all components to use `var()` references for dark compatibility
- Added agent logo SVGs in `public/logos/` (claude, gemini, gpt, grok)
- Replaced colored circle avatars with `<Image>` logo components
- Added crosshair tooltip to PerformanceChart (shows all series values on hover)
- Added `PortfolioBreakdown` component — cross-agent ticker comparison matrix on dashboard
- Updated seed data to real AI-generated picks (10 holdings each, inception 2026-02-11)
- Updated sync default start date to 2026-02-10
- Updated form default inception date to 2026-02-11
- Dark-styled Recharts tooltips (ComparisonBar, AllocationPie)
- Dark-styled table hover rows, badges, tabs

### v1.0 — 2026-02-10 (Initial Build)
- Scaffolded Next.js 16 + TypeScript + Tailwind 4 project
- Implemented SQLite database with 4 tables (agents, holdings, daily_prices, portfolio_snapshots)
- Built Yahoo Finance v3 integration with rate-limited incremental sync
- Built full KPI engine (Sharpe, Sortino, Max DD, Volatility, Alpha, Beta, Win Rate)
- Created dashboard, portfolio detail, compare, and add-agent pages
- Integrated TradingView Lightweight Charts v5 for performance lines
- Integrated Recharts for allocation pie and comparison bar charts
- Integrated TanStack Table for sortable holdings tables
- Seeded 4 AI agents with distinct stock-picking strategies
- SPY benchmark overlay on all performance charts
- Timeframe selector (1W/1M/3M/6M/1Y/YTD/All)
- `npx next build` passes with zero errors
- Verified end-to-end: sync populates real market data, KPIs calculate correctly
