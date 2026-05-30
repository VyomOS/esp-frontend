# ESP Platform — Project Knowledge Base

> Auto-loaded by Claude Code every session.
> - For feature details: read the relevant `## FEATURE:` section in `FEATURES.md`.
> - For remaining work: see `BACKEND_TODO.md` — only deferred/large items remain.

## WHAT THIS IS
ESP (Even Procurement Platform) — India's first ESG-first B2B procurement marketplace
for women-led businesses, MSMEs, SHGs, cooperatives, and social enterprises.
Client: Even Cargo (evencargo.in).

## LOCAL FILE PATHS
- Frontend (active, v3 redesign): `C:\Users\karti\Downloads\esp_frontend_v3_redesign\esp_frontend`
- Backend: `C:\Users\karti\Documents\esp\backend`
- Original frontend (reference only): `C:\Users\karti\Documents\esp\frontend`

## TECH STACK
- **Frontend:** React 18 + Vite, React Router v6, Axios
- **Styling:** Inline styles + CSS variables (18 themes). Tailwind installed but NOT used.
- **Backend:** FastAPI 0.135, SQLAlchemy 2.0, PostgreSQL (Neon.tech), python-jose JWT, bcrypt==4.0.1, openai==2.29.0, boto3==1.38 (R2), slowapi (rate limiting), aiofiles
- **Fonts:** Playfair Display (headings h1–h3) + DM Sans (body/UI)
- **Hosting:** Vercel (frontend), Render (backend), Neon.tech (PostgreSQL), Cloudflare R2 (file storage)
- **GitHub:** VyomOS/esp-frontend, VyomOS/esp-backend
- **Live:** https://esp-frontend-liard.vercel.app · https://esp-backend-xbd6.onrender.com

## DESIGN SYSTEM (never deviate)
**Colours:** cream `#F2EBD9` · navy `#0B1D33` · teal `#18664A` · amber `#B8720A` · red `#B84232`

**CSS variables to use:**
```
--cream --cream-mid --cream-dark --navy --teal --teal-2 --teal-bg --amber --amber-bg
--red --red-bg --surface --border --text --text2 --text3 --muted --bg --bg2 --bg3
--radius (10px) --radius-sm (6px) --radius-lg (16px)
--shadow-sm --shadow --shadow-lg --glow
```

**Typography rules:**
- All headings (h1–h3, section titles): `fontFamily:"'Playfair Display',serif"`
- All body/UI text: `fontFamily:"'DM Sans',sans-serif"`
- Stats and big numbers: Playfair, weight 700

