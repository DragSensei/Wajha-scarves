# Project: Diya (Wajha Scarves) Core Features Implementation

## Architecture
- **Frontend**: React + Vite + Tailwind CSS (`app/`, `features/`, `shared/`).
- **Backend**: Python Flask (`api/core/`, `api/features/`).
- **Database**: Neon Postgres / Local SQLite via SQLAlchemy (`api/core/models.py`) and Flask-Migrate.

## Code Layout
- `app/` — Application shell, routing, global style imports.
- `features/` — Domain-specific client features (`auth`, `authorization`, `products`, `categories`, `cart`, `admin`, `loyalty`, etc.).
- `shared/` — Common client UI components, API wrappers, utilities.
- `api/core/` — Server models (`models.py`), DB initialization (`db.py`).
- `api/features/` — Server feature blueprints, routes, services, schemas.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Data Models & Schema Migrations | Modify models.py for User, MembershipTier, DonationRecord, GiftCard, LoyaltyPointsEntry, LoyaltyVoucher, ReferralConversion; generate and apply migration with default seeds. | None | DONE |
| 2 | M2: Admin Settings & Tiers Management | Whitelist 15 setting keys, update SettingsAdmin.jsx, implement /admin/tiers and TiersManager.jsx for tier CRUD. | M1 | IN_PROGRESS |
| 3 | M3: Mandatory Birthdate Gate | Require birthdate on registration, generate referral code, make profile birthdate immutable, redirect logged-in users without birthdate to /onboarding/birthdate. | M1 | PLANNED |
| 4 | M4: Admin Donations Panel | Add /admin/donations and DonationsManager.jsx for live donation accruals, period status toggles, notes, and pending alerts. | M1 | PLANNED |
| 5 | M5: Gift Cards & Checkout Redemption | Admin gift card generation (16-char hex), checkout validation, rate limiting (3 req/min/IP), and synchronous redemption on order. | M1, M2 | PLANNED |
| 6 | M6: Loyalty, Referrals & Vercel Cron Jobs | Loyalty API routes (/status, /history, /convert), RewardsPanel.jsx at /rewards, referral link generation, checkout voucher redemption, hourly reconciliation cron & daily birthday cron. | M1, M2, M3 | PLANNED |
| 7 | M7: Admin Sidebar & Email Banner | Categorize admin sidebar (STORE, ENGAGEMENT, SYSTEM), reduce font size to 0.85rem, fetch email quota warning status for admin overview banner. | M2 | PLANNED |
| 8 | M8: E2E Verification & Boundary Audit | Verify all requirements R1-R7 and acceptance criteria AC, run ESLint and import-linter, verify migrations and zero violations. | M1-M7 | PLANNED |

## Interface Contracts
### Client ↔ Server API
- Registration: POST `/api/auth/register` (payload: email, password, birth_date, optional ref). Returns user dict with `birth_date`, `referral_code`.
- Profile: GET/PUT `/api/auth/profile` (payload: birth_date). Returns user dict with `birth_date`.
- Settings: GET/PUT `/api/admin/settings` (allowed 15 settings).
- Tiers: GET/POST/PUT/DELETE `/api/admin/tiers`.
- Donations: GET/PUT `/api/admin/donations`.
- Gift Cards: GET/POST `/api/admin/gift-cards`, POST `/api/checkout/validate-gift-card`, POST `/api/checkout/orders` (supports gift_card_code).
- Loyalty & Referrals: GET `/api/loyalty/status`, GET `/api/loyalty/history`, POST `/api/loyalty/convert`, GET/POST `/api/loyalty/cron/reconcile`, GET/POST `/api/loyalty/cron/birthdays`.
