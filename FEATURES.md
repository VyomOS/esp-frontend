# ESP Platform — Feature Map

> **Usage:** Read the `## FEATURE:` section you need. Each is ~30 lines.
> **Source of truth for routes:** this file. For remaining work: `BACKEND_TODO.md`.

## SECTION INDEX
- FRONTEND FILE MAP
- BACKEND ROUTE MAP (complete, current)
- AI ENDPOINTS (dedicated, all built)
- NOTIFICATION SYSTEM
- FILE STORAGE
- AUDIT LOG
- ANALYTICS
- INLINE UI COMPONENT GLOSSARY
- TAB ROUTING PATTERN
- BID STATUS STATE MACHINE
- FEATURE: AUTH FLOW
- FEATURE: VENDOR DASHBOARD
- FEATURE: BUYER DASHBOARD
- FEATURE: ADMIN DASHBOARD
- FEATURE: CHATBOT
- FEATURE: ESG SCORING
- CONTROLLED TAXONOMIES
- KEY DATABASE MODELS
- KNOWN FIXES APPLIED
- RECURRING BUG: INPUT LOSES FOCUS

---

## FRONTEND FILE MAP
```
src/
├── App.jsx                   Routes: / (Login) · /home · /register
│                             /forgot-password · /verify-email
│                             /dashboard · /dashboard/:tab · /dashboard/:tab/:sub
├── main.jsx
├── index.css                 18 themes via CSS vars. Default: [data-theme="evencargo"]
├── api/api.js                authAPI · vendorAPI · buyerAPI · bidAPI
│                             adminAPI · chatAPI · taxonomyAPI
├── context/
│   ├── AuthContext.jsx       login(email,password) · logout · user · loading
│   ├── ToastContext.jsx      toast.success/error/warning/info
│   └── ThemeContext.jsx      18 themes, persisted to localStorage
├── components/
│   ├── UI.jsx                Btn · Card · Input · Textarea · Select · Modal · Tabs
│   │                         SectionHeader · StatCard · Empty · Progress · Stars · InfoRow
│   ├── Layout.jsx            Collapsible sidebar + topbar + ThemePicker
│   ├── ThemePicker.jsx       3-col grid dropdown, 18 themes
│   ├── Chatbot.jsx           Floating chat. Auto-opens 1.8s after load.
│   │                         Calls POST /ai/proactive-message for greeting.
│   │                         Polls GET /notifications/chatbot-pending for queued messages.
│   └── ConfirmModal.jsx      Confirm dialog
└── pages/
    ├── Landing.jsx           /home — public marketing
    ├── Auth.jsx              Quiz signup + Login + ForgotPassword + VerifyEmail
    ├── Dashboard.jsx         Role router → Vendor / Buyer / Admin dashboard
    ├── VendorDashboard.jsx   Home · Profile · Services · Opportunities · ESG
    ├── BuyerDashboard.jsx    Home · My RFPs · Find Vendors
    └── AdminDashboard.jsx    Overview · Approvals · Users · Impact · Notify
```

---

## BACKEND ROUTE MAP

### Auth (`auth_routes.py`) — rate limited 5/min
```
POST   /auth/register
POST   /auth/login                    JSON {email, password}
GET    /auth/me
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/resend-verification
POST   /auth/change-password
GET    /auth/verify-email?token=
```

