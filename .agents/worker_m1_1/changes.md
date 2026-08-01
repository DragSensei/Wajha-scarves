# Implementation Changes Summary — Milestone 1 (Worker 1)

## Summary of Changes

### 1. Model Updates (`api/core/models.py`)
- **User Model**:
  - Added `birth_date` (`db.Date`, nullable)
  - Added `referral_code` (`db.String(12)`, unique, nullable)
  - Added `referred_by_id` (`db.Integer`, FK to `users.id` ON DELETE SET NULL, nullable)
  - Added `referred_by` relationship (`db.relationship('User', remote_side=[id], backref=db.backref('referees', lazy='dynamic'))`)
  - Updated `User.to_dict()` to include `'birth_date'` and `'referral_code'`.

- **New Models Added**:
  1. `MembershipTier` (`membership_tiers`): `id`, `name`, `spend_threshold`, `sort_order`, `to_dict()`.
  2. `DonationRecord` (`donation_records`): `id`, `period`, `status`, `donated_at`, `note`, `to_dict()`.
  3. `GiftCard` (`gift_cards`): `id`, `code`, `value`, `is_redeemed`, `redeemed_at`, `expires_at`, `created_at`, `to_dict()`.
  4. `LoyaltyPointsEntry` (`loyalty_points_entries`): `id`, `user_id` (FK to `users.id` ON DELETE CASCADE), `amount`, `source`, `ref_id`, `earned_at`, `expires_at`, `to_dict()`.
  5. `LoyaltyVoucher` (`loyalty_vouchers`): `id`, `user_id` (FK to `users.id` ON DELETE CASCADE), `value`, `source`, `created_at`, `expires_at`, `redeemed`, `min_order_amount`, `to_dict()`.
  6. `ReferralConversion` (`referral_conversions`): `id`, `referrer_id` (FK to `users.id` ON DELETE CASCADE), `referee_id` (FK to `users.id` ON DELETE CASCADE), `qualifying_order_id` (FK to `order.id` ON DELETE SET NULL), `reward_issued`, `created_at`, `to_dict()`.

### 2. Config Updates (`api/__init__.py`)
- Expanded `Config.ALLOWED_SETTINGS` to include 9 new program settings:
  - `'points_per_egp'`
  - `'points_to_egp_rate'`
  - `'review_bonus_points'`
  - `'social_follow_bonus_points'`
  - `'referral_voucher_amount'`
  - `'referral_voucher_min_spend'`
  - `'referral_min_order_amount'`
  - `'points_expiry_months'`
  - `'voucher_expiry_months'`

### 3. Database Migration & Seeding (`migrations/versions/a42ba4f066bf_add_r1_models_and_settings_seed.py`)
- Generated migration `add_r1_models_and_settings_seed` (Revision ID: `a42ba4f066bf`).
- Edited `upgrade()` function to seed default configuration settings into the `setting` table:
  - `points_per_egp`: '1'
  - `points_to_egp_rate`: '10'
  - `review_bonus_points`: '50'
  - `social_follow_bonus_points`: '50'
  - `referral_voucher_amount`: '200'
  - `referral_voucher_min_spend`: '2000'
  - `referral_min_order_amount`: '2000'
  - `points_expiry_months`: '6'
  - `voucher_expiry_months`: '1'
- Edited `upgrade()` function to seed initial `MembershipTier` default tiers:
  - Bronze: 0.0 spend threshold, sort order 1
  - Silver: 2000.0 spend threshold, sort order 2
  - Gold: 5000.0 spend threshold, sort order 3
  - Platinum: 10000.0 spend threshold, sort order 4
- Executed `python -m flask --app api db upgrade` successfully.

### 4. Tests Added (`tests/test_m1_1_models.py`)
- `test_user_model_m1_updates`: Validates `User` referral code, birth date, referrer/referees relationship, and `to_dict()`.
- `test_m1_new_models`: Validates model creation, FK relationships, defaults, and `to_dict()` outputs for all 6 new models.
- `test_allowed_settings`: Confirms all 9 new keys are included in `Config.ALLOWED_SETTINGS`.
