# Database Import Boundaries & Integrity Analysis Report

**Explorer**: Explorer 3 (Milestone 1)  
**Date**: 2026-07-30  
**Scope**: `api/core/models.py`, `api/features/*`, `.importlinter`, database schema & relationships  

---

## Executive Summary

This investigation analyzed the backend module import boundaries, `import-linter` rules, and database schema integrity for `api/core/models.py` and surrounding feature modules.

**Key Findings:**
1. **Core Independence**: `api/core/models.py` contains **zero** imports from `api/features/*` modules, fully satisfying GEMINI.md boundary rules.
2. **Feature Imports & Contract Verification**: All feature modules (`auth`, `cart`, `categories`, `products`) import models directly from `api.core.models`. No non-admin feature imports from any other feature module or `admin`. Running `import-linter` verified 2 contracts passed with 0 failures.
3. **Table Naming & Foreign Key Resolution**:
   - `Order` uses table name **`order`** (singular, implicit default). Foreign keys pointing to Order MUST target `'order.id'` (not `'orders.id'`).
   - `User` uses table name **`users`** (plural, explicit `__tablename__ = 'users'`). Foreign keys pointing to User MUST target `'users.id'` (not `'user.id'`).
   - `Product` uses table name **`product`** (singular, implicit default). Foreign keys target `'product.id'`.
   - `Category` uses table name **`category`** (singular, explicit `__tablename__ = 'category'`). Foreign keys target `'category.id'`.
4. **Metadata & Relationship Resolution**: All 9 models and their foreign key constraints resolve cleanly in SQLAlchemy runtime metadata (`db.metadata.tables`) without missing table targets or ambiguous relationships.

---

## 1. Core Model Import Boundaries (`api/core/models.py`)

Inspection of `api/core/models.py` confirmed that it imports only from standard library, third-party libraries, and `api.core` internal utilities:

- `time`, `datetime`, `timezone` (Standard Library)
- `werkzeug.security` (Third-Party)
- `flask` (`has_request_context`, `g`)
- `api.core.db` (`db`)
- `api.core.crypto` (`decrypt_text`)

**Result**: 0 imports from `api/features/`. Core model layer remains completely decoupled from domain feature modules.

---

## 2. Feature Import Patterns & `import-linter` Verification

### Import Audit by Feature Module

| Feature Module | Imports from `api.core.models` | Cross-Feature / Admin Imports | Status |
|---|---|---|---|
| `api.features.auth` | `User` | None | Valid |
| `api.features.cart` | `Order`, `OrderItem`, `CartItem`, `Product` | None | Valid |
| `api.features.categories` | `Category`, `Product` | None | Valid |
| `api.features.products` | `Product`, `ProductImage`, `Category`, `Setting`, `WishlistItem` | None | Valid |
| `api.features.admin` | `Product`, `Category`, `Order`, `OrderItem`, `User`, `Setting`, `ProductImage` | `api.features.products.services.process_and_save_image` | Valid (Permitted Admin Exception) |

### Automated `import-linter` Execution
Running `import-linter` CLI via Python (`python -c "import importlinter.cli; importlinter.cli.lint_imports()"`) analyzed 32 files and 75 dependencies:
- **`Core Feature Independence`**: KEPT
- **`No imports from Admin`**: KEPT
- **Total**: 2 contracts kept, 0 broken.

---

## 3. Relational Schema, Table Naming & Foreign Key Matrix

Inspection of all SQLAlchemy models in `api/core/models.py` and database migrations (`migrations/versions/`) established the exact table names and foreign key references:

| Model Class | `__tablename__` Source | DB Table Name | Foreign Key Targets in Schema | Active Foreign Key References |
|---|---|---|---|---|
| `Category` | Explicit (`'category'`) | `category` | `'category.id'` | `parent_id` -> `'category.id'` |
| `Product` | Implicit default | `product` | `'product.id'` | `category_id` -> `'category.id'` |
| `ProductImage` | Explicit (`'product_images'`) | `product_images` | `'product_images.id'` | `product_id` -> `'product.id'` |
| `Order` | Implicit default | `order` | `'order.id'` | `user_id` -> `'users.id'` |
| `OrderItem` | Explicit (`'order_items'`) | `order_items` | `'order_items.id'` | `order_id` -> `'order.id'`, `product_id` -> `'product.id'` |
| `Setting` | Implicit default | `setting` | `'setting.id'` | None |
| `User` | Explicit (`'users'`) | `users` | `'users.id'` | None |
| `CartItem` | Explicit (`'cart_items'`) | `cart_items` | `'cart_items.id'` | `user_id` -> `'users.id'`, `product_id` -> `'product.id'` |
| `WishlistItem` | Explicit (`'wishlist_items'`) | `wishlist_items` | `'wishlist_items.id'` | `user_id` -> `'users.id'`, `product_id` -> `'product.id'` |

### Runtime Metadata Verification
Executing SQLAlchemy metadata reflection inside the application context confirmed the following resolved table keys and foreign key targets:
- `category`: `['category.id']`
- `product`: `['category.id']`
- `product_images`: `['product.id']`
- `order`: `['users.id']`
- `order_items`: `['order.id', 'product.id']`
- `setting`: `[]`
- `users`: `[]`
- `cart_items`: `['users.id', 'product.id']`
- `wishlist_items`: `['product.id', 'users.id']`

All foreign keys are properly bound with zero missing targets.

---

## 4. Critical Guidelines & Recommendations for Future Schema Changes

1. **Table Naming Target Caution**:
   - When adding features (such as Referral System, Affiliates, or Coupons), foreign key target strings MUST match the exact DB table names:
     - Target Order: `'order.id'` (**singular**). DO NOT use `'orders.id'`.
     - Target User: `'users.id'` (**plural**). DO NOT use `'user.id'`.
     - Target Product: `'product.id'` (**singular**). DO NOT use `'products.id'`.
     - Target Category: `'category.id'` (**singular**). DO NOT use `'categories.id'`.

2. **Handling Multiple Foreign Keys to Same Model**:
   - If a new model (e.g. `ReferralConversion`) defines multiple foreign keys to `User` (`referrer_id` and `referee_id`), explicit `foreign_keys` specifications in `db.relationship` are required:
     ```python
     referrer = db.relationship('User', foreign_keys=[referrer_id], backref='referrals_sent')
     referee = db.relationship('User', foreign_keys=[referee_id], backref='referrals_received')
     ```

3. **Explicit `__tablename__` Declarations**:
   - Models `Product`, `Order`, and `Setting` currently lack explicit `__tablename__` declarations (relying on Flask-SQLAlchemy default implicit naming). Adding explicit `__tablename__ = 'product'`, `__tablename__ = 'order'`, and `__tablename__ = 'setting'` in `api/core/models.py` is recommended for clarity and defense in depth.

4. **Enhance `.importlinter` Rules**:
   - Recommend adding a contract to `.importlinter` to formally prevent `api.core` from importing `api.features`:
     ```ini
     [importlinter:contract:no-core-imports-from-features]
     name = Core Independence from Features
     type = forbidden
     source_modules =
         api.core
     forbidden_modules =
         api.features
     ```

---

## 5. Verification Commands

To independently verify these findings:
```bash
# 1. Run import-linter contract check via Python
python -c "import importlinter.cli; importlinter.cli.lint_imports()"

# 2. Verify metadata table keys & foreign key targets
python -c "from api import create_app; app = create_app(); ctx = app.app_context(); ctx.push(); from api.core.db import db; [print(f'{t}: {[fk.target_fullname for fk in table.foreign_keys]}') for t, table in db.metadata.tables.items()]"
```
