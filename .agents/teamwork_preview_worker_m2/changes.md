# Changes Report — Milestone 2 (App Settings Whitelist & Admin Tiers Manager)

## Summary of Changes

### 1. Backend Implementation (`api/features/admin/`, `api/__init__.py`)
- **`api/features/admin/__init__.py`**:
  - Registered and exported `admin_tiers_bp = Blueprint('admin_tiers', __name__)`.
- **`api/__init__.py`**:
  - Imported `admin_tiers_bp` from `api.features.admin` and registered it with `url_prefix='/api/admin/tiers'`.
- **`api/features/admin/schemas.py`**:
  - Created `validate_tier_data(data, is_update=False)` enforcing tier name non-emptiness/length, non-negative numerical spend threshold, and integer sort order.
- **`api/features/admin/services.py`**:
  - Added custom exceptions `DuplicateTierError` and `ProtectedTierError`.
  - Implemented `get_all_tiers()`, `create_tier(data)`, `update_tier(tier, data)`, and `delete_tier(tier)` with explicit `db.session.rollback()` error handling.
  - Implemented `get_user_rankings()` calculating lifetime completed-order spend (`Order.status == 'completed'`), allocating highest qualifying `MembershipTier` per spend threshold, and ordering active users descending by spend.
- **`api/features/admin/routes.py`**:
  - Registered `GET`, `POST`, `PUT`, `DELETE` endpoints for `/api/admin/tiers`.
  - Registered `GET /api/admin/tiers/users` endpoint for customer spend rankings.
  - Updated `update_settings()` endpoint to validate keys against `ALLOWED_SETTINGS` whitelist, coerce/validate numerical & boolean values to strings, and rollback on error.

### 2. Backend Unit Test Suite (`tests/test_m2_settings_tiers.py`)
- Created comprehensive test suite `tests/test_m2_settings_tiers.py` containing 23 tests:
  - Settings GET & PUT (admin auth, whitelist validation, non-string rejection, partial updates, non-JSON handling).
  - MembershipTier CRUD (POST 201, GET 200, PUT 200, DELETE 200, missing name 400, duplicate name 409 conflict, negative threshold 400, invalid sort order 400, sort order ascending sorting, 404 not found).
  - Lifetime completed-order spend calculation and tier ranking (`Order.status == 'completed'`, zero-order base tier allocation, exclusion of pending/cancelled orders).

### 3. Frontend Implementation (`shared/lib/api.js`, `features/admin/`, `app/App.jsx`)
- **`shared/lib/api.js`**:
  - Added helper methods `getTiers`, `createTier`, `updateTier`, `deleteTier`, `getTierUsers` with offline fallback mock handling.
- **`features/admin/components/SettingsAdmin.jsx`**:
  - Redesigned form into 3 categorized tabbed sections (`General & Store Promotions`, `Loyalty & Points System`, `Referrals & Vouchers`).
  - Integrated all 19 whitelisted setting keys defined in `Config.ALLOWED_SETTINGS`.
- **`features/admin/components/TiersManager.jsx`**:
  - Created new admin component with summary metric cards, `MembershipTier` CRUD table ordered by `sort_order` with modal dialogs for Create, Edit, and Delete.
  - Implemented Customer Tier Standings table displaying customer lifetime completed spend, search filter by name/email, tier selection filter, and tier badge themes.
- **`features/admin/components/Sidebar.jsx`**:
  - Added "Membership Tiers" link (`/admin/tiers`) with Crown icon.
- **`app/App.jsx`**:
  - Registered route `<Route path="/admin/tiers" element={<TiersManager />} />` protected by admin role guard.

### 4. Verification Results
- `python -m pytest tests/test_m2_settings_tiers.py` -> 23 passed in 10.59s (100%).
- `python -m pytest tests/test_m1_1_models.py` -> 3 passed in 1.50s (100%).
- `npm run lint` -> 0 ESLint errors or warnings.
- `lint-imports.exe` -> 2 contracts kept, 0 broken.