### Vendor (`vendor_routes.py`)
```
POST   /vendor/profile
GET    /vendor/profile/me
PATCH  /vendor/profile/me             → triggers ESG recompute + cert gap refresh
GET    /vendor/profile/completeness
GET    /vendor/profile/me/ratings
GET    /vendor/                       ?search= (Postgres FTS), category, location, min_esg, certification
GET    /vendor/ranked/list
GET    /vendor/{id}
GET    /vendor/{id}/ratings
GET    /vendor/esg/compliance
GET    /vendor/esg/{id}
POST   /vendor/esg                    → saves ESGMetric, recomputes score on VendorProfile
GET    /vendor/certification/gaps
POST   /vendor/certification/gaps/{type}/dismiss
POST   /vendor/verify-gst             real gstincheck.co.in API
POST   /vendor/verify-pan             real surepass.io API
POST   /vendor/lookup-company         real surepass.io MCA API
GET    /vendor/company-suggest?q=     autocomplete from MCA search-by-name
POST   /vendor/services               → triggers ESG recompute
GET    /vendor/services/mine
DELETE /vendor/services/{id}          → triggers ESG recompute
POST   /vendor/documents/upload       → uploads to R2 (or local fallback)
GET    /vendor/documents/mine         includes view_url per document
DELETE /vendor/documents/{id}
POST   /vendor/catalogue/upload
GET    /vendor/catalogue/mine
DELETE /vendor/catalogue/{id}
```

### Buyer (`buyer_routes.py`)
```
POST   /buyer/profile
GET    /buyer/profile/me
POST   /buyer/requests
GET    /buyer/requests
GET    /buyer/requests/mine
GET    /buyer/requests/{id}
POST   /buyer/requests/{id}/close
POST   /buyer/requests/{id}/reopen
DELETE /buyer/requests/{id}           soft delete (sets deleted_at)
GET    /buyer/requests/{id}/ai-match  legacy match (uses ai_service.match_vendors)
POST   /buyer/rate
GET    /buyer/rating/{vendor_id}      avg + reviews + my_rating
GET    /buyer/notifications           legacy, kept for compat (use /notifications instead)
PATCH  /buyer/notifications/{id}/read legacy
POST   /buyer/notifications/mark-all-read legacy
```

### Bids (`bid_routes.py`)
```
POST   /bids/submit
GET    /bids/mine
DELETE /bids/{id}                     soft delete (sets deleted_at), triggers no email
GET    /bids/request/{rid}
PATCH  /bids/{id}/status              → sends email (shortlisted/awarded/declined) + audit log
```

### Admin (`admin_routes.py`)
```
GET    /admin/stats
GET    /admin/users                   ?role=
GET    /admin/users/{id}
PATCH  /admin/users/{id}              → audit logged
DELETE /admin/users/{id}             sets is_active=False → audit logged
GET    /admin/vendors/pending
POST   /admin/vendors/bulk-verify     body: {vendor_ids:[]} max 50 → audit logged
POST   /admin/vendors/{id}/verify     → audit logged
POST   /admin/vendors/{id}/reject     → audit logged
POST   /admin/vendors/{id}/unverify
POST   /admin/vendors/{id}/verify-gstin  manual override → audit logged
POST   /admin/vendors/{id}/unverify-gstin
POST   /admin/vendors/{id}/verify-pan    manual override → audit logged
POST   /admin/vendors/{id}/unverify-pan
GET    /admin/vendors/{id}/documents     includes view_url per doc
PATCH  /admin/documents/{id}/status      → audit logged
GET    /admin/documents/{id}/download    → R2 presigned URL redirect or FileResponse
GET    /admin/documents/{id}/url         returns {url, is_r2}
GET    /admin/impact
GET    /admin/impact/esg-breakdown
POST   /admin/notifications/send      targets: all|vendors|buyers|individual → audit logged
GET    /admin/audit-log               ?action=&actor_id=&target_type=&target_id=&from_date=&to_date=
```

### Notifications (`notification_routes.py`) — all roles
```
GET    /notifications                 ?unread_only=&category=&limit=   → {notifications[], unread_count}
PATCH  /notifications/{id}/read
POST   /notifications/mark-all-read
DELETE /notifications/{id}
GET    /notifications/stream          SSE via Authorization header
GET    /notifications/stream-token?token=  SSE via query param (for EventSource)
GET    /notifications/chatbot-pending unread bid/profile notifs for chatbot proactive display
```

