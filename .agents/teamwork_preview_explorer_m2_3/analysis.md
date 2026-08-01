# Milestone 2: Verification Criteria, Test Strategy & Edge Case Analysis
**Explorer 3 — Milestone 2 (App Settings Whitelist & Admin Tiers Manager)**

---

## 1. Executive Summary & Objective
Milestone 2 (M2) focuses on establishing key-value application configuration editing via an allowed settings whitelist, alongside full CRUD operations for membership tiers managed by administrators.

This analysis provides:
- Concrete test specifications and Pytest suite design (`tests/test_m2_settings_tiers.py`).
- Verification criteria for backend endpoints GET/PUT `/api/admin/settings` and GET/POST/PUT/DELETE `/api/admin/tiers`.
- Logic for user lifetime spend calculations and membership tier ranking.
- Comprehensive edge cases, integrity pitfalls, and boundary import rules.
- Step-by-step terminal commands for independent verification.

---

## 2. Milestone 2 Requirements & Verification Criteria Analysis

### 2.1 Settings Whitelist & Admin Settings GET/PUT (`/api/admin/settings`)
- **Config Whitelist (`Config.ALLOWED_SETTINGS`)**:
  All configuration keys sent via `PUT /api/admin/settings` MUST be validated against the whitelist. Any unwhitelisted key must trigger an HTTP 400 Bad Request error.
  - Whitelisted keys (19 keys configured in `api/__init__.py`):
    - `sale_active`, `discount_active`, `discount_percent`, `custom_sale_text`, `discount_categories`, `discount_product_ids`, `whatsapp_number`, `contact_number`, `sale_bundle_name`, `owner_whatsapp`
    - M2 Loyalty & Referral additions: `points_per_egp`, `points_to_egp_rate`, `review_bonus_points`, `social_follow_bonus_points`, `referral_voucher_amount`, `referral_voucher_min_spend`, `referral_min_order_amount`, `points_expiry_months`, `voucher_expiry_months`
- **GET Endpoint (`GET /api/admin/settings`)**:
  - Requires `@admin_required` decorator.
  - Returns HTTP 200 with JSON object mapping setting keys to their current text values `{key: value}`.
- **PUT Endpoint (`PUT /api/admin/settings`)**:
  - Requires `@admin_required` decorator.
  - Validates request payload is JSON object.
  - Validates every key against `ALLOWED_SETTINGS`.
  - Validates all values are strings (or valid string representations).
  - Persists settings using `Setting.set_setting(key, value)`.
  - Updates request-level (`flask.g`) and app-level (`_APP_SETTINGS_CACHE`) caches.
  - Returns HTTP 200 with the full updated settings dictionary.

---

### 2.2 Admin Tiers Manager CRUD (`/api/admin/tiers`)
- **Data Model (`MembershipTier` in `api/core/models.py`)**:
  - `id`: Integer, Primary Key
  - `name`: String(50), Unique, Nullable=False
  - `spend_threshold`: Float, Default=0.0
  - `sort_order`: Integer, Default=0
- **GET Endpoint (`GET /api/admin/tiers`)**:
  - Requires `@admin_required` decorator.
  - Returns list of membership tiers sorted by `MembershipTier.sort_order.asc(), MembershipTier.spend_threshold.asc()`.
  - Return JSON: `{"tiers": [...]}` with HTTP 200.
- **POST Endpoint (`POST /api/admin/tiers`)**:
  - Requires `@admin_required` decorator.
  - Accepts JSON payload: `{"name": "Gold", "spend_threshold": 5000.0, "sort_order": 2}`.
  - Validates:
    - `name` is non-empty string. Duplicate names return HTTP 409 Conflict.
    - `spend_threshold` is numeric and >= 0. Negative values return HTTP 400 Bad Request.
    - `sort_order` is integer >= 0. Invalid values return HTTP 400 Bad Request.
  - Returns HTTP 201 Created with created tier dictionary `{"tier": tier.to_dict()}`.
- **PUT Endpoint (`PUT /api/admin/tiers/<int:tier_id>`)**:
  - Requires `@admin_required` decorator.
  - Returns HTTP 404 Not Found if `tier_id` does not exist.
  - Validates `name` uniqueness if changed. Duplicate names return HTTP 409 Conflict.
  - Updates fields and returns HTTP 200 OK with updated tier dictionary.
- **DELETE Endpoint (`DELETE /api/admin/tiers/<int:tier_id>`)**:
  - Requires `@admin_required` decorator.
  - Returns HTTP 404 Not Found if `tier_id` does not exist.
  - Deletes tier record and returns HTTP 200 OK with success message.

---

### 2.3 User Lifetime Spend & Tier Ranking Logic
- **Lifetime Spend Calculation**:
  - Spend is calculated strictly as the sum of `Order.total_amount` for orders where `Order.user_id == user.id` AND `Order.status == 'completed'`.
  - Pending, cancelled, or processing orders MUST NOT be included in spend calculations.
  - Orders belonging to other users or guest checkouts MUST NOT leak into the target user's spend.
