# Universal Agent Factory

Multi-vertical, multi-entity AI agent generation platform. Generates production-ready AI agent packages using Claude Sonnet 4 via Supabase Edge Functions with real-time SSE streaming.

## Live URL
https://mas-sigma.vercel.app

## Architecture

Browser (Next.js on Vercel) --SSE--> Supabase Edge Function (generate-agent) --> Claude API
                                     |
                                     v
                                  Supabase DB (verticals, entities, factory_config,
                                               agent_definitions, agent_generations)

## Data Model

Vertical (industry) --> Entity (business type) --> Agent Definitions --> Agent Generations

## Pre-seeded Content

| Vertical | Entity | Agents |
|----------|--------|--------|
| Real Estate | Brokerage | 7 (listing, lead gen, comms, marketing, finance, legal, audit) |
| Real Estate | Developer | 7 (inventory, sales, collections, construction, handover, marketing, compliance) |
| Real Estate | Property Management | 5 (tenant, maintenance, rent, lease admin, landlord reporting) |
| Automotive | Dealership | 6 (inventory, sales/F&I, service, trade-in, marketing, finance) |
| Automotive | OEM/Distributor | 5 (allocation, dealer mgmt, warranty, brand marketing, logistics) |
| Automotive | Pre-Owned | 4 (sourcing, reconditioning, pricing, sales) |
| **Total** | **6 entities** | **34 predefined agents** |

## Tech Stack

- **Frontend:** Next.js 14, React 18, Supabase JS Client
- **Backend:** Supabase Edge Functions (Deno runtime)
- **AI:** Claude Sonnet 4 (claude-sonnet-4-20250514) via Anthropic API
- **Database:** Supabase PostgreSQL 17
- **Hosting:** Vercel (frontend), Supabase (backend + DB)

## Supabase Project

- **Project:** mi-casa-crm (dhwppkevuquwtavvqaan)
- **Edge Function:** generate-agent (ACTIVE, v2)
- **API Key Secret:** MICASA_API_KEY (stored in Edge Function Secrets)

## Key Features

- **SSE Streaming** -- tokens appear in real-time as Claude generates
- **Template Variable Injection** -- master prompt dynamically populated with entity context (industry knowledge, operational context, regulatory bodies, currency, terminology)
- **Version Tracking** -- every generation saved with version number, token count, cost
- **Database-Driven Config** -- add new verticals/entities/agents via Supabase dashboard, zero code changes
- **Cost Tracking** -- input/output tokens and USD cost logged per generation

## Adding a New Entity (Zero Code)

1. Insert a row into the entities table via Supabase dashboard
2. Insert agent_definitions rows linked to that entity
3. The UI picks up changes immediately -- no redeployment needed

## Adding a New Vertical

1. Insert into verticals with industry_knowledge text
2. Insert entities under that vertical
3. Insert agent_definitions per entity
4. UI shows the new vertical pill immediately

## Environment Variables

### Vercel
- NEXT_PUBLIC_SUPABASE_URL = https://dhwppkevuquwtavvqaan.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY = (from Supabase Settings > API)

### Supabase Edge Function Secrets
- MICASA_API_KEY = Anthropic API key (sk-ant-api03-...)

## Agent Output Format

Each generated agent includes:
- agent_name, agent_id, description
- system_prompt (500+ chars, context-specific)
- supabase_tables (with CREATE TABLE SQL)
- n8n_workflows (trigger, nodes, description)
- tools_and_apis
- inputs, outputs
- escalation_triggers (3+ per agent)
- inter_agent_connections
- test_scenarios (3+ realistic scenarios)
- sql_migration (complete, runnable)
- phase (1-4), estimated_setup_time, dependencies

## File Structure

MAS/
  app/
    layout.js       -- Root layout with Outfit + JetBrains Mono fonts
    globals.css     -- Dark theme design system
    page.js         -- Complete UI (vertical/entity/agent selector, streaming, history)
  package.json      -- next, react, react-dom, @supabase/supabase-js
  next.config.js    -- Next.js config
  vercel.json       -- Framework detection (nextjs)
  README.md         -- This file

## Edge Function (generate-agent)

Located in Supabase project dhwppkevuquwtavvqaan.
- Accepts: { entity_id, agent_id?, custom_prompt? }
- Loads entity + vertical from DB
- Replaces template variables in master prompt
- Calls Claude API with streaming
- Pipes SSE tokens to browser
- Saves completed generation to agent_generations table
- Returns generation_id, version, usage stats

## This is FAROL's core engine
The multi-vertical, multi-entity agent generation platform.