### AI Endpoints (`ai_routes.py`) — all rate limited 30/min, all cached
```
POST   /ai/proactive-message          cache 4h/user
POST   /vendor/ai-profile-advice      cache 1h/user
POST   /vendor/ai-description         cache 24h — kind: business|impact|service
POST   /vendor/ai-bid-draft           cache 1h/vendor+rfp
POST   /vendor/ai-esg-insight         cache 1h/user
POST   /vendor/ai-company-enrich      cache 24h — fetches MCA + AI fills profile fields
POST   /buyer/ai-rfp-draft            cache 2h
POST   /buyer/ai-bid-comparison       cache 1h/rfp
POST   /buyer/ai-suggestions          cache 1h/user
GET    /buyer/vendors/{rfp_id}/ai-matches?limit=4  cache 1h
POST   /admin/ai-doc-check            cache 30min
GET    /admin/ai-platform-insight     cache 1h
GET    /admin/ai-impact-story         cache 6h
```

### Analytics (`analytics_routes.py`) — admin only
```
GET    /admin/analytics/vendor-funnel     registered→profile→verified→bid→won
GET    /admin/analytics/rfp-funnel        created→first bid→competitive→awarded→closed
GET    /admin/analytics/esg-distribution  per-band counts + score histogram + platform avg
GET    /admin/analytics/ai-usage          per-endpoint calls/tokens/cost + audit action volume
```

### Chatbot (`chatbot_routes.py`)
```
POST   /chatbot/chat                  rate limited 10/min — returns {reply, response, source}
GET    /chatbot/faqs
```

### Search & Taxonomy (`main.py`)
```
GET    /search?q=&type=vendor|rfp|all  Postgres FTS across vendors + RFPs
GET    /taxonomy/categories
GET    /taxonomy/sdg-tags
GET    /taxonomy/certification-types
GET    /health                         DB + R2 + OpenAI ping with latency
GET    /metrics                        SSE connections, cache stats, platform counts
GET    /ping
```

> **All routes also available at `/api/v1/` prefix** — e.g., `/api/v1/vendor/profile/me`

---

## AI ENDPOINTS — DEDICATED (all built, no longer using /chatbot/chat workaround)

**Request / response shapes:**

| Endpoint | Request body | Response |
|---|---|---|
| `POST /ai/proactive-message` | `{role, context:{profile_completeness, esg_score, pending_bids}}` | `{should_show, message, type, action?}` |
| `POST /vendor/ai-profile-advice` | `{profile, completeness_score, esg_result}` | `{suggestions:[{id,icon,title,body,action,action_tab,priority}]}` max 3 |
| `POST /vendor/ai-description` | `{kind:"business|impact|service", context:{org_name,location,...}}` | `{text}` |
| `POST /vendor/ai-bid-draft` | `{rfp_id}` | `{cover_note, suggested_price_range?, suggested_timeline?}` |
| `POST /vendor/ai-esg-insight` | `{score,band,e_score,s_score,g_score,missing_fields,top_fields}` | `{headline, insight, top_improvement:[{field,why,impact}]}` |
| `POST /vendor/ai-company-enrich` | `{company_name, cin?, gstin?}` | `{organization_name, location, category, description, year_founded, cin, directors, mca_verified}` |
| `POST /buyer/ai-rfp-draft` | `{title, category?, budget?, location?, quantity?, deadline?}` | `{description, impact_requirements}` |
| `POST /buyer/ai-bid-comparison` | `{rfp_id}` | `{summary, recommendation:bid_id, ranked:[{bid_id,rank,reason}]}` |
| `POST /buyer/ai-suggestions` | `{requests[], recent_activity}` | `{suggestions:[{id,icon,title,body,action}]}` max 3 |
| `GET /buyer/vendors/{rfp_id}/ai-matches` | `?limit=4` | `[{vendor:{...}, match_reason, match_score}]` |
| `POST /admin/ai-doc-check` | `{vendor_id}` | `{summary, issues:[{doc_id,issue,severity}], recommendation}` |
| `GET /admin/ai-platform-insight` | — | `{headline, insight, metrics:[{label,value,trend}]}` |
| `GET /admin/ai-impact-story` | — | `{story, highlights:[{label,value,description}]}` |

