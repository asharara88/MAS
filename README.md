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

## Deploy to Vercel (5 minutes)

### Option A: One-click deploy

1. Push this folder to a new GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repo
5. Click "Deploy" (no environment variables needed — the API key is stored in your browser)

### Option B: Deploy via Vercel CLI

```bash
npm install -g vercel
cd agent-factory
vercel
```

Follow the prompts. Done.

## First-time setup

1. Open your deployed app URL
2. Enter your Anthropic API key (get one at console.anthropic.com)
3. Your key is saved in your browser's localStorage — never sent to any server except Anthropic

## How it works

```
You describe an agent
  → Next.js API route sends request to Claude Sonnet 4
  → Claude uses the Mi Casa master system prompt (1,500+ words of context)
  → Returns a structured JSON agent package
  → UI renders it with copy buttons for each section
```

The master system prompt in `lib/prompts.js` contains:
- Full Mi Casa stack context (n8n, Supabase, Vercel, Claude API)
- All existing agent definitions and their IDs
- Complete Supabase schema (21 tables)
- Inter-agent communication protocol
- UAE/Abu Dhabi real estate context (RERA, DLD, AED)
- Strict output format rules

## Tech stack

- **Next.js 14** (App Router)
- **React 18**
- **Anthropic Claude API** (Sonnet 4)
- **Vercel Edge Runtime** (for the API route)

## Security

- API key stored in browser localStorage only
- API calls proxied through your Vercel Edge Function (never exposed client-side)
- No database, no user accounts, no data collection
- You own everything — the code, the outputs, the prompts

## Customizing

To update the master system prompt (e.g., after deploying new agents), edit `lib/prompts.js`.

When you deploy a new agent, add it to the "EXISTING AGENTS" section in the system prompt so future agents know about it.

## Cost

Each agent generation costs approximately $0.02–0.05 in Claude API usage (about 2K input + 3K output tokens).
