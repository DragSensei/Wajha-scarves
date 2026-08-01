# Milestone 1: Database Migration & Seeding Analysis Report (Explorer 2)

## Executive Summary
This report provides a comprehensive analysis of the Flask database migration setup, Flask-Migrate configuration, existing migration chain, and setting seeding requirements for Milestone 1 (R1 schema additions and settings initialization).

---

## 1. Existing System State & Configuration

### 1.1 Flask & Flask-Migrate Setup
- **App Factory**: `api/__init__.py` initializes `db` (SQLAlchemy) and `Migrate(app, db)` within `create_app()`.
- **Database Engine**:
  - Production / Remote: Neon PostgreSQL (`DATABASE_URL` env var).
  - Local Fallback: SQLite (`app.db` at project root).
- **Migration Directory**: `migrations/` configured with Alembic (`env.py`, `alembic.ini`).
- **Current Database Revision**: Head revision is `54afcbd02d2c` (`54afcbd02d2c_add_wishlist_items_table.py`).

### 1.2 Revision History Chain
1. `b0f9b66e3606_initial_migration.py` (down_revision = None)
2. `20240e6fafdb_remove_processedwebhookevent_and_add_.py` (down_revision = 'b0f9b66e3606')
3. `590ddd4ab05b_add_address_fields_to_user_model.py` (down_revision = '20240e6fafdb')
4. `54afcbd02d2c_add_wishlist_items_table.py` (down_revision = '590ddd4ab05b') **[HEAD]**

### 1.3 Setting Model & Cache Mechanics
- **Model**: Defined in `api/core/models.py` lines 85–195 as `Setting(db.Model)` with table `setting` (columns: `id` PK, `key` String 100 UNIQUE, `value` Text).
- **Caching**: Multi-level caching (request-level `flask.g` and 60-second in-memory `_APP_SETTINGS_CACHE`).
- **Whitelist**: Configured via `Config.ALLOWED_SETTINGS` in `api/__init__.py`. Currently contains 10 keys:
  `{'sale_active', 'discount_active', 'discount_percent', 'custom_sale_text', 'discount_categories', 'discount_product_ids', 'whatsapp_number', 'contact_number', 'sale_bundle_name', 'owner_whatsapp'}`
- **Current Live DB Settings**:
  Currently present in DB: `sale_active`, `discount_active`, `discount_percent`, `custom_sale_text`, `discount_categories`, `discount_product_ids`, `whatsapp_number`.

---

## 2. Setting Seeding Requirements (19 Allowed Settings / 15 Seeded Defaults)

For R1 and R2, 9 new Loyalty & Referral setting keys must be added to `Config.ALLOWED_SETTINGS` in `api/__init__.py` and seeded into the `setting` table:

| Setting Key | Default Value | Category / Purpose |
|---|---|---|
| `points_per_egp` | `"1"` | Points earned per 1 EGP spent |
| `points_to_egp_rate` | `"10"` | Points required for 1 EGP discount (10 pts = 1 EGP) |
| `review_bonus_points` | `"50"` | Points awarded for submitting product review |
| `social_follow_bonus_points` | `"50"` | Points awarded for social follow action |
| `referral_voucher_amount` | `"200"` | Reward voucher value (EGP) for referrer |
| `referral_voucher_min_spend` | `"2000"` | Minimum order spend (EGP) for referral voucher |
| `referral_min_order_amount` | `"2000"` | Minimum referee order amount to trigger referral reward |
| `points_expiry_months` | `"6"` | Months before loyalty points expire |
| `voucher_expiry_months` | `"1"` | Months before loyalty vouchers expire |

Existing Core System Settings (seeded if missing):
- `sale_active`: `"true"`
- `discount_active`: `"true"`
- `discount_percent`: `"15"`
- `custom_sale_text`: `"15% off on select collections"`
- `discount_categories`: `""`
- `discount_product_ids`: `""`
- `whatsapp_number`: `"+966500000000"`
- `contact_number`: `"+966500000000"`
- `sale_bundle_name`: `"Summer Sale"`
- `owner_whatsapp`: `"+966500000000"`

Total Whitelist Keys in `Config.ALLOWED_SETTINGS`: **19 keys**.

---

## 3. Migration & Seeding Execution Strategy

### 3.1 Idempotent Seed Step Mechanism
To ensure seamless execution in both SQLite (local) and PostgreSQL (Neon remote), data seeding should be embedded directly into the Alembic migration script's `upgrade()` function using Alembic's `bind` and `op.bulk_insert`.

#### Implementation Pattern:
```python
def upgrade():
    # 1. Schema DDL: op.create_table(...) and op.batch_alter_table('users', ...)
    
    # 2. Data Seed: Idempotent setting insert
    bind = op.get_bind()
    setting_table = sa.table(
        'setting',
        sa.column('key', sa.String),
        sa.column('value', sa.Text)
    )
    
    default_settings = [
        ('points_per_egp', '1'),
        ('points_to_egp_rate', '10'),
        ('review_bonus_points', '50'),
        ('social_follow_bonus_points', '50'),
        ('referral_voucher_amount', '200'),
        ('referral_voucher_min_spend', '2000'),
        ('referral_min_order_amount', '2000'),
        ('points_expiry_months', '6'),
        ('voucher_expiry_months', '1'),
        ('sale_active', 'true'),
        ('discount_active', 'true'),
        ('discount_percent', '15'),
        ('custom_sale_text', '15% off on select collections'),
        ('discount_categories', ''),
        ('discount_product_ids', ''),
        ('whatsapp_number', '+966500000000'),
        ('contact_number', '+966500000000'),
        ('sale_bundle_name', 'Summer Sale'),
        ('owner_whatsapp', '+966500000000')
    ]
    
    existing_keys = set(r[0] for r in bind.execute(sa.text("SELECT key FROM setting")).fetchall())
    to_insert = [{'key': k, 'value': v} for k, v in default_settings if k not in existing_keys]
    
    if to_insert:
        op.bulk_insert(setting_table, to_insert)
```

### 3.2 Step-by-Step Migration Workflow for Implementer

1. **Update Allowed Settings**:
   In `api/__init__.py`, update `Config.ALLOWED_SETTINGS` to include all 9 new loyalty/referral keys.

2. **Add R1 Models & User Fields**:
   In `api/core/models.py`, add `birth_date`, `referral_code`, `referred_by_id` to `User` and add the 6 new models (`MembershipTier`, `DonationRecord`, `GiftCard`, `LoyaltyPointsEntry`, `LoyaltyVoucher`, `ReferralConversion`).

3. **Generate Migration Script**:
   Run:
   ```bash
   python -m flask --app api db migrate -m "add_r1_models_and_settings_seed"
   ```

4. **Embed Seed Logic**:
   Edit the generated migration script in `migrations/versions/<hash>_add_r1_models_and_settings_seed.py` to add the idempotent settings seeding block.

5. **Apply Migration**:
   Run:
   ```bash
   python -m flask --app api db upgrade
   ```

6. **Verify Upgrade**:
   Run `python -m flask --app api db current` to verify head status.

---

## 4. Risks & Considerations
1. **SQLite FK Operations**: User model column additions (`referred_by_id`) must use `with op.batch_alter_table('users', schema=None) as batch_op:` to avoid SQLite table alteration limitations.
2. **Table Name References**:
   - `ReferralConversion.qualifying_order_id` references `order.id` (singular, matching `Order` table).
   - `User.referred_by_id` references `users.id` (plural, matching `User` table).
3. **Idempotency**: Using `bind.execute("SELECT key FROM setting")` prevents duplicate key constraint errors during re-runs or partial database states.