**Component patterns:**
- Sidebar: navy background, cream text, teal active highlight, left border on active
- Cards: white surface, `--border` (#D4C9B5) border, `--shadow-sm`
- Primary button: navy → teal on hover, radius-sm (6px), padding 13px 26px
- AI buttons: teal-bg pill with "✨ AI generate" label
- Inputs: cream background, navy text, border focuses to teal

**Dark-on-dark colour rule:** Don't use dark colours (navy/teal/red at .22 opacity) on the navy background — they're invisible. Use light variants: `#5FCFA0`, `#F5B342`, `#F5937F` on navy.

## AUTH FLOW — CRITICAL
- Backend `POST /auth/login` expects JSON `{email, password}` — NOT OAuth2 form data
- NEVER call `authAPI.login()` directly from Auth.jsx — always call `useAuth().login(email, password)`
- `AuthContext.login(email, password)` → `authAPI.login({email, password})` → stores token
- JWT stored in `localStorage` as `"token"`
- 401 response auto-redirects to `/` (interceptor in `api.js` calls `localStorage.clear()`)
- `api.js` correct payload key is `data.email` (not `data.username` — was a previous bug)

## API BASE URL & VERSIONING
`api.js` reads `import.meta.env.VITE_API_URL`. Falls back to `http://127.0.0.1:8000`.
Set `VITE_API_URL=https://esp-backend-xbd6.onrender.com` in Vercel env for production.

All routes are available under **two prefixes simultaneously** (no breaking changes):
- Legacy: `/vendor/...`, `/buyer/...`, `/admin/...` etc.
- Versioned: `/api/v1/vendor/...`, `/api/v1/buyer/...` etc.

Frontend can migrate gradually to `/api/v1/` — both work indefinitely.

## ENVIRONMENT VARIABLES (.env)
```
# Database
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require

# JWT
SECRET_KEY=long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=24

# Gmail SMTP (App Password — NOT regular password)
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx   # 16-char app password
MAIL_FROM=your-gmail@gmail.com
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587

# OpenAI
OPENAI_API_KEY=sk-...

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=esp-uploads
R2_PUBLIC_URL=                # optional: public bucket URL

# KYC APIs
GST_API_KEY=                  # gstincheck.co.in
SUREPASS_TOKEN=               # surepass.io (PAN + MCA)

# URLs
FRONTEND_URL=https://esp-frontend-liard.vercel.app
APP_URL=https://esp-backend-xbd6.onrender.com
```

## localStorage / sessionStorage KEYS
**localStorage:**
- `token` — JWT, set by AuthContext on login, cleared on 401 / logout
- `role` — `"vendor" | "buyer" | "admin"`, set on login
- `name` — display name, set on login
- `esp-theme` — selected theme slug (managed by `ThemeContext`)
- `onboarding_done` — `"1"` once vendor finishes onboarding wizard

**sessionStorage:**
- `chatbot_greeted_{role}_{userId}` — set by Chatbot after first auto-open per session

## TOAST USAGE
```js
import { useToast } from "../context/ToastContext";
const { toast } = useToast();
toast.success("Saved"); toast.error("Failed"); toast.warning("…"); toast.info("…");
```

## ERROR HANDLING CONVENTION
```js
try { await vendorAPI.updateProfile(form); toast.success("Saved"); }
catch (e) { toast.error(e?.response?.data?.detail || "Something went wrong"); }
```
FastAPI returns errors as `{detail: "…"}` — always read `e.response.data.detail` first.

## BACKEND FILE STRUCTURE
```
app/
├── main.py                   FastAPI app, router registration, /health, /metrics, /search
├── config.py                 All env vars loaded here
├── auth.py                   JWT, password hashing, require_role(), Perm constants
├── database.py               SQLAlchemy engine + SessionLocal
├── models.py                 All ORM models (see KEY DATABASE MODELS below)
├── schemas.py                Pydantic schemas
├── limiter.py                Shared slowapi Limiter instance
├── routes/
│   ├── auth_routes.py        /auth/* — rate limited (5/min)
│   ├── vendor_routes.py      /vendor/* — profile, ESG, docs, services, KYC, ratings
│   ├── buyer_routes.py       /buyer/* — RFPs, ratings, notifications
│   ├── admin_routes.py       /admin/* — verify, docs, users, bulk-verify, KPI manual override
│   ├── bid_routes.py         /bids/* — submit, mine, withdraw (soft delete), status
│   ├── chatbot_routes.py     /chatbot/* — chat (10/min), faqs
│   ├── notification_routes.py /notifications/* — unified all roles + SSE stream
│   ├── ai_routes.py          All 13 AI endpoints (30/min, cached, structured JSON)
│   └── analytics_routes.py   /admin/analytics/* — vendor/RFP funnels, ESG dist, AI usage
├── services/
│   ├── ai_service.py         OpenAI client, match_vendors, compute_profile_score, chat_with_bot
│   ├── cache_service.py      TTLCache LRU+TTL in-process cache, ai_cache instance
│   ├── email_service.py      Gmail SMTP — verification, reset, vendor approved/rejected, bid status
│   ├── esg_service.py        25-field ESG scoring engine (E30/S45/G25)
│   ├── file_service.py       R2 upload/delete/presigned-URL (local disk fallback)
│   └── verification_service.py GST (gstincheck.co.in), PAN+MCA (surepass.io)
└── utils/
    ├── audit.py              log_action() — writes to audit_logs table
    └── notifications.py      create_notification() — DB + SSE push to open connections
```

## RATE LIMITS
- `/auth/register`, `/auth/login`, `/auth/forgot-password`: **5/min/IP**
- `/chatbot/chat`: **10/min/IP**
- All AI endpoints (`/ai/*`, `/vendor/ai-*`, `/buyer/ai-*`, `/admin/ai-*`): **30/min/IP**

## AI ENDPOINTS (all cached, structured JSON, rule-based fallback)
All 13 dedicated AI endpoints are in `app/routes/ai_routes.py`:
| Endpoint | Cache | Auth |
|---|---|---|
| `POST /ai/proactive-message` | 4h per user | any role |
| `POST /vendor/ai-profile-advice` | 1h | vendor |
| `POST /vendor/ai-description` | 24h | vendor |
| `POST /vendor/ai-bid-draft` | 1h | vendor |
| `POST /vendor/ai-esg-insight` | 1h | vendor |
| `POST /buyer/ai-rfp-draft` | 2h | buyer |
| `POST /buyer/ai-bid-comparison` | 1h | buyer |
| `POST /buyer/ai-suggestions` | 1h | buyer |
| `GET /buyer/vendors/{rfp_id}/ai-matches` | 1h | buyer |
| `POST /vendor/ai-company-enrich` | 24h | vendor |
| `POST /admin/ai-doc-check` | 30min | admin |
| `GET /admin/ai-platform-insight` | 1h | admin |
| `GET /admin/ai-impact-story` | 6h | admin |

**Frontend convention** (still works, backward compat):
```js
const r = await chatAPI.chat({ message: prompt, session_id: "vendor-bid-draft" });
const text = r.data.reply || r.data.response;
```
Prefer dedicated endpoints — they're faster (cached), structured (typed JSON), and cheaper.

## SSE NOTIFICATIONS
```js
// Frontend — connect to live notification stream
const es = new EventSource(`${API_URL}/notifications/stream-token?token=${localStorage.token}`);
es.onmessage = (e) => {
  const notif = JSON.parse(e.data);
  if (notif.type !== 'connected') showNotification(notif);
};
```
Keepalive comment sent every 25s. Reconnects automatically via EventSource.
`GET /notifications/chatbot-pending` returns unread bid/profile notifications for chatbot proactive display.

## NOTIFICATION CATEGORIES
- `bid` — bid received, bid status changed (shortlisted/awarded/declined)
- `profile` — vendor verified/rejected, GSTIN/PAN verified
- `broadcast` — admin-sent to all/vendors/buyers
- `system` — default for everything else

## FILE STORAGE (Cloudflare R2)
`file_path` column stores:
- **R2 key** when R2 is configured: `"documents/vendor_1_uuid.pdf"` — no leading `uploads/`
- **Local path** (fallback): `"uploads/documents/vendor_1_uuid.pdf"`

`get_file_url(file_path)` returns presigned URL (1h) or public URL if `R2_PUBLIC_URL` is set.
Document list responses include `view_url` field — use this in frontend to open/download files.

## SOFT DELETE
`deleted_at` column on `User`, `VendorProfile`, `ProcurementRequest`, `Bid`.
- Bid withdrawal sets `deleted_at` instead of deleting the row
- Request deletion sets `deleted_at` instead of deleting the row
- All list queries filter `deleted_at == None`

## AUDIT LOG
Every admin action writes to `audit_logs` table via `log_action()` in `app/utils/audit.py`.
Logged: vendor verify/reject/unverify, GSTIN/PAN manual override, document status, bid status, user deactivate, bulk-verify, broadcast notifications.
Query: `GET /admin/audit-log?action=&actor_id=&target_type=&from_date=&to_date=`

## THEMES (18 total, in index.css)
`evencargo` (default) · `dark` · `ocean` · `forest` · `sunset` · `purple` · `slate` · `crimson` · `amber` · `mint` · `rose` · `cyber` · `gold` · `arctic` · `midnight` · `sakura` · `light` · `neon`

## RESPONSIVE
Currently NOT responsive — no `@media` queries anywhere. Designed for desktop (≥1280px).

## RUN LOCALLY
```
# Frontend
cd C:\Users\karti\Downloads\esp_frontend_v3_redesign\esp_frontend
npm run dev   # → http://localhost:3000

# Backend
cd C:\Users\karti\Documents\esp\backend
uvicorn main:app --reload   # → http://127.0.0.1:8000
```

## V3 REDESIGN PRINCIPLES (enforced everywhere)
1. **AI guides the user** — every dashboard surfaces 2–3 personalised suggestion cards, AI generates descriptions/cover-notes/RFP text, AI summarises bids when 3+ exist.
2. **One thing at a time** — profile view-first with Edit per section. ESG is 3-step wizard. RFP create is inline.
3. **Click-based onboarding** — quiz with auto-advance. Users click, never type unless required.
4. **Module-level sub-components ALWAYS** — sub-components defined inside parent = re-mount on every keystroke = focus lost. Always define at module level.
5. **Number inputs store as string in state** — only `Number()` at submit time.
6. **Inline expansion over modals** — no modal-within-modal.

## DEPLOYMENT
- Frontend → push to GitHub main → Vercel auto-deploys
- Backend → push to GitHub main → Render auto-deploys
- **DB schema changes → run migration SQL on Neon SQL editor BEFORE pushing backend**
  - `migration_v3.sql` — original schema
  - `migration_v4.sql` — notification category/expires_at, audit_logs table, soft delete columns

## QUICK DB ADMIN
Create admin user (run from backend venv):
```bash
python -c "from app.auth import hash_password; from app.database import SessionLocal; from app import models; db=SessionLocal(); u=models.User(name='Admin',email='admin@esp.com',password=hash_password('Admin@1234'),role='admin',email_verified=True,is_active=True,verified=True); db.add(u); db.commit(); print('done')"
```

Manually verify a user's email:
```sql
UPDATE users SET email_verified=TRUE, is_active=TRUE WHERE email='user@example.com';
```

## KEY DATABASE MODELS
- **User** — id, name, email, password, role, email_verified, verified, is_active, `deleted_at`
- **VendorProfile** — 25+ fields, gstin/pan/cin verified flags, esg_score, esg_band, `deleted_at`
- **BuyerProfile** — company_type, sector, esg_procurement_policy, min_vendor_esg_score
- **VendorDocument** — document_type, status(pending/verified/rejected), file_path (R2 key or local)
- **VendorCatalogue** — PDF uploads, file_path (R2 key or local)
- **VendorService** — title, description, category (controlled taxonomy)
- **ProcurementRequest** — title, description, budget, deadline, min_esg_score, sdg_tags, `deleted_at`
- **Bid** — request_id, vendor_id, cover_note, proposed_price, timeline, status, buyer_note, `deleted_at`
- **ESGMetric** — 25 fields (E/S/G) + esg_score_computed, esg_band_computed
- **CertificationGap** — gap_type, description, action, advisory_fee, dismissed (auto-recomputed on profile/service change)
- **Notification** — user_id, message, type, **category**, is_read, link, **expires_at**
- **AuditLog** — actor_id, actor_name, action, target_type, target_id, metadata_json, ip_address, created_at
- **ChatbotFAQ, VendorRating**

## KNOWN FIXES APPLIED
1. **api.js:** `data.username` → `data.email` (was causing 422 on login)
2. **Auth.jsx:** removed direct `authAPI.login()` — now uses `useAuth().login(email, password)`
3. **email_service.py:** verification link was pointing to `APP_URL/auth/verify-email` (backend) — fixed to `FRONTEND_URL/verify-email?token=`
4. **ProfileGauge colours:** dark colours at 22% opacity invisible on navy → changed to light `#5FCFA0`/`#F5B342`/`#F5937F`
5. **Gauge needle:** wrapped `<line>` in `<g>` for reliable cross-browser rotation
6. **Layout.jsx:** sidebar nav synced to new dashboard tab structure

## RECURRING BUG: INPUT LOSES FOCUS AFTER ONE CHAR
**Cause:** Sub-component defined INSIDE parent function. Every state update creates new reference → React unmounts/remounts input → focus lost.
**Fix:** Move all sub-components to module level. NEVER define `function Foo(){}` inside another component.

## BACKEND STATUS (as of v3.1)
- ✅ All 13 P0 AI endpoints with caching + structured JSON
- ✅ Gmail SMTP + ESP-branded email templates (verify, reset, vendor approved/rejected, bid events)
- ✅ Cloudflare R2 file storage (local fallback)
- ✅ Real GST (gstincheck.co.in) + PAN/MCA (surepass.io) APIs
- ✅ Admin manual KYC override (GSTIN/PAN verify/unverify)
- ✅ Company autocomplete (`GET /vendor/company-suggest`) + AI enrichment (`POST /vendor/ai-company-enrich`)
- ✅ SSE real-time notifications (`GET /notifications/stream-token`)
- ✅ Unified notifications all roles, category/expires_at fields
- ✅ Audit log (all admin actions logged)
- ✅ Rate limiting (auth 5/min, chatbot 10/min, AI 30/min)
- ✅ In-process TTL+LRU cache (`app/services/cache_service.py`)
- ✅ Vendor ratings (complete: list, own ratings, avg auto-update)
- ✅ Bid email notifications (shortlisted/awarded/declined)
- ✅ API versioning `/api/v1/` alongside all legacy routes
- ✅ Soft delete on User/VendorProfile/ProcurementRequest/Bid
- ✅ ESG scoring trigger (auto-recompute on profile/service/cert changes)
- ✅ Admin bulk-verify (`POST /admin/vendors/bulk-verify`)
- ✅ Analytics: vendor funnel, RFP funnel, ESG distribution, AI usage (`/admin/analytics/*`)
- ✅ Postgres full-text search (`GET /search?q=&type=vendor|rfp|all`)
- ✅ `/health` (DB + R2 + OpenAI ping) + `/metrics` (live SSE connections, cache stats)
- ⏳ DigiLocker OAuth (complex, deferred)
- ⏳ Background task queue / Celery (deferred)
- ⏳ Razorpay payments (deferred)
- ⏳ Outbound webhooks (deferred)
