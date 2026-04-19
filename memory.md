# memory.md — BuildConnect Context Engine

## Core Product Identity
- **Product Name:** BuildConnect
- **Type:** Niche local discovery + lead generation platform
- **Niche:** Construction industry ONLY
- **Tagline:** Find. Verify. Build.

## What This Is NOT
- NOT a general Justdial clone
- NOT an e-commerce or marketplace
- NOT a booking/payment platform (MVP)
- NOT a chat platform

## Two-Sided Marketplace
- **Users (Demand):** Homeowners, real estate investors, businesses needing construction work
- **Vendors (Supply):** Contractors, architects, designers, electricians, plumbers, material suppliers

## Core Business Logic
1. User searches → finds vendor → submits quote request → LEAD CREATED
2. Vendor receives lead → contacts user → updates status
3. Revenue: vendors pay for visibility + leads

## The ONE metric that matters
- **Leads generated per day** — everything else is secondary

## Platforms
- **Web App:** Angular 17 + Tailwind + Supabase JS
- **Mobile App:** Flutter + supabase_flutter + Riverpod
- **Backend:** Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)
- **Hosting:** Vercel (web), App Store + Play Store (mobile)

## Key Design Decisions
- Portfolio-first UI (images > text in construction)
- WhatsApp integration (not in-app chat) for vendor contact
- Geo-based search with PostGIS
- Full-text search with pg_trgm (MVP), Elasticsearch (future)
- Realtime lead notifications via Supabase Realtime

## Vendor Categories (Predefined)
1. Civil Contractor
2. Residential Builder
3. Commercial Contractor
4. Turnkey Contractor
5. Architect
6. Interior Designer
7. Electrician
8. Plumber / Waterproofing
9. Material Supplier

## Lead Statuses
- `new` → `contacted` → `converted` / `lost`

## User Roles
- `user` — can search, view, submit leads, review
- `vendor` — can list business, view/manage leads
- `admin` — can approve vendors, moderate content

## Design System
- Primary color: #E85D26 (construction orange)
- Secondary: #1A1A2E (deep navy)
- Font: Syne (headings) + DM Sans (body)

## What Is Out of Scope (MVP)
- Payments / escrow
- Real-time chat
- AI cost estimation
- Material marketplace
- Bidding system

## Current Development Status
- [ ] Phase 0: Project setup
- [ ] Phase 1: Supabase backend + schema
- [ ] Phase 2: Angular web app
- [ ] Phase 3: Flutter mobile app
- [ ] Phase 4: Testing
- [ ] Phase 5: SEO + deployment

## Key Files to Reference
- PRD.md — Full product requirements
- DESIGN_DOC.md — Schema, architecture, RLS
- TECHSTACK.md — All technology decisions
- files.md — Complete project folder structure
- commands.md — Step-by-step build commands
