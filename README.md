# Mi Casa Agent Factory

A standalone web app that generates production-ready AI agent packages for Mi Casa Real Estate's polyphonic multi-agent system.

## What it does

Select an agent type (or describe a custom one) → Click generate → Get a complete deployment package:

- **System prompt** — Copy-paste into n8n Claude API nodes
- **SQL migration** — Copy-paste into Supabase SQL Editor
- **n8n workflow specs** — Step-by-step build guide for each workflow
- **Inter-agent connections** — How the new agent connects to existing agents
- **Test scenarios** — Verify everything works
- **Escalation triggers** — When to alert Ahmed

## Tech stack

- Next.js 14 (App Router)
- React 18
- Anthropic Claude API (Sonnet 4)
- Vercel Edge Runtime

## Setup

1. Clone this repo
2. `npm install`
3. `npm run dev`
4. Open http://localhost:3000
5. Enter your Anthropic API key

## Deploy to Vercel

Push to GitHub → Import in Vercel → Deploy. No environment variables needed.

## Security

- API key stored in browser localStorage only
- API calls proxied through Vercel Edge Function
- No database, no user accounts, no data collection