**Frontend usage** (backward compat still works):
```js
// Old — still works via /chatbot/chat
const r = await chatAPI.chat({ message: prompt, session_id: "vendor-bid-draft" });
const text = r.data.reply || r.data.response;

// New — preferred for each dedicated feature
const r = await vendorAPI.aiBidDraft({ rfp_id });
const { cover_note, suggested_price_range } = r.data;
```

---

## NOTIFICATION SYSTEM

**Categories:** `bid` · `profile` · `system` · `broadcast`

**Live SSE stream (frontend):**
```js
const es = new EventSource(`${API_URL}/notifications/stream-token?token=${localStorage.token}`);
es.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type !== 'connected') showToastOrBell(data);
};
// reconnects automatically; keepalive comment every 25s prevents proxy timeout
```

**Chatbot proactive pull:**
```js
// On chatbot open — surface actionable pending notifications
const r = await fetch('/notifications/chatbot-pending', { headers: authHeaders });
const pending = r.json(); // [{message, type, category, link}]
```

**Notification shape:**
```json
{ "id": 1, "message": "...", "type": "success", "category": "bid",
  "is_read": false, "link": "/dashboard/my-bids", "created_at": "..." }
```

---

## FILE STORAGE (Cloudflare R2)

`file_path` in DB stores:
- **R2 key** when configured: `"documents/vendor_1_uuid.pdf"` — no `uploads/` prefix
- **Local path** when R2 not set: `"uploads/documents/vendor_1_uuid.pdf"`

Document responses include `view_url` — a presigned R2 URL (1h) or public URL:
```js
// Frontend — open/view a document
window.open(doc.view_url || `/admin/documents/${doc.id}/download`);
```

Admin download endpoint (`GET /admin/documents/{id}/download`) redirects to R2 presigned URL automatically.

---

## AUDIT LOG

Every admin action writes to `audit_logs`. Query via `GET /admin/audit-log`.

**Action strings:**
```
vendor.verified          vendor.rejected          vendor.unverified
vendor.gstin_verified    vendor.pan_verified       vendor.bulk_verified
document.status_updated  bid.shortlisted           bid.awarded
bid.declined             user.activated            user.deactivated
notification.broadcast
```

**`log_action()` usage:**
```python
from app.utils.audit import log_action
log_action(db, actor_id, actor_name, "vendor.verified",
           target_type="vendor", target_id=vid,
           metadata={"org": name, "user_id": uid})
```

---

## ANALYTICS

All admin-only, under `/admin/analytics/`:

| Endpoint | Returns |
|---|---|
| `vendor-funnel` | 5-stage: registered→profile→verified→bid→won |
| `rfp-funnel` | 5-stage: created→first bid→competitive(3+)→awarded→closed |
| `esg-distribution` | Per-band counts + 0–10 score histogram + platform avg |
| `ai-usage` | Per-endpoint calls/tokens/cost (in-process, resets on restart) + audit action volume |

---

## INLINE UI COMPONENT GLOSSARY
- `S` — styled `<input>` (cream bg, navy text, teal focus border)
- `TA` — styled `<textarea>`
- `Lbl` — `<label>` (DM Sans 12px, text2)
- `FG` — FormGroup wrapper
- `PrimaryBtn` — navy → teal hover, radius-sm
- `GhostBtn` — transparent with border, navy text
- `Card` — white surface, --border, --shadow-sm, radius
- `Chip` — small pill, teal-bg when selected

These MUST be defined at module level (see RECURRING BUG below).

---

## TAB ROUTING PATTERN
```js
const tab = loc.pathname.includes("profile")       ? "profile"
          : loc.pathname.includes("services")      ? "services"
          : loc.pathname.includes("opportunities") ? "opportunities"
          : loc.pathname.includes("esg")           ? "esg"
          : "home";
```
Default tab id: `"home"` for vendor/buyer, `"overview"` for admin.

---