- **Tier Assignment Strategy**:
  - Retrieve all `MembershipTier` records ordered by `spend_threshold.desc()`.
  - Target tier is the first tier where `user_spend >= tier.spend_threshold`.
  - If `user_spend < lowest_threshold`, user is assigned the base tier (spend_threshold = 0.0).

---

## 3. Pytest Unit Test Suite Architecture (`tests/test_m2_settings_tiers.py`)

Below is the complete design specification for the unit test file `tests/test_m2_settings_tiers.py`.

### 3.1 Test Fixtures Setup
- **`app` Fixture**: Creates Flask test application configured with `sqlite:///:memory:`, initializes DB schema via `db.create_all()`, seeds default settings and admin user, yields app context, and tears down via `db.drop_all()`.
- **`client` Fixture**: Yields Flask test client.
- **`admin_client` Fixture**: Authenticates as an admin user (session or JWT header) to allow testing `@admin_required` endpoints.
- **`regular_client` Fixture**: Authenticates as a standard non-admin student user to verify 401/403 access control.

---

### 3.2 Test Case Specifications

#### Class 1: `TestAdminSettingsAPI`
| Test Function | Description / Actions | Expected Status & Result |
|---|---|---|
| `test_get_settings_unauthorized` | Send GET `/api/admin/settings` without admin credentials | 401 Unauthorized / 403 Forbidden |
| `test_get_settings_success` | Send GET `/api/admin/settings` with admin session | 200 OK, returns dict of settings |
| `test_update_settings_success` | Send PUT `/api/admin/settings` with valid JSON `{"points_per_egp": "2", "review_bonus_points": "100"}` | 200 OK, returns updated dict; DB and cache reflect new values |
| `test_update_settings_invalid_key` | Send PUT `/api/admin/settings` with unwhitelisted key `{"unauthorized_config": "hack"}` | 400 Bad Request with error message `"Invalid setting key"` |
| `test_update_settings_non_string_value` | Send PUT `/api/admin/settings` with non-string value `{"points_per_egp": 100}` | 400 Bad Request ("Setting values must be strings") |
| `test_update_settings_partial_update` | Update 2 out of 19 settings via PUT | 200 OK, updated 2 keys while preserving existing un-edited keys |
| `test_update_settings_non_json_body` | Send PUT with raw plain text or invalid JSON body | 400 Bad Request ("Request body must be a JSON object") |

#### Class 2: `TestAdminTiersAPI`
| Test Function | Description / Actions | Expected Status & Result |
|---|---|---|
| `test_get_tiers_empty` | GET `/api/admin/tiers` when table is empty | 200 OK, `{"tiers": []}` |
| `test_create_tier_success` | POST `/api/admin/tiers` with `{"name": "Silver", "spend_threshold": 1000.0, "sort_order": 1}` | 201 Created, returns tier dict |
| `test_create_tier_missing_name` | POST `/api/admin/tiers` with `{"spend_threshold": 1000.0}` | 400 Bad Request |
| `test_create_tier_duplicate_name` | Create "Bronze" tier, then POST another tier with `name: "Bronze"` | 409 Conflict ("Tier name already exists") |
| `test_create_tier_negative_threshold` | POST with `{"name": "Invalid", "spend_threshold": -100.0}` | 400 Bad Request |
| `test_create_tier_invalid_sort_order` | POST with `{"name": "Invalid", "sort_order": "abc"}` | 400 Bad Request |
| `test_get_tiers_ordered_by_sort_order` | Create tiers with sort_order 3, 1, 2. Send GET `/api/admin/tiers` | 200 OK, tiers returned in order 1, 2, 3 |
| `test_update_tier_success` | PUT `/api/admin/tiers/<id>` with `{"spend_threshold": 1500.0}` | 200 OK, threshold updated in DB |
| `test_update_tier_not_found` | PUT `/api/admin/tiers/9999` | 404 Not Found |
| `test_update_tier_duplicate_name` | Update Tier 2 name to Tier 1's name | 409 Conflict |
| `test_delete_tier_success` | DELETE `/api/admin/tiers/<id>` | 200 OK, tier deleted from DB |
| `test_delete_tier_not_found` | DELETE `/api/admin/tiers/9999` | 404 Not Found |
| `test_tiers_unauthorized_access` | GET/POST/PUT/DELETE `/api/admin/tiers` with non-admin user | 401/403 |

