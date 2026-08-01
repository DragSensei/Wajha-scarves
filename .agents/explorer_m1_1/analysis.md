# Technical Analysis Report: Requirement R1 Database Schema & Models Strategy

## 1. Executive Summary

This report delivers the complete technical design and implementation strategy for **Requirement R1 (Database Schema & Models)** for Diya (Wajha Scarves). The objective is to expand the existing relational model in `api/core/models.py` and generate appropriate database migration scripts using Flask-Migrate / Alembic.

Key changes covered by Requirement R1:
1. `User` Model updates (`birth_date`, `referral_code`, `referred_by_id`, self-referencing relationship, `to_dict` updates).
2. Six (6) new core models: `MembershipTier`, `DonationRecord`, `GiftCard`, `LoyaltyPointsEntry`, `LoyaltyVoucher`, and `ReferralConversion`.

---

## 2. Baseline Architecture Assessment

### 2.1 Centralized Schema Model Rule
Per **GEMINI.md Rule 3**, all relational database schema models must reside centrally in `api/core/models.py`.
- **Reason**: FKs heavily link `User`, `Order`, `CartItem`, `WishlistItem`, and the new models (`LoyaltyPointsEntry`, `LoyaltyVoucher`, `ReferralConversion`). Centralizing all models prevents circular imports and Alembic migration resolution issues.

### 2.2 Table Names and Foreign Key Target Audit
Existing model inspection of `api/core/models.py` revealed crucial table naming facts:
- `User` table is explicitly named `'users'` (`__tablename__ = 'users'`).
- `Order` table defaults to `'order'` (`__tablename__` is unset, default table name is singular `'order'`).
- `Product` table defaults to `'product'`.
- `Category` table is explicitly `'category'`.

**Critical Finding for Foreign Keys**:
- References to `User` MUST target `'users.id'`.
- References to `Order` MUST target `'order.id'` (singular `'order'`).

### 2.3 Existing Migration Sequence Audit
- Initial Migration: `b0f9b66e3606`
- Cart Item Migration: `20240e6fafdb`
- User Address Migration: `590ddd4ab05b`
- Current Head Migration: `54afcbd02d2c` (`add_wishlist_items_table`)

The new R1 migration will branch from down_revision `54afcbd02d2c`.

---

## 3. Proposed Schema & Code Specification (`api/core/models.py`)

### 3.1 `User` Model Enhancements

#### Added Columns:
```python
birth_date = db.Column(db.Date, nullable=True)
referral_code = db.Column(db.String(12), unique=True, nullable=True)
referred_by_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
```

#### Self-Referencing Relationship:
```python
referred_by = db.relationship('User', remote_side=[id], backref=db.backref('referees', lazy='select'), lazy='selectin')
```

#### `to_dict()` Implementation:
```python
def to_dict(self):
    from api.core.crypto import decrypt_text
    return {
        "id": self.id,
        "email": self.email,
        "role": self.role,
        "full_name": self.full_name,
        "phone": decrypt_text(self.phone),
        "address": decrypt_text(self.address),
        "city": decrypt_text(self.city),
        "postal_code": decrypt_text(self.postal_code),
        "is_active": self.is_active,
        "birth_date": self.birth_date.isoformat() if self.birth_date else None,
        "referral_code": self.referral_code,
        "referred_by_id": self.referred_by_id,
        "created_at": self.created_at.isoformat() if self.created_at else None
    }
```

---

### 3.2 New Models Specifications

#### 1. `MembershipTier` Model
```python
class MembershipTier(db.Model):
    __tablename__ = 'membership_tiers'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    spend_threshold = db.Column(db.Float, nullable=False, default=0.0)
    sort_order = db.Column(db.Integer, nullable=False, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'spend_threshold': self.spend_threshold,
            'sort_order': self.sort_order
        }
```

#### 2. `DonationRecord` Model
```python
class DonationRecord(db.Model):
    __tablename__ = 'donation_records'

    id = db.Column(db.Integer, primary_key=True)
    period = db.Column(db.String(50), unique=True, nullable=False)
    status = db.Column(db.String(50), nullable=False, default='pending')
    donated_at = db.Column(db.DateTime, nullable=True)
    note = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'period': self.period,
            'status': self.status,
            'donated_at': self.donated_at.isoformat() if self.donated_at else None,
            'note': self.note
        }
```

#### 3. `GiftCard` Model
```python
class GiftCard(db.Model):
    __tablename__ = 'gift_cards'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(db.Float, nullable=False)
    is_redeemed = db.Column(db.Boolean, default=False, nullable=False)
    redeemed_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'value': self.value,
            'is_redeemed': self.is_redeemed,
            'redeemed_at': self.redeemed_at.isoformat() if self.redeemed_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
```