## BID STATUS STATE MACHINE
States: `submitted → under_review → shortlisted → awarded` (terminal) or `→ declined` (terminal).
Withdraw (vendor DELETE) sets `deleted_at` — not a status change.

| Status | Colour | Who triggers |
|---|---|---|
| `submitted` | navy/cream | vendor (initial) |
| `under_review` | amber/amber-bg | buyer |
| `shortlisted` | teal/teal-bg | buyer |
| `awarded` | white/teal | buyer |
| `declined` | red/red-bg | buyer |

Email sent to vendor on: shortlisted, awarded, declined. In-app notification on all transitions.

---

## FEATURE: AUTH FLOW (Auth.jsx)
**Path:** `/` (Login is the landing route)

**Onboarding quiz:** phase('quiz'|'signup'|'login') · step(0-2) · role('buyer'|'vendor')
- Q1: Role selection (2 big icon cards, auto-advance 550ms)
- Q2/Q3: Role-specific questions (4 vertical options, auto-advance 550ms)

**Signup:** name + email + password. Calls `authAPI.register({name, email, password, role})`.
**Login:** Calls `useAuth().login(email, password)`. NEVER `authAPI.login()` directly.

---

## FEATURE: VENDOR DASHBOARD
**Tabs:** `home · profile · services · opportunities · esg`

**Home tab:** 3 AI suggestion cards from `POST /vendor/ai-profile-advice`. Profile gauge (SVG half-circle, needle rotation). `POST /ai/proactive-message` drives chatbot auto-open.

**Profile tab:** view-first, section Edit buttons. Saving calls `PATCH /vendor/profile/me` → auto-triggers ESG recompute + cert gap refresh.

**ESG tab:** 3-step wizard (E → S → G → Review). All number fields store as STRING in state, convert to `Number()` at save. `POST /vendor/esg` saves and recomputes score.

**Opportunities tab:** Browse RFPs ↔ My Bids toggle. Bid modal has "✨ Draft with AI" → `POST /vendor/ai-bid-draft`.

**Company autocomplete flow:**
1. User types org name → `GET /vendor/company-suggest?q=` → dropdown
2. User selects → `POST /vendor/ai-company-enrich {company_name, cin}` → auto-fills profile form

---

## FEATURE: BUYER DASHBOARD
**Tabs:** `home · requests · vendors`

**Home tab:** 3 AI suggestion cards from `POST /buyer/ai-suggestions`. Live unread notification count from `GET /notifications`.

**My RFPs tab:** Inline create with `POST /buyer/ai-rfp-draft` for description + impact. Bid modal: if 3+ bids, auto-calls `POST /buyer/ai-bid-comparison` → summary card.

**Find Vendors tab:** search → `GET /vendor/?search=` (Postgres FTS). Vendor cards with `GET /buyer/vendors/{rfp_id}/ai-matches` for match reasons.

---

## FEATURE: ADMIN DASHBOARD
**Tabs:** `overview · approvals · users · impact · notify`

**Overview:** `GET /admin/ai-platform-insight` (1h cache). Pending approvals count. Stats from `/admin/stats`.

**Approvals:** `POST /admin/vendors/bulk-verify` for multi-select. Per-vendor "✨ AI doc check" → `POST /admin/ai-doc-check`. Manual GSTIN/PAN override: `/admin/vendors/{id}/verify-gstin` etc.

**Impact:** `GET /admin/ai-impact-story` (6h cache). ESG breakdown. Analytics at `/admin/analytics/*`.

**Notify:** 4 targets (everyone/vendors/buyers/specific emails). All broadcasts audit-logged.

---

## FEATURE: CHATBOT (Chatbot.jsx)
**Auto-open:** Calls `POST /ai/proactive-message` on mount. Opens after 1800ms if `should_show=true`. SessionStorage flag prevents re-open same session.

**Proactive messages (backend-driven):**
- `POST /ai/proactive-message` → personalised by role, completeness, ESG, pending bids
- `GET /notifications/chatbot-pending` → surfaces recent unread bid/profile events

