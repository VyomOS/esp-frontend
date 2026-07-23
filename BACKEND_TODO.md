# ESP Backend — Feature Backlog

> **Source of truth for remaining work.**
> Completed items are in `## DONE` at the bottom.
> See `FEATURES.md` for the current full route map.

**Backend path:** `C:\Users\karti\Documents\esp\backend`
**Stack:** FastAPI 0.135, SQLAlchemy 2.0, PostgreSQL (Neon), python-jose JWT, bcrypt==4.0.1, openai==2.29.0, boto3==1.38, slowapi

---

## REMAINING — DEFERRED (large / needs external setup)

### DigiLocker OAuth (P1)
**Why deferred:** Complex partner API, requires MeitY approval.
**Endpoint:** `POST /vendor/digilocker/connect` + OAuth callback
One-tap Aadhaar/PAN/GST document verification. Eliminates manual KYC upload for ~60% of vendors.

### Background Task Queue — Celery + Redis (P2)
**Why deferred:** Adds significant infra complexity.
**What to move async:** email sending, AI bid comparison precomputation, ESG re-scoring, MCA lookups.
**Options:** Celery + Redis, or RQ (simpler). Upstash Redis free tier works.

### Razorpay Payments (P4)
**Why deferred:** Needs Razorpay merchant account setup.
**Endpoints needed:**
- `POST /payments/order` — create Razorpay order
- `POST /payments/webhook` — verify HMAC signature, mark paid
- `GET /payments/mine` — user payment history
- Models: `Payment`, `PaymentItem`
**Use cases:** Certification advisory fees (`CertificationGap.advisory_fee`), premium vendor listings.

### Outbound Webhooks (P5)
**Why deferred:** Enterprise feature, no current buyer demand.
**What:** `POST /webhooks` configure URLs, sign payloads with HMAC. Events: bid_received, bid_awarded, vendor_verified.

### Sentry Error Tracking (P5)
**Why deferred:** Quick setup, just needs Sentry DSN.
**What:** `pip install sentry-sdk[fastapi]`, add `sentry_sdk.init(dsn=...)` to main.py. Captures unhandled exceptions with full context.

### OpenAPI Schema Cleanup (P5)
**Why deferred:** Low user impact, high effort.
**What:** Add `response_model=` to every endpoint. Run `openapi-typescript` to generate TS types for frontend. Group tags consistently.

### Persistent AI Usage Tracking (P5)
**Current:** In-process counters reset on restart (`_ai_stats` in ai_routes.py).
**What:** Store per-call records in DB (`ai_usage` table: user_id, endpoint, tokens_used, cost, created_at). Query in `/admin/analytics/ai-usage` for persistent history.

---

## UPDATE THIS FILE
Move completed items to `## DONE` below. Do not delete — preserved for context.

---

## DONE

### P0 — AI Endpoints (all 13 built, 2026-05-29)
All in `app/routes/ai_routes.py`. Cached (TTL+LRU), structured JSON, rule-based fallback, `gpt-4o-mini`.
1. `POST /ai/proactive-message` — chatbot auto-open, 4h cache/user
2. `POST /vendor/ai-profile-advice` — personalised suggestion cards (max 3), 1h cache
3. `POST /vendor/ai-description` — business/impact/service copy, 24h cache
4. `POST /vendor/ai-bid-draft` — cover note + price/timeline, 1h cache
5. `POST /vendor/ai-esg-insight` — ESG improvement story, 1h cache
6. `POST /buyer/ai-rfp-draft` — RFP description + impact requirements, 2h cache
7. `POST /buyer/ai-bid-comparison` — bid summary + recommendation, 1h cache/rfp
8. `POST /buyer/ai-suggestions` — buyer home suggestion cards, 1h cache
9. `GET /buyer/vendors/{rfp_id}/ai-matches` — vendor matches with pre-written reasons, 1h cache
10. `POST /vendor/ai-company-enrich` — MCA lookup + AI profile fill, 24h cache
11. `POST /admin/ai-doc-check` — KYC doc review, 30min cache
12. `GET /admin/ai-platform-insight` — platform health, 1h cache
13. `GET /admin/ai-platform-insight` — impact narrative, 6h cache
- `POST /chatbot/chat` improved: rate limited (10/min), returns both `reply` and `response` keys

