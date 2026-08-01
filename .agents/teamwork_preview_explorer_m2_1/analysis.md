# Technical Analysis & Implementation Strategy — Milestone 2 (App Settings Whitelist & Admin Tiers Manager)

## Executive Summary
This document delivers the comprehensive backend architecture analysis and implementation strategy for **Milestone 2 (M2: App Settings Whitelist & Admin Tiers Manager)**.

Key findings & formulation details:
1. **App Settings Whitelist**: Confirmed that `Config.ALLOWED_SETTINGS` in `api/__init__.py` contains all 19 required setting keys (10 store settings + 9 loyalty/referral program settings). Detailed validation rules are formulated to enforce numeric and type constraints when updating settings.
2. **Admin Tiers Manager & User Ranking**: Formulated the end-to-end blueprint, validation schema, service logic, and route handlers for `/api/admin/tiers` endpoints (GET, POST, PUT, DELETE) and user ranking by completed-order spend (`Order.status == 'completed'`).
3. **Import Boundary Integrity**: Verified compliance against `.importlinter` rules. Ran `lint-imports.exe` confirming **2 contracts kept, 0 broken**. Formulated architecture guarantees zero boundary violations.

---

## 1. Whitelist & Settings Analysis

### 1.1 Whitelisted Keys Audit (`api/__init__.py`)
Inspection of `api/__init__.py` (lines 35-43) confirms `Config.ALLOWED_SETTINGS` contains 19 whitelisted keys:

```python
ALLOWED_SETTINGS = {
    # Store Configuration Keys (10)
    'sale_active', 'discount_active', 'discount_percent', 'custom_sale_text', 
    'discount_categories', 'discount_product_ids', 'whatsapp_number', 
    'contact_number', 'sale_bundle_name', 'owner_whatsapp',
    
    # Loyalty & Referral Configuration Keys (9)
    'points_per_egp', 'points_to_egp_rate', 'review_bonus_points', 
    'social_follow_bonus_points', 'referral_voucher_amount', 
    'referral_voucher_min_spend', 'referral_min_order_amount', 
    'points_expiry_months', 'voucher_expiry_months'
}
```

### 1.2 Required Loyalty & Referral Keys Verification
| Key Name | Required Type | Description / Usage | Whitelist Status |
|---|---|---|---|
| `points_per_egp` | Float string (>= 0) | Earning rate: points earned per 1 EGP spent | **PRESENT** |
| `points_to_egp_rate` | Float string (> 0) | Redemption rate: EGP value per point | **PRESENT** |
| `review_bonus_points` | Int string (>= 0) | Fixed bonus points awarded per verified review | **PRESENT** |
| `social_follow_bonus_points` | Int string (>= 0) | Fixed bonus points for social media follow action | **PRESENT** |
| `referral_voucher_amount` | Float string (>= 0) | EGP value of referral discount voucher | **PRESENT** |
| `referral_voucher_min_spend` | Float string (>= 0) | Minimum spend required to use referral voucher | **PRESENT** |
| `referral_min_order_amount` | Float string (>= 0) | Minimum referee order amount to trigger referrer reward | **PRESENT** |
| `points_expiry_months` | Int string (>= 0) | Point expiration window in months | **PRESENT** |
| `voucher_expiry_months` | Int string (>= 0) | Voucher expiration window in months | **PRESENT** |

### 1.3 Setting Validation Enhancements
Currently, `update_settings()` in `api/features/admin/routes.py` verifies that keys belong to `ALLOWED_SETTINGS` and values are strings. To ensure data integrity, `api/features/admin/schemas.py` should implement `validate_update_settings(data)` to enforce specific value format rules:
- **Non-negative Floats**: `points_per_egp`, `points_to_egp_rate`, `referral_voucher_amount`, `referral_voucher_min_spend`, `referral_min_order_amount`, `discount_percent`.
- **Non-negative Integers**: `review_bonus_points`, `social_follow_bonus_points`, `points_expiry_months`, `voucher_expiry_months`.
- **Boolean strings**: `sale_active`, `discount_active` (e.g. `'true'`, `'false'`, `'1'`, `'0'`).

---

## 2. Membership Tiers & User Ranking Architecture

### 2.1 Model Specification (`api/core/models.py`)
`MembershipTier` is already defined in `api/core/models.py` (lines 282-296):
```python
class MembershipTier(db.Model):
    __tablename__ = 'membership_tiers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    spend_threshold = db.Column(db.Float, default=0.0)
    sort_order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'spend_threshold': self.spend_threshold,
            'sort_order': self.sort_order
        }
```
Default seed tiers in database:
- `Bronze`: spend_threshold = 0.0, sort_order = 1
- `Silver`: spend_threshold = 2000.0, sort_order = 2
- `Gold`: spend_threshold = 5000.0, sort_order = 3
- `Platinum`: spend_threshold = 10000.0, sort_order = 4

### 2.2 Blueprint & Routing Design
- **Blueprint Name**: `admin_tiers_bp = Blueprint('admin_tiers', __name__)` in `api/features/admin/__init__.py`.
- **Registration**: Registered in `api/__init__.py` with prefix `url_prefix='/api/admin/tiers'`.

