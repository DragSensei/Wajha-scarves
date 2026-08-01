# Original User Request

## 2026-07-30T14:41:29Z

Implement 5 core backend & frontend features for Diya (Wajha Scarves): Donations tracking, Admin configuration & Tiers, Birthdate onboarding, Loyalty & Referrals program, and Gift Cards.

Working directory: c:/Project/Wajha Technologies/Wajha Scarves
Integrity mode: demo

## Requirements

Ensure all code follows the **ponytail** principles (laziest solution that actually works, native platform features like `<input type="date">` over external picker libraries, minimal dependencies, reuse existing config store and code).

### R1. Core Data Models and Database Schema
- Modify models.py:
  - `User`: Add `birth_date` (db.Date, nullable=True), `referral_code` (db.String(12), unique=True), and `referred_by_id` (db.Integer, Foreign Key to `users.id`, nullable=True). Update `to_dict()` to include `birth_date` and `referral_code`.
  - Add `MembershipTier`: `id` (int), `name` (string, unique), `spend_threshold` (float), `sort_order` (int).
  - Add `DonationRecord`: `id` (int), `period` (string, unique, e.g. "2026-Q3"), `status` (string, default "pending"), `donated_at` (datetime), `note` (text).
  - Add `GiftCard`: `id` (int), `code` (string, unique), `value` (float), `is_redeemed` (boolean), `redeemed_at` (datetime), `expires_at` (datetime), `created_at` (datetime).
  - Add `LoyaltyPointsEntry` (points ledger): `id` (int), `user_id` (FK), `amount` (int), `source` (string), `ref_id` (int, nullable), `earned_at` (datetime), `expires_at` (datetime, nullable).
  - Add `LoyaltyVoucher`: `id` (int), `user_id` (FK), `value` (float), `source` (string), `created_at` (datetime), `expires_at` (datetime), `redeemed` (boolean), `min_order_amount` (float).
  - Add `ReferralConversion`: `id` (int), `referrer_id` (FK), `referee_id` (FK), `qualifying_order_id` (FK to `order.id`), `reward_issued` (boolean), `created_at` (datetime).
- Create and run migration: `python -m flask --app api db migrate` and `upgrade`. Include a migration data seed step to insert the default configurations into the `Setting` table.

### R2. Settings whitelist & Admin Configuration Editor
- Add all 15 configuration keys to the whitelist in app config (`ALLOWED_SETTINGS`).
- Update `SettingsAdmin.jsx` to let administrators edit the settings under categorized sections.
- Create `/admin/tiers` and a corresponding `TiersManager.jsx` component for full tier CRUD (ordered by sort_order, ranking users by lifetime completed-order spend).
- Default seeds for key settings:
  - `points_per_egp`: 1
  - `points_to_egp_rate`: 10 (10 points = 1 EGP)
  - `review_bonus_points`: 50
  - `social_follow_bonus_points`: 50
  - `referral_voucher_amount`: 200
  - `referral_voucher_min_spend`: 2000
  - `referral_min_order_amount`: 2000
  - `points_expiry_months`: 6
  - `voucher_expiry_months`: 1

### R3. Mandatory Birthdate Gate
- Update registration: Make `birth_date` required during customer registration (validate format is YYYY-MM-DD).
- Profile page: Allow updating `birth_date` if currently empty, but make it immutable once set to prevent reward gaming.
- Onboarding gate: If a logged-in user doesn't have `birth_date` set, redirect all customer pages to a centered legacy-onboarding page `/onboarding/birthdate` forcing them to input it.

### R4. Admin Donations Panel
- Add `/admin/donations` and `DonationsManager.jsx` listing periods, live accrued donation amounts (sum of completed orders total_amount × donation percentage), a status toggle (pending → donated) with note field, and historical list.
- Alert the admin if the current period is ended and status is still "pending".

### R5. Gift Cards Generator and Checkout Redemption
- Under admin, allow generating gift cards (16-char hex code, expiry frozen at creation from settings).
- Update the checkout path (`api_create_order` and frontend `CheckoutPage.jsx`) to accept a gift card code, validate it (not expired, not redeemed), rate-limit validation attempts to 3 per minute per IP, and redeem it synchronously on successful order placement.

### R6. Loyalty, Referrals & Vercel Cron Jobs
- Create loyalty API routes (`/api/loyalty/status`, `/api/loyalty/history`, `/api/loyalty/convert`).
- Create `RewardsPanel.jsx` at `/rewards` showing points ledger, active vouchers, conversion tools, and a copyable referral link (`{origin}/register?ref={code}`).
- Add two Vercel Cron endpoints in `vercel.json` hitting protected endpoints (checked via `CRON_SECRET` header):
  - Hourly order reconciliation (`/api/loyalty/cron/reconcile`) to credit order points and check referral conversions.
  - Daily birthday reward check (`/api/loyalty/cron/birthdays`) to issue birthday vouchers to qualified tier users.
- Support voucher redemption during checkout, updating order total and flagging the voucher as redeemed.

### R7. Admin Sidebar & Email Quota Banner
- Group the admin sidebar links under categories (STORE, ENGAGEMENT, SYSTEM) and reduce the font size to `0.85rem` for compact layout.
- Fetch email quota warning status in admin overview and show a warnings banner if the limit threshold is exceeded. (Skip increment hook logic until email sending code is implemented).

## Acceptance Criteria

### Technical & Code Boundary Compliance
- [ ] No ESLint import boundary errors: running `npm run lint` finishes successfully.
- [ ] No python server-side import boundary violations: `import-linter lint` succeeds.
- [ ] All database schemas generated correctly and successfully upgraded via Flask-Migrate.

### Functional Verification
- [ ] Registration requires birthdate and generates unique 12-char referral code.
- [ ] Logged-in users without birthdate are blocked from all customer routes and redirected to `/onboarding/birthdate`.
- [ ] Setting birthdate once makes the input immutable on the profile screen.
- [ ] Admin settings update correctly on PUT and reflect changes across the site.
- [ ] Admin can generate gift cards; checkout successfully validates/applies discount and marks card redeemed on checkout.
- [ ] Rate limits apply to gift card validation endpoint (3 per minute).
- [ ] Rewards panel correctly displays points, history, vouchers, and supports converting points.
- [ ] Vercel cron endpoints verify the secret and run reconciliation/birthday logic successfully.
- [ ] Admin sidebar grouped correctly with smaller font sizing.
