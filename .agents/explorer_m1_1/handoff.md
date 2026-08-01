# Handoff Report: Requirement R1 Schema & Models Analysis

## 1. Observation
- **File Examined**: `api/core/models.py` (lines 1-276).
  - Existing models: `Category`, `Product`, `ProductImage`, `Order`, `OrderItem`, `Setting`, `User`, `CartItem`, `WishlistItem`.
  - `User` table name: `__tablename__ = 'users'` (`api/core/models.py:199`).
  - `Order` table name: defaults to `'order'` (`api/core/models.py:47`).
- **Migrations Examined**: `migrations/versions/`
  - Latest migration head: `54afcbd02d2c` (`add_wishlist_items_table.py`).
  - `flask db current` output confirmed current head is `54afcbd02d2c`.
- **Existing Test Execution**:
  - `python -m pytest` executed and passed (3 passed in 20.31s).

## 2. Logic Chain
1. **GEMINI.md Rule 3 Compliance**: All relational database schema models must reside in `api/core/models.py`. Placing models elsewhere causes circular imports and migration errors.
2. **FK Target Verification**:
   - `User` table is `'users'`, so FK references must target `'users.id'`.
   - `Order` table is `'order'`, so FK references must target `'order.id'`.
3. **User Updates**: Adding `birth_date` (Date), `referral_code` (String(12), unique), and `referred_by_id` (FK to `users.id`) allows user referral tracking and birthday promotion features. Self-referential relationship `referred_by` with `remote_side=[id]` provides clean navigation.
4. **New Models**:
   - `MembershipTier` (`membership_tiers`): `name`, `spend_threshold`, `sort_order`.
   - `DonationRecord` (`donation_records`): `period`, `status`, `donated_at`, `note`.
   - `GiftCard` (`gift_cards`): `code`, `value`, `is_redeemed`, `redeemed_at`, `expires_at`, `created_at`.
   - `LoyaltyPointsEntry` (`loyalty_points_entries`): `user_id`, `amount`, `source`, `ref_id`, `earned_at`, `expires_at`.
   - `LoyaltyVoucher` (`loyalty_vouchers`): `user_id`, `value`, `source`, `created_at`, `expires_at`, `redeemed`, `min_order_amount`.
   - `ReferralConversion` (`referral_conversions`): `referrer_id`, `referee_id`, `qualifying_order_id`, `reward_issued`, `created_at`.
5. **Serialization (`to_dict()`)**: All models implement ISO-formatted datetimes/dates and handle optional fields cleanly without breaking JSON responses.

## 3. Caveats
- `referral_code` in `User` must be `nullable=True` so existing users without referral codes do not trigger NOT NULL database constraint violations during migration.
- `qualifying_order_id` in `ReferralConversion` uses `ondelete='SET NULL'` and `nullable=True` in case qualifying orders are cancelled or purged.
- SQLite batch mode (`with op.batch_alter_table`) is required in Alembic migration for modifying the `users` table.

## 4. Conclusion
Requirement R1 model definitions and schema strategy are complete and ready for implementer execution. Full technical specification is available at `.agents/explorer_m1_1/analysis.md`.

## 5. Verification Method
1. Inspect `.agents/explorer_m1_1/analysis.md` for complete class definitions and schema code.
2. After implementer applies changes to `api/core/models.py`, verify migration generation:
   ```bash
   python -m flask --app api db migrate -m "add requirement r1 models and user profile fields"
   python -m flask --app api db upgrade
   ```
3. Run test suite and boundary check:
   ```bash
   python -m pytest
   import-linter lint
   ```