### 2.3 Endpoint Specification

| Method | Path | Description | Access | Rate Limit |
|---|---|---|---|---|
| `GET` | `/api/admin/tiers` | List all membership tiers sorted by `sort_order` | Admin | 200/day, 50/hr |
| `POST` | `/api/admin/tiers` | Create a new membership tier | Admin | 50/day, 20/hr |
| `PUT` | `/api/admin/tiers/<id>` | Update tier name, threshold, or sort order | Admin | 200/day, 50/hr |
| `DELETE` | `/api/admin/tiers/<id>` | Delete a tier (base tier protected) | Admin | 50/day, 20/hr |
| `GET` | `/api/admin/tiers/users` | Retrieve users ranked by lifetime completed spend & assigned tier | Admin | 200/day, 50/hr |

### 2.4 User Ranking & Tier Matching Logic
User ranking is calculated based on lifetime completed-order spend:
1. **Lifetime Spend Query**:
   ```sql
   SELECT user_id, COALESCE(SUM(total_amount), 0.0) AS lifetime_spend
   FROM "order"
   WHERE status = 'completed' AND user_id IS NOT NULL
   GROUP BY user_id
   ```
2. **Tier Allocation**:
   Tiers are evaluated in descending order of `spend_threshold` (e.g., Platinum [10000] -> Gold [5000] -> Silver [2000] -> Bronze [0]).
   A user matches the highest tier where `user_spend >= tier.spend_threshold`.
3. **Unordered / Zero-Spend Users**:
   Active users with 0 completed orders receive `lifetime_spend = 0.0` and automatically match the base tier (Bronze, threshold 0.0).

---

## 3. Implementation Plan & Proposed Code Snippets

### 3.1 `api/features/admin/__init__.py` Updates
```python
from flask import Blueprint

admin_users_bp = Blueprint('admin_users', __name__)
admin_settings_bp = Blueprint('admin_settings', __name__)
admin_images_bp = Blueprint('admin_images', __name__)
admin_orders_bp = Blueprint('admin_orders', __name__)
admin_tiers_bp = Blueprint('admin_tiers', __name__)

from api.features.admin import routes
```

### 3.2 `api/features/admin/schemas.py` Additions
```python
def validate_tier_data(data, is_update=False):
    errors = {}
    if not isinstance(data, dict):
        return False, {"error": "Request body must be a JSON object"}

    if not is_update or 'name' in data:
        name = data.get('name')
        if not name or not isinstance(name, str) or not name.strip():
            errors['name'] = "Tier name is required and cannot be empty"
        elif len(name.strip()) > 50:
            errors['name'] = "Tier name cannot exceed 50 characters"

    if not is_update or 'spend_threshold' in data:
        threshold = data.get('spend_threshold')
        if threshold is None or not isinstance(threshold, (int, float)) or threshold < 0:
            errors['spend_threshold'] = "Spend threshold must be a non-negative number"

    if 'sort_order' in data and data['sort_order'] is not None:
        if not isinstance(data['sort_order'], int):
            errors['sort_order'] = "Sort order must be an integer"

    return len(errors) == 0, errors
```

### 3.3 `api/features/admin/services.py` Additions
```python
class DuplicateTierError(ValueError):
    pass

class ProtectedTierError(ValueError):
    pass

def get_all_tiers():
    return MembershipTier.query.order_by(
        MembershipTier.sort_order.asc(),
        MembershipTier.spend_threshold.asc()
    ).all()

def create_tier(data):
    is_valid, errors = validate_tier_data(data, is_update=False)
    if not is_valid:
        raise ValueError(errors)

    name = data['name'].strip()
    spend_threshold = float(data['spend_threshold'])
    sort_order = data.get('sort_order', 0)

    if MembershipTier.query.filter_by(name=name).first():
        raise DuplicateTierError(f"A tier named '{name}' already exists.")

    new_tier = MembershipTier(name=name, spend_threshold=spend_threshold, sort_order=sort_order)
    db.session.add(new_tier)
    try:
        db.session.commit()
        return new_tier
    except Exception:
        db.session.rollback()
        raise

def update_tier(tier, data):
    is_valid, errors = validate_tier_data(data, is_update=True)
    if not is_valid:
        raise ValueError(errors)

    if 'name' in data:
        new_name = data['name'].strip()
        if new_name != tier.name:
            conflict = MembershipTier.query.filter(
                MembershipTier.name == new_name,
                MembershipTier.id != tier.id
            ).first()
            if conflict:
                raise DuplicateTierError(f"A tier named '{new_name}' already exists.")
            tier.name = new_name

    if 'spend_threshold' in data:
        tier.spend_threshold = float(data['spend_threshold'])
    if 'sort_order' in data:
        tier.sort_order = int(data['sort_order'])

    try:
        db.session.commit()
        return tier
    except Exception:
        db.session.rollback()
        raise

def delete_tier(tier):
    if tier.spend_threshold == 0.0:
        raise ProtectedTierError("Cannot delete base membership tier with 0 spend threshold.")
    
    total_tiers = MembershipTier.query.count()
    if total_tiers <= 1:
        raise ProtectedTierError("Cannot delete the only remaining membership tier.")

    try:
        db.session.delete(tier)
        db.session.commit()
        return True
    except Exception:
        db.session.rollback()
        raise

def get_user_rankings():
    from sqlalchemy import func
    spends = db.session.query(
        Order.user_id,
        func.coalesce(func.sum(Order.total_amount), 0.0).label('total_spend')
    ).filter(
        Order.status == 'completed',
        Order.user_id.isnot(None)
    ).group_by(Order.user_id).all()

    spend_map = {s.user_id: float(s.total_spend) for s in spends}
    users = User.query.filter_by(is_active=True).all()
    tiers = MembershipTier.query.order_by(MembershipTier.spend_threshold.desc()).all()

    user_rankings = []
    for user in users:
        lifetime_spend = spend_map.get(user.id, 0.0)
        assigned_tier = next((t.to_dict() for t in tiers if lifetime_spend >= t.spend_threshold), None)
        user_rankings.append({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "lifetime_spend": lifetime_spend,
            "tier": assigned_tier
        })

    user_rankings.sort(key=lambda u: u['lifetime_spend'], reverse=True)
    return user_rankings
```