**Backend response (both keys returned for compat):**
```js
const text = r.data.reply || r.data.response;
```

---

## FEATURE: ESG SCORING (`app/services/esg_service.py`)
- 25 fields, weighted: E 30% · S 45% · G 25%
- Bands: ESG Leader (80–100) · ESG Progressing (60–79) · ESG Developing (40–59) · ESG Baseline (0–39)
- Returns `{score, band, band_color, e_score, s_score, g_score, missing[]}`
- **Auto-recompute trigger:** runs on `PATCH /vendor/profile/me`, `POST /vendor/services`, `DELETE /vendor/services/{id}`

**E fields (7):** `carbon_emissions` `renewable_energy_pct` `ev_fleet_pct` `waste_recycling_pct` `biodegradable_packaging_pct` `water_consumption` `carbon_offset_programme`

**S fields (12):** `total_employees` `women_employees_pct` `women_leadership_pct` `sc_st_obc_pct` `pwd_employees_pct` `jobs_created` `jobs_marginalised` `living_wage_compliance` `health_insurance_pct` `training_hours_per_emp` `community_sourcing_pct` `women_employed`

**G fields (6):** `women_ownership_pct` `women_board_pct` `grievance_mechanism` `avg_payment_days` `annual_report_filed` `data_privacy_policy`

---

## CONTROLLED TAXONOMIES
**SERVICE_CATEGORIES (10):** `"Logistics & Delivery"` `"Facilities & Cleaning"` `"Staffing & Training"` `"Food & Catering"` `"Textiles & Apparel"` `"IT & Digital Services"` `"Green & Sustainability"` `"Handicrafts & Artisan"` `"Healthcare & Wellness"` `"Construction & Fitout"`

**CERT_TYPES (8):** `women_led` `msme_udyam` `sc_st_owned` `shg` `social_enterprise` `cooperative` `fair_trade` `weps_signatory`

**SDG_TAGS (17):** SDG1 through SDG17

---

## KEY DATABASE MODELS
- **User** — id, name, email, password, role(vendor/buyer/admin), email_verified, verified, is_active, `deleted_at`
- **VendorProfile** — 25+ fields, gstin/pan/cin + verified flags, esg_score, esg_band, `deleted_at`
- **BuyerProfile** — company_type, sector, esg_procurement_policy, min_vendor_esg_score
- **VendorDocument** — document_type, status(pending/verified/rejected), file_path (R2 key or local path)
- **VendorCatalogue** — PDF, file_path (R2 key or local)
- **VendorService** — title, description, category
- **ProcurementRequest** — title, description, budget, deadline, min_esg_score, sdg_tags, status, `deleted_at`
- **Bid** — request_id, vendor_id, cover_note, proposed_price, timeline, status, buyer_note, `deleted_at`
- **ESGMetric** — 25 E/S/G fields + esg_score_computed, esg_band_computed
- **CertificationGap** — gap_type, description, action, advisory_fee, dismissed
- **Notification** — user_id, message, type, **category**, is_read, link, **expires_at**
- **AuditLog** — actor_id, actor_name, action, target_type, target_id, metadata_json, ip_address, created_at
- **ChatbotFAQ, VendorRating**

---

## KNOWN FIXES APPLIED
1. **api.js:** `data.username` → `data.email` (422 on login)
2. **Auth.jsx:** uses `useAuth().login()` not `authAPI.login()` directly
3. **email_service.py:** verification link fixed to `FRONTEND_URL/verify-email?token=`
4. **ProfileGauge:** dark colours at 22% opacity → light `#5FCFA0`/`#F5B342`/`#F5937F`
5. **Gauge needle:** wrapped in `<g>` for cross-browser rotation
6. **Layout.jsx:** sidebar synced to new tab structure

---

## RECURRING BUG: INPUT LOSES FOCUS AFTER ONE CHAR
**Cause:** Sub-component defined inside parent function — every state update remounts it.
**Fix:** Always define sub-components at module level (outside the parent function).
