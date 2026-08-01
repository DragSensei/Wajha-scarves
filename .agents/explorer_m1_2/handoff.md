# Handoff Report — Explorer 2 (Milestone 1)

## 1. Observation
- **Flask Configuration (`api/__init__.py`)**:
  - `Migrate(app, db)` is initialized at line 80.
  - `Config.ALLOWED_SETTINGS` is defined at lines 35–39:
    ```python
    ALLOWED_SETTINGS = {
        'sale_active', 'discount_active', 'discount_percent', 'custom_sale_text', 
        'discount_categories', 'discount_product_ids', 'whatsapp_number', 
        'contact_number', 'sale_bundle_name', 'owner_whatsapp'
    }
    ```
- **Database Engine & Environment**:
  - Postgres in production / remote, SQLite locally (`sqlite:///.../app.db`).
  - Command `python -m flask --app api db current` returns current head revision `54afcbd02d2c (head)`.
- **Existing Migration History (`migrations/versions/`)**:
  1. `b0f9b66e3606_initial_migration.py`
  2. `20240e6fafdb_remove_processedwebhookevent_and_add_.py`
  3. `590ddd4ab05b_add_address_fields_to_user_model.py`
  4. `54afcbd02d2c_add_wishlist_items_table.py` (down_revision = `'590ddd4ab05b'`)
- **Setting Model (`api/core/models.py:85-195`)**:
  - Table name: `setting` (columns: `id` int PK, `key` varchar 100 unique, `value` text).
  - Current settings in DB: `[('sale_active', 'true'), ('discount_active', 'true'), ('discount_percent', '15'), ('custom_sale_text', '15% off on select collections'), ('discount_categories', ''), ('discount_product_ids', '38'), ('whatsapp_number', '+966500000000')]`.

---

## 2. Logic Chain
1. **Observation**: Flask-Migrate is already configured and the live database is currently tracked at head revision `54afcbd02d2c`.
   **Inference**: Running `python -m flask --app api db migrate` after modifying `api/core/models.py` will generate a new migration revision with `down_revision = '54afcbd02d2c'`.

2. **Observation**: `Setting` model maps to table `setting` with `key` and `value` columns. Admin route `update_settings` checks keys against `current_app.config['ALLOWED_SETTINGS']`.
   **Inference**: To support R1 and R2 settings, `ALLOWED_SETTINGS` in `api/__init__.py` must be expanded to include all 9 new loyalty & referral setting keys (`points_per_egp`, `points_to_egp_rate`, `review_bonus_points`, `social_follow_bonus_points`, `referral_voucher_amount`, `referral_voucher_min_spend`, `referral_min_order_amount`, `points_expiry_months`, `voucher_expiry_months`).

3. **Observation**: Database migrations need to seed missing default settings reliably across both local SQLite and remote PostgreSQL without failing if settings already exist.
   **Inference**: Embedding an idempotent seed block in the migration script's `upgrade()` function using `bind.execute(sa.text("SELECT key FROM setting"))` and `op.bulk_insert` guarantees clean execution and idempotency.

---

## 3. Caveats
- SQLite requires `op.batch_alter_table` for altering existing tables like `users` when adding foreign keys or columns.
- `qualifying_order_id` in `ReferralConversion` must reference `order.id` (singular), while `user_id` references `users.id` (plural), matching table names in `models.py`.
- No code in `api/core/models.py` or `api/__init__.py` was modified during this investigation (read-only per explorer role).

---

## 4. Conclusion
The exact step-by-step procedure for Milestone 1 migration and seeding is:

1. **Update Whitelist**: Update `Config.ALLOWED_SETTINGS` in `api/__init__.py` to include the 9 new loyalty/referral keys (19 total whitelist keys).
2. **Update Models**: Implement R1 fields on `User` and create 6 new model classes (`MembershipTier`, `DonationRecord`, `GiftCard`, `LoyaltyPointsEntry`, `LoyaltyVoucher`, `ReferralConversion`) in `api/core/models.py`.
3. **Generate Migration**: Execute `python -m flask --app api db migrate -m "add_r1_models_and_settings_seed"`.
4. **Embed Seed Step**: Edit the generated migration file to include the idempotent seed logic for all 15 default settings (and default membership tiers if applicable).
5. **Execute Upgrade**: Execute `python -m flask --app api db upgrade`.

---

## 5. Verification Method

### Step 1: Check Migration Head
```bash
python -m flask --app api db current
```
*Expected*: Outputs `<new_revision_id> (head)`.

### Step 2: Query Seeded Settings
```bash
python -c "from api import create_app; app = create_app(); app.app_context().push(); from api.core.models import Setting; print([(s.key, s.value) for s in Setting.query.all()])"
```
*Expected*: Displays all 15+ settings including `points_per_egp`: `1`, `points_to_egp_rate`: `10`, `referral_voucher_amount`: `200`, etc.

### Step 3: Invalidation Conditions
- Migration fails with `Table missing` or `Foreign Key constraint failed`.
- `Setting.query.all()` missing any of the 9 new loyalty configuration keys.
- `python -m flask --app api db current` shows multiple heads or non-head revision.