### 3.4 `api/features/admin/routes.py` Additions
```python
@admin_tiers_bp.route('', methods=['GET'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def get_tiers():
    tiers = get_all_tiers()
    return jsonify({"tiers": [t.to_dict() for t in tiers]})

@admin_tiers_bp.route('', methods=['POST'])
@admin_required
@limiter.limit("50 per day; 20 per hour")
def create_tier_route():
    if not request.is_json:
        return jsonify({"error": "Request body must be a JSON object"}), 400
    try:
        tier = create_tier(request.get_json())
        return jsonify({"tier": tier.to_dict()}), 201
    except DuplicateTierError as e:
        return jsonify({"error": str(e)}), 409
    except ValueError as e:
        details = e.args[0] if e.args and isinstance(e.args[0], dict) else {"error": str(e)}
        return jsonify({"error": "Validation failed", "details": details}), 400

@admin_tiers_bp.route('/<int:tier_id>', methods=['PUT'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def update_tier_route(tier_id):
    if not request.is_json:
        return jsonify({"error": "Request body must be a JSON object"}), 400
    tier = db.session.get(MembershipTier, tier_id)
    if not tier:
        return jsonify({"error": "Tier not found"}), 404
    try:
        updated_tier = update_tier(tier, request.get_json())
        return jsonify({"tier": updated_tier.to_dict()}), 200
    except DuplicateTierError as e:
        return jsonify({"error": str(e)}), 409
    except ValueError as e:
        details = e.args[0] if e.args and isinstance(e.args[0], dict) else {"error": str(e)}
        return jsonify({"error": "Validation failed", "details": details}), 400

@admin_tiers_bp.route('/<int:tier_id>', methods=['DELETE'])
@admin_required
@limiter.limit("50 per day; 20 per hour")
def delete_tier_route(tier_id):
    tier = db.session.get(MembershipTier, tier_id)
    if not tier:
        return jsonify({"error": "Tier not found"}), 404
    try:
        delete_tier(tier)
        return jsonify({"message": "Tier deleted successfully", "id": tier_id}), 200
    except ProtectedTierError as e:
        return jsonify({"error": str(e)}), 400

@admin_tiers_bp.route('/users', methods=['GET'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def get_tier_user_rankings():
    rankings = get_user_rankings()
    return jsonify({"users": rankings})
```

---

## 4. Import Boundary & Rule Compliance Audit

### 4.1 Boundary Analysis (`.importlinter`)
- Rule 1: `Core Feature Independence` (`auth`, `products`, `categories`, `cart` must remain independent).
- Rule 2: `No imports from Admin` (`auth`, `products`, `categories`, `cart` must never import from `admin`).
- Exception Rule (GEMINI.md): `admin` feature is permitted to import models from `api.core.models` and services from other features to compose administrative logic. No other feature imports from `admin`.

### 4.2 Automated Verification Result
Executed boundary verification command:
`C:\Users\drag\AppData\Roaming\Python\Python313\Scripts\lint-imports.exe`

Output:
```
=============
Import Linter
=============
Core Feature Independence KEPT
No imports from Admin KEPT

Contracts: 2 kept, 0 broken.
```

---

## 5. Verification & Test Plan

1. **Unit & Integration Tests**:
   - `test_get_settings_whitelist`: Assert all 19 keys in `ALLOWED_SETTINGS` can be updated with valid string values.
   - `test_tier_crud`: Test POST, GET, PUT, DELETE routes for `/api/admin/tiers`. Assert proper HTTP status codes (201, 200, 400, 404, 409).
   - `test_user_tier_ranking`: Create users with completed orders of various amounts (0, 1500, 3000, 7500, 15000), verify correct tier matching (Bronze, Silver, Gold, Platinum).
2. **Boundary Testing**:
   - Run `lint-imports.exe` to guarantee zero dependency leakage.