#### Class 3: `TestUserSpendAndTierRanking`
| Test Function | Description / Actions | Expected Status & Result |
|---|---|---|
| `test_user_spend_completed_orders_only` | Create User 1; create Order 1 ($1000, completed), Order 2 ($1500, completed), Order 3 ($5000, pending), Order 4 ($3000, cancelled). Calculate user lifetime spend. | Spend equals exactly 2500.0. Pending and cancelled orders are excluded. |
| `test_user_spend_zero_orders` | Create User 2 with zero orders. Calculate spend. | Spend equals 0.0. |
| `test_user_tier_assignment_thresholds` | Create Tiers: Bronze ($0), Silver ($1000), Gold ($5000). Test user with spend $0 -> Bronze; $2500 -> Silver; $5000 -> Gold. | Correct tier assigned based on completed order spend thresholds. |

---

### 3.3 Reference Test File Code Specification (`tests/test_m2_settings_tiers.py`)

```python
import pytest
from api import create_app
from api.core.db import db
from api.core.models import User, Setting, MembershipTier, Order

class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    ALLOWED_SETTINGS = {
        'sale_active', 'discount_active', 'discount_percent', 'custom_sale_text', 
        'discount_categories', 'discount_product_ids', 'whatsapp_number', 
        'contact_number', 'sale_bundle_name', 'owner_whatsapp',
        'points_per_egp', 'points_to_egp_rate', 'review_bonus_points', 
        'social_follow_bonus_points', 'referral_voucher_amount', 
        'referral_voucher_min_spend', 'referral_min_order_amount', 
        'points_expiry_months', 'voucher_expiry_months'
    }

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        # Seed admin user
        admin = User(email="admin@example.com", full_name="Admin User", role="admin")
        admin.set_password("adminpass123")
        # Seed regular user
        student = User(email="student@example.com", full_name="Student User", role="student")
        student.set_password("studentpass123")
        db.session.add_all([admin, student])
        db.session.commit()
        
        yield app
        
        db.session.remove()
        db.drop_all()

@pytest.fixture
def admin_client(app):
    client = app.test_client()
    client.post('/api/auth/login', json={"email": "admin@example.com", "password": "adminpass123"})
    return client

@pytest.fixture
def regular_client(app):
    client = app.test_client()
    client.post('/api/auth/login', json={"email": "student@example.com", "password": "studentpass123"})
    return client
```

---

## 4. Integrity Pitfalls, Edge Cases & Risk Prevention Matrix

| Risk / Pitfall | Impact | Prevention & Remediation Strategy |
|---|---|---|
| **Poisoned DB Session on Duplicate Keys** | Unhandled `IntegrityError` on duplicate tier name crashes server or leaves DB session corrupted. | Wrap tier creation and updates in `try...except IntegrityError:` blocks with explicit `db.session.rollback()` and return HTTP 409 Conflict. |
| **Settings Cache Desynchronization** | `Setting.get_setting` returns stale values because `_APP_SETTINGS_CACHE` or `g._settings_cache` was not updated. | `Setting.set_setting` must explicitly update `_APP_SETTINGS_CACHE[key] = value` and reset request cache `g._settings_cache`. |
| **Incorrect Spend Calculations** | Including `pending`, `cancelled`, or `refunded` orders inflates customer lifetime spend. | Queries calculating user spend MUST filter strictly on `Order.status == 'completed'`. |
| **ESLint Import Boundary Violation** | Importing from `features/admin/` inside `features/products/` or `shared/` causes lint failure. | Strict adherence to `package.json` boundaries. `features/admin/` is isolated and only consumed by `app/` routers. |
| **Server-Side Import Linter Violation** | Other feature blueprints (e.g. `auth`, `products`, `cart`) importing from `api.features.admin` breaks `.importlinter`. | Keep `api.features.admin` imports unidirectional: Admin can import from core/shared, but core features MUST NOT import from `admin`. |
| **Hardcoded Mock Fallbacks in Tests** | Unit tests passing against client-side `mockData.js` instead of Flask SQLAlchemy endpoints. | Tests must hit Flask endpoints directly via `test_client()` using SQLite memory DB, without mock short-circuiting. |
| **Type Coercion Flaws in PUT Settings** | Sending numbers, lists, or booleans to `PUT /api/admin/settings` causes DB schema errors or type mismatches. | Validate that all submitted setting values are strings (`isinstance(val, str)`). Reject non-string values with 400 Bad Request. |

---

## 5. Step-by-Step Verification Commands Protocol

To independently verify Milestone 2 implementation, test suite, and architectural integrity, execute the following commands in sequence:

### Step 1: Run Pytest for Milestone 2 Settings & Tiers
```bash
pytest tests/test_m2_settings_tiers.py -v
```

### Step 2: Run Pytest Regression Suite for Existing Models & Features
```bash
pytest tests/test_m1_1_models.py tests/test_my_orders.py tests/test_search.py -v
```

### Step 3: Run Frontend ESLint Import Boundary Check
```bash
npm run lint
```
*Verification standard: Must finish with 0 errors.*

### Step 4: Run Server-Side Python Import Linter Check
```bash
import-linter lint
```
*Verification standard: Must report `2 contracts kept, 0 broken`.*

---