#### 4. `LoyaltyPointsEntry` Model
```python
class LoyaltyPointsEntry(db.Model):
    __tablename__ = 'loyalty_points_entries'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    source = db.Column(db.String(100), nullable=False)
    ref_id = db.Column(db.Integer, nullable=True)
    earned_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship('User', backref=db.backref('loyalty_points', lazy='selectin', cascade='all, delete-orphan'), lazy='selectin')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'amount': self.amount,
            'source': self.source,
            'ref_id': self.ref_id,
            'earned_at': self.earned_at.isoformat() if self.earned_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }
```

#### 5. `LoyaltyVoucher` Model
```python
class LoyaltyVoucher(db.Model):
    __tablename__ = 'loyalty_vouchers'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    value = db.Column(db.Float, nullable=False)
    source = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, nullable=True)
    redeemed = db.Column(db.Boolean, default=False, nullable=False)
    min_order_amount = db.Column(db.Float, default=0.0, nullable=False)

    user = db.relationship('User', backref=db.backref('loyalty_vouchers', lazy='selectin', cascade='all, delete-orphan'), lazy='selectin')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'value': self.value,
            'source': self.source,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'redeemed': self.redeemed,
            'min_order_amount': self.min_order_amount
        }
```

#### 6. `ReferralConversion` Model
```python
class ReferralConversion(db.Model):
    __tablename__ = 'referral_conversions'

    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    referee_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    qualifying_order_id = db.Column(db.Integer, db.ForeignKey('order.id', ondelete='SET NULL'), nullable=True)
    reward_issued = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    referrer = db.relationship('User', foreign_keys=[referrer_id], backref=db.backref('referrals_made', lazy='select'))
    referee = db.relationship('User', foreign_keys=[referee_id], backref=db.backref('referrals_received', lazy='select'))
    qualifying_order = db.relationship('Order', foreign_keys=[qualifying_order_id], lazy='selectin')

    def to_dict(self):
        return {
            'id': self.id,
            'referrer_id': self.referrer_id,
            'referee_id': self.referee_id,
            'qualifying_order_id': self.qualifying_order_id,
            'reward_issued': self.reward_issued,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
```

---

## 4. Implementation Steps & Migration Workflow

1. **Implement Model Code**: Update `api/core/models.py` with the 6 new model classes and the `User` class modifications.
2. **Generate Migration**:
   Run:
   ```bash
   python -m flask --app api db migrate -m "add requirement r1 models and user profile fields"
   ```
3. **Verify Generated Migration File**:
   Ensure `batch_alter_table` is used for `users` table alterations (for SQLite compatibility), and table names match `'users'`, `'order'`, `'membership_tiers'`, `'donation_records'`, `'gift_cards'`, `'loyalty_points_entries'`, `'loyalty_vouchers'`, `'referral_conversions'`.
4. **Apply Migration**:
   Run:
   ```bash
   python -m flask --app api db upgrade
   ```
5. **Validation & Verification**:
   - Run `python -m pytest` to verify test suite passes.
   - Run `import-linter lint` to confirm boundary rules remain intact.

---

## 5. Summary Table of Requirements vs Models

| Requirement Field / Model | Class Name | Table Name | Key Foreign Keys / Features |
|---|---|---|---|
| `User` Updates | `User` | `users` | `birth_date` (Date), `referral_code` (String 12, Unique), `referred_by_id` (FK to `users.id`), self-referencing rel |
| `MembershipTier` | `MembershipTier` | `membership_tiers` | `name` (Unique), `spend_threshold` (Float), `sort_order` (Int) |
| `DonationRecord` | `DonationRecord` | `donation_records` | `period` (Unique String), `status` (String), `donated_at` (DateTime), `note` (Text) |
| `GiftCard` | `GiftCard` | `gift_cards` | `code` (Unique String), `value` (Float), `is_redeemed` (Bool), `redeemed_at`, `expires_at`, `created_at` |
| `LoyaltyPointsEntry` | `LoyaltyPointsEntry` | `loyalty_points_entries` | `user_id` (FK `users.id`), `amount` (Int), `source` (String), `ref_id` (Int), `earned_at`, `expires_at` |
| `LoyaltyVoucher` | `LoyaltyVoucher` | `loyalty_vouchers` | `user_id` (FK `users.id`), `value` (Float), `source` (String), `created_at`, `expires_at`, `redeemed` (Bool), `min_order_amount` (Float) |
| `ReferralConversion` | `ReferralConversion` | `referral_conversions` | `referrer_id` (FK `users.id`), `referee_id` (FK `users.id`), `qualifying_order_id` (FK `order.id`), `reward_issued` (Bool), `created_at` |

