# Product Requirements Document (PRD)
## BuildConnect — Construction Services Discovery & Lead Platform
**Version:** 1.0  
**Date:** April 2026  
**Platform:** Web App + Mobile App (Flutter)

---

## 1. Executive Summary

BuildConnect is a niche local discovery and lead generation platform built exclusively for the construction industry. It connects homeowners, real estate investors, and businesses with verified construction professionals — contractors, architects, interior designers, electricians, plumbers, and material suppliers — through search, portfolio browsing, and direct quote requests.

**Tagline:** *Find. Verify. Build.*

---

## 2. Problem Statement

### User Problem
- Finding reliable construction professionals is time-consuming and trust-deficient
- No single platform shows construction-specific portfolio, pricing signals, and reviews together
- Users waste time calling wrong vendors before finding the right fit

### Vendor Problem
- Construction businesses rely on word-of-mouth with no digital lead pipeline
- No platform generates high-intent, project-specific leads
- No way to showcase past work to establish credibility online

---

## 3. Target Users

### Demand Side (Users)
| Segment | Need |
|---|---|
| Homeowners | Building or renovating homes |
| Real estate investors | Contractors for multiple projects |
| Small business owners | Office construction/renovation |
| Property managers | Ongoing maintenance vendors |

### Supply Side (Vendors)
| Category | Subcategory |
|---|---|
| Contractors | Civil, residential, commercial, turnkey |
| Architects | Residential, commercial |
| Interior designers | Full home, modular kitchen, office |
| Electricians | Residential, industrial |
| Plumbers | General, waterproofing |
| Material suppliers | Cement, steel, tiles, paint |

---

## 4. Platform Strategy

| Platform | Purpose | Priority |
|---|---|---|
| Web App | SEO-driven discovery, search, listings | High |
| Mobile App (Flutter) | Vendor lead management, notifications | High |

Both platforms share the same Supabase backend.

---

## 5. Core MVP Features

### 5.1 User Features (Customer Side)

#### Search & Discovery (P0 — Must Have)
- Keyword search: "house contractor in Chennai"
- Location-based filtering (GPS auto-detect + manual)
- Category-based browsing
- Sort by: rating, distance, relevance
- Filter by: category, city, verified status

#### Business Listing Page (P0 — Must Have)
- Business name, category, location
- Contact: call + WhatsApp button
- Portfolio gallery (images of past work)
- Services offered
- Areas served
- Ratings & reviews
- "Request Quote" CTA button

#### Request Quote / Lead Form (P0 — Must Have)
- Project type (new build, renovation, commercial)
- Budget range
- Project description
- Timeline (optional)
- Contact details auto-filled from profile

#### Reviews & Ratings (P1)
- 1–5 star rating
- Written review
- Vendor response (MVP+)

#### Saved/Bookmarked Vendors (P2)
- Save vendors for later comparison

---

### 5.2 Vendor Features (Business Side)

#### Vendor Onboarding (P0)
- Register/login
- Select category
- Fill business profile

#### Business Profile Management (P0)
- Edit name, description, services
- Set service areas
- Add/remove portfolio images
- Update contact info

#### Lead Management Dashboard (P0)
- View incoming quote requests
- Lead details: project type, budget, description
- Status management: New → Contacted → Converted / Lost
- Contact user (call/WhatsApp)

#### Portfolio Management (P0)
- Upload project images
- Categorize (exterior, interior, kitchen, etc.)

#### Analytics (P1)
- Profile views (last 7/30 days)
- Total leads received
- Conversion rate

---

### 5.3 Admin Features (Mandatory)

- Vendor approval / rejection
- Listing moderation
- Category management
- Fake review removal
- System lead monitoring

---

## 6. User Journeys

### 6.1 Customer Journey
```
Open App → Search → Browse Listings → View Profile → Check Portfolio → Request Quote → Lead Created
```

### 6.2 Vendor Journey
```
Register → Create Profile → Upload Portfolio → Receive Lead Notification → Contact Customer → Update Lead Status
```

### 6.3 Admin Journey
```
Review Pending Vendor → Approve/Reject → Monitor Leads → Moderate Reviews
```

---

## 7. Lead Lifecycle (Core Business Logic)

```
Lead Created (user submits quote form)
        ↓
Vendor Notified (push notification + in-app)
        ↓
Vendor Views Lead
        ↓
Vendor Contacts User
        ↓
Status Updated: New → Contacted → Converted / Lost
```

---

## 8. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Search response time | < 1 second |
| Image load (CDN) | < 2 seconds |
| Mobile app size | < 30MB |
| Uptime | 99.5% |
| Auth security | JWT via Supabase |

---

## 9. Out of Scope (MVP)

- ❌ In-app payments or escrow
- ❌ Real-time chat (WhatsApp redirect is sufficient)
- ❌ AI cost estimation
- ❌ Material marketplace
- ❌ Contractor bidding/auction system
- ❌ Booking/appointment scheduling

---

## 10. Monetization Strategy (Post-MVP)

| Stream | Description |
|---|---|
| Featured Listings | Vendors pay to rank at the top |
| Lead Subscription | Monthly fee for unlimited leads |
| Pay-per-lead | Charge per verified lead |
| Verified Badge | One-time or annual verification fee |
| Banner Ads | Material suppliers, real estate brands |

---

## 11. Success Metrics

| Metric | Target (Month 3) |
|---|---|
| Daily searches | 500+ |
| Leads generated/day | 50+ |
| Vendor sign-ups | 200+ |
| Vendor lead conversion rate | > 20% |
| D7 vendor retention | > 60% |

---

## 12. Post-MVP Roadmap

| Phase | Features |
|---|---|
| Phase 2 | In-app chat, multi-vendor quote comparison |
| Phase 3 | Material marketplace, contractor bidding |
| Phase 4 | AI cost estimation, AR design previews |