### P0 — Email Fixes (2026-05-29)
- Fixed verification link: was `APP_URL/auth/verify-email` (backend) → now `FRONTEND_URL/verify-email?token=`
- Upgraded all 4 email templates to ESP design system (navy/teal/cream, Playfair headings)
- Password reset link was already correct

### P0 — Admin Notification Targets (2026-05-29)
- `POST /admin/notifications/send` now handles `vendors` and `buyers` targets (was only `all` and `individual`)
- Added 400 error for invalid target values

### P2 — In-process Cache (2026-05-29)
- `app/services/cache_service.py` — TTLCache (LRU+TTL, 500 entries, 1h default). `ai_cache` global instance.
- Drop-in compatible with Redis/Upstash when needed.

### P2 — Rate Limiting (2026-05-29)
- `app/limiter.py` — shared slowapi Limiter, imported by all route files
- `/auth/register`, `/auth/login`, `/auth/forgot-password`: 5/min/IP
- `/chatbot/chat`: 10/min/IP
- All AI endpoints: 30/min/IP

### P2 — Gmail SMTP (2026-05-29)
- `app/services/email_service.py` using smtplib STARTTLS with Gmail App Password
- Templates: verification, password reset, vendor approved, vendor rejected, bid status (shortlisted/awarded/declined)
- `.env.example` documents all required vars

### P2 — Cloudflare R2 File Storage (2026-05-29)
- `app/services/file_service.py` fully rewritten — R2 via boto3 with local disk fallback
- `file_path` column stores R2 key (no `uploads/` prefix) or local path
- `get_file_url()` returns presigned URL (1h) or public URL (`R2_PUBLIC_URL`)
- Document list responses include `view_url` per document
- Admin download endpoint redirects to R2 presigned URL
- Old local files still served via `FileResponse` (backward compat)

### P1 — Real KYC APIs (2026-05-29)
- `POST /vendor/verify-gst` — real gstincheck.co.in API (stub if key missing)
- `POST /vendor/verify-pan` — real surepass.io API (stub if key missing)
- `POST /vendor/lookup-company` — real surepass.io MCA CIN + search-by-name

### P1 — Admin Manual KYC Override (2026-05-29)
For when automated API check fails but admin has reviewed docs visually:
- `POST /admin/vendors/{id}/verify-gstin` / `unverify-gstin`
- `POST /admin/vendors/{id}/verify-pan` / `unverify-pan`
All notify vendor + write to audit log.

### P1 — Company Autocomplete + AI Enrichment (2026-05-29)
- `GET /vendor/company-suggest?q=` — MCA search-by-name for autocomplete dropdown
- `POST /vendor/ai-company-enrich` — takes `{company_name, cin?}`, fetches MCA data, AI generates `{organization_name, location, category, description, year_founded, cin, directors, mca_verified}`

### P3 — SSE Real-time Notifications (2026-05-29)
- `app/routes/notification_routes.py` — new file, all roles
- `GET /notifications` — unified (replaces buyer-only `/buyer/notifications`). Filters: `unread_only`, `category`, `limit`.
- `PATCH /notifications/{id}/read`, `POST /notifications/mark-all-read`, `DELETE /notifications/{id}`
- `GET /notifications/stream` — SSE via `Authorization: Bearer` header
- `GET /notifications/stream-token?token=` — SSE via query param for browser `EventSource`
- `GET /notifications/chatbot-pending` — unread bid/profile notifs for chatbot proactive display
- `app/utils/notifications.py` updated: `create_notification()` now also pushes live to all open SSE queues

### P3 — Notification Model Improvements (2026-05-29)
- Added `category` (bid|profile|system|broadcast) and `expires_at` to `Notification` model
- `migration_v4.sql` adds these columns to existing table

