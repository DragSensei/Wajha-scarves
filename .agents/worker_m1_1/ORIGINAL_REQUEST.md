## 2026-07-30T14:43:52Z
Worker 1 for Milestone 1 (Database Schema Models & Migration Seed).
Working Directory: c:/Project/Wajha Technologies/Wajha Scarves/.agents/worker_m1_1/

Task Scope & Detailed Instructions:
1. Update `api/core/models.py`:
   - `User` model updates:
     - Add `birth_date = db.Column(db.Date, nullable=True)`
     - Add `referral_code = db.Column(db.String(12), unique=True, nullable=True)`
     - Add `referred_by_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)`
     - Add `referred_by = db.relationship('User', remote_side=[id], backref=db.backref('referees', lazy='dynamic'))`
     - Update `User.to_dict()` to include:
       - `'birth_date': self.birth_date.isoformat() if self.birth_date else None`
       - `'referral_code': self.referral_code`
   - Create 6 new models in `api/core/models.py`:
     - `MembershipTier` (`__tablename__ = 'membership_tiers'`): `id` (int PK), `name` (String(50), unique, nullable=False), `spend_threshold` (Float, default=0.0), `sort_order` (Integer, default=0). Add `to_dict()`.
     - `DonationRecord` (`__tablename__ = 'donation_records'`): `id` (int PK), `period` (String(20), unique, nullable=False), `status` (String(20), default="pending"), `donated_at` (DateTime, nullable=True), `note` (Text, nullable=True). Add `to_dict()`.
     - `GiftCard` (`__tablename__ = 'gift_cards'`): `id` (int PK), `code` (String(32), unique, nullable=False), `value` (Float, nullable=False), `is_redeemed` (Boolean, default=False), `redeemed_at` (DateTime, nullable=True), `expires_at` (DateTime, nullable=True), `created_at` (DateTime, default=datetime.utcnow). Add `to_dict()`.
     - `LoyaltyPointsEntry` (`__tablename__ = 'loyalty_points_entries'`): `id` (int PK), `user_id` (Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False), `amount` (Integer, nullable=False), `source` (String(50), nullable=False), `ref_id` (Integer, nullable=True), `earned_at` (DateTime, default=datetime.utcnow), `expires_at` (DateTime, nullable=True). Add `to_dict()`.
     - `LoyaltyVoucher` (`__tablename__ = 'loyalty_vouchers'`): `id` (int PK), `user_id` (Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False), `value` (Float, nullable=False), `source` (String(50), nullable=False), `created_at` (DateTime, default=datetime.utcnow), `expires_at` (DateTime, nullable=True), `redeemed` (Boolean, default=False), `min_order_amount` (Float, default=0.0). Add `to_dict()`.
     - `ReferralConversion` (`__tablename__ = 'referral_conversions'`): `id` (int PK), `referrer_id` (Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False), `referee_id` (Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False), `qualifying_order_id` (Integer, db.ForeignKey('order.id', ondelete='SET NULL'), nullable=True), `reward_issued` (Boolean, default=False), `created_at` (DateTime, default=datetime.utcnow). Add `to_dict()`.

2. Update `api/__init__.py`:
   - Expand `ALLOWED_SETTINGS` in `Config` to include:
     `'points_per_egp'`, `'points_to_egp_rate'`, `'review_bonus_points'`, `'social_follow_bonus_points'`, `'referral_voucher_amount'`, `'referral_voucher_min_spend'`, `'referral_min_order_amount'`, `'points_expiry_months'`, `'voucher_expiry_months'`.

3. Migration & Seeding Execution:
   - Run `python -m flask --app api db migrate -m "add_r1_models_and_settings_seed"`
   - Edit the generated migration file in `migrations/versions/` to add default seed logic into `upgrade()` function for all required default settings:
     `points_per_egp`: '1'
     `points_to_egp_rate`: '10'
     `review_bonus_points`: '50'
     `social_follow_bonus_points`: '50'
     `referral_voucher_amount`: '200'
     `referral_voucher_min_spend`: '2000'
     `referral_min_order_amount`: '2000'
     `points_expiry_months`: '6'
     `voucher_expiry_months`: '1'
   - Run `python -m flask --app api db upgrade`
   - Also create default seed records for `MembershipTier` (e.g. Bronze: 0 spend, Silver: 2000 spend, Gold: 5000 spend, Platinum: 10000 spend) in the seed step.

4. Verification:
   - Run `python -m pytest` to ensure tests pass.
   - Run `import-linter lint` to verify server-side import boundaries.
   - Run `npm run lint` to verify client-side import boundaries.

Deliverables:
- Write implementation changes summary report to `.agents/worker_m1_1/changes.md`.
- Write handoff report with exact verification commands & output log to `.agents/worker_m1_1/handoff.md`.
- Send completion message to parent orchestrator.
