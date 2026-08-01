## 2026-07-30T14:42:13Z
You are Explorer 1 for Milestone 1 (Database Schema & Migrations).
Working Directory: c:/Project/Wajha Technologies/Wajha Scarves/.agents/explorer_m1_1/

Task Objective:
Investigate `api/core/models.py` and existing models/migrations in the codebase for Diya (Wajha Scarves).
Identify all changes needed for Requirement R1:
1. `User` model updates:
   - `birth_date` (db.Date, nullable=True)
   - `referral_code` (db.String(12), unique=True)
   - `referred_by_id` (db.Integer, db.ForeignKey('users.id'), nullable=True)
   - Relationship to referrer/referees if appropriate or FK reference.
   - `to_dict()` update to include `birth_date` and `referral_code`.
2. New Models:
   - `MembershipTier`: id (int, PK), name (string, unique), spend_threshold (float), sort_order (int). Update/add to_dict().
   - `DonationRecord`: id (int, PK), period (string, unique, e.g. "2026-Q3"), status (string, default "pending"), donated_at (datetime), note (text). Update/add to_dict().
   - `GiftCard`: id (int, PK), code (string, unique), value (float), is_redeemed (boolean, default False), redeemed_at (datetime, nullable), expires_at (datetime, nullable), created_at (datetime). Update/add to_dict().
   - `LoyaltyPointsEntry`: id (int, PK), user_id (FK to users.id), amount (int), source (string), ref_id (int, nullable), earned_at (datetime), expires_at (datetime, nullable). Update/add to_dict().
   - `LoyaltyVoucher`: id (int, PK), user_id (FK to users.id), value (float), source (string), created_at (datetime), expires_at (datetime), redeemed (boolean, default False), min_order_amount (float). Update/add to_dict().
   - `ReferralConversion`: id (int, PK), referrer_id (FK to users.id), referee_id (FK to users.id), qualifying_order_id (FK to orders.id / order.id - check exact table name in models.py), reward_issued (boolean, default False), created_at (datetime). Update/add to_dict().

Constraints & Guidelines:
- All SQLAlchemy models must reside centrally in `api/core/models.py` per GEMINI.md Rule 3.
- Use ponytail principles: clean, straightforward, native SQLAlchemy types.
- Check existing `User` model and table names in `models.py` carefully before recommending fixes.

Deliverables:
Write your full technical analysis report and recommended implementation strategy to `.agents/explorer_m1_1/analysis.md` and deliver a concise handoff message back to the orchestrator.