### P4 — Vendor Ratings Complete (2026-05-29)
- `GET /vendor/{id}/ratings` — public list for buyer to see before bidding
- `GET /vendor/profile/me/ratings` — vendor sees own ratings
- `POST /buyer/rate` — now auto-recomputes `avg_rating` on `VendorProfile` after submit
- `GET /buyer/rating/{vendor_id}` — now includes full reviews list + `my_rating` field

### P4 — Bid Email Notifications (2026-05-29)
- Vendors receive email on: shortlisted, awarded, declined
- Template uses ESP design system (navy/teal/cream)
- `under_review` is in-app only (avoids inbox noise)

### P4 — Audit Log (2026-05-29)
- `AuditLog` model + `audit_logs` table (migration_v4.sql)
- `app/utils/audit.py` — `log_action(db, actor_id, actor_name, action, target_type, target_id, metadata)`
- `GET /admin/audit-log` — filter by action/actor/target/date, paginated
- Logged: vendor verify/reject/unverify, GSTIN/PAN manual override, document status, bid status, user deactivate, bulk-verify, broadcast notifications

### P4 — Admin Bulk Verify (2026-05-29)
- `POST /admin/vendors/bulk-verify` — body `{vendor_ids:[1,2,3]}`, max 50
- Sends email + in-app notification to each vendor
- Returns `{verified, skipped, not_found}` summary
- Audit logged

### P4 — ESG Scoring Trigger (2026-05-29)
- `_recompute_vendor_derived(profile, db)` in vendor_routes.py
- Auto-runs on: `PATCH /vendor/profile/me`, `POST /vendor/services`, `DELETE /vendor/services/{id}`
- Re-runs certification gap detection + refreshes ESG score from latest ESGMetric

### P4 — Analytics (2026-05-29)
- `app/routes/analytics_routes.py`
- `GET /admin/analytics/vendor-funnel` — 5 stages
- `GET /admin/analytics/rfp-funnel` — 5 stages
- `GET /admin/analytics/esg-distribution` — per-band counts + histogram + platform avg
- `GET /admin/analytics/ai-usage` — in-process call counters + audit action volume

### P5 — API Versioning (2026-05-29)
- All routes available at both `/vendor/...` AND `/api/v1/vendor/...`
- No breaking changes — both work indefinitely
- Implemented in main.py via `_ROUTERS` loop

### P5 — Soft Delete (2026-05-29)
- `deleted_at TIMESTAMPTZ` column added to: `users`, `vendor_profiles`, `procurement_requests`, `bids`
- Bid withdrawal (`DELETE /bids/{id}`) sets `deleted_at` instead of deleting row
- Request deletion (`DELETE /buyer/requests/{id}`) sets `deleted_at`
- All list queries filter `deleted_at == None`
- Migration: `migration_v4.sql`

### P5 — RBAC Improvements (2026-05-29)
- `require_any_role(*roles)` alias in `app/auth.py`
- `Perm` class with permission constants (`VENDOR_READ`, `BID_SUBMIT`, etc.)
- `ROLE_PERMISSIONS` dict mapping roles to permission sets
- `has_permission(user, perm)` helper function

### P5 — Health + Metrics (2026-05-29)
- `GET /health` — pings DB (latency), R2 (head_bucket), OpenAI (models.list). Returns `{status:"healthy|degraded", checks:{...}}`
- `GET /metrics` — live SSE connection count, AI cache entries, platform DB counts

### P5 — Postgres Full-Text Search (2026-05-29)
- Vendor list `GET /vendor/?search=` upgraded from ILIKE to `plainto_tsquery` across name/description/category/location
- `GET /search?q=&type=vendor|rfp|all` — unified cross-entity FTS endpoint in main.py

### P5 — Improved /health endpoint (2026-05-29)
- Checks: DB ping with latency, R2 bucket reachability, OpenAI connectivity
- Returns structured `{status, version, checks}` — use as Render health check path
