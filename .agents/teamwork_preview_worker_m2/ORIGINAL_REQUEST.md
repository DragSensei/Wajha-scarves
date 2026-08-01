## 2026-07-30T15:08:54Z
You are Worker 1 for Milestone 2 (App Settings Whitelist & Admin Tiers Manager).
Your working directory is `c:/Project/Wajha Technologies/Wajha Scarves/.agents/teamwork_preview_worker_m2/`.

Read the Explorer reports:
- Explorer 1: `c:/Project/Wajha Technologies/Wajha Scarves/.agents/teamwork_preview_explorer_m2_1/analysis.md`
- Explorer 2: `c:/Project/Wajha Technologies/Wajha Scarves/.agents/teamwork_preview_explorer_m2_2/analysis.md`
- Explorer 3: `c:/Project/Wajha Technologies/Wajha Scarves/.agents/teamwork_preview_explorer_m2_3/analysis.md`

Your tasks:
1. **Backend Implementation**:
   - In `api/features/admin/routes.py`, `services.py`, `schemas.py`:
     - Implement `/api/admin/tiers` endpoints (GET, POST, PUT, DELETE) for `MembershipTier` CRUD.
     - Support user ranking / spend breakdown endpoint `GET /api/admin/tiers/users` calculating lifetime completed-order spend (`Order.status == 'completed'`).
     - Ensure `db.session.rollback()` on exceptions (e.g. duplicate tier name).
     - Ensure settings PUT endpoint validates keys against `ALLOWED_SETTINGS` and converts/validates value strings.
   - Register any necessary tier routes/blueprints in `api/__init__.py`.

2. **Backend Unit Tests**:
   - Write comprehensive Pytest test suite `tests/test_m2_settings_tiers.py` testing settings GET/PUT, tier CRUD (GET, POST, PUT, DELETE), validation errors, duplicate names (409), sort order, and user lifetime completed-order spend calculation.

3. **Frontend Implementation**:
   - Update `shared/lib/api.js` with helper methods: `getTiers`, `createTier`, `updateTier`, `deleteTier`, `getTierUsers` (with standalone fallback mock handling if offline).
   - Update `features/admin/components/SettingsAdmin.jsx`: Redesign form into 3 categorized tabbed sections (General & Store Promotions, Loyalty & Points, Referrals & Vouchers) handling all 19 `ALLOWED_SETTINGS` keys.
   - Create `features/admin/components/TiersManager.jsx` in `features/admin/components/`:
     - Render `MembershipTier` CRUD table ordered by `sort_order` with modal dialogs for Create, Edit, Delete.
     - Render Customer Tier Ranking table displaying users, lifetime completed spend, and current tier badge.
   - Update `app/App.jsx` to register the `/admin/tiers` route protecting it with admin auth guard.
   - Update `features/admin/components/Sidebar.jsx` to include `Membership Tiers` link (`/admin/tiers`).

4. **Verification & Boundaries**:
   - Run `pytest tests/test_m2_settings_tiers.py` and `pytest tests/test_m1_1_models.py`.
   - Run `npm run lint` and verify ZERO ESLint errors or boundary warnings.
   - Run `import-linter lint` (or `python -m importlinter lint` / `lint-imports.exe`) and verify 0 broken contracts.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your changes report `changes.md` and handoff report `handoff.md` in `c:/Project/Wajha Technologies/Wajha Scarves/.agents/teamwork_preview_worker_m2/` and notify parent when complete.
