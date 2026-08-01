# Stress-Test Report: Milestone 1 Models & Schema

**Date**: 2026-07-30  
**Target**: Worker 1 Implementation (`api/core/models.py`, `tests/test_m1_1_models.py`)  
**Challenger**: Challenger 1 (`.agents/challenger_m1_1/`)  

---

## 1. VERDICT

**VERDICT: FAIL**

### Summary of Verdict
- **Model Implementations (`api/core/models.py`)**: **PASS** — All requested models (`User` extensions, `MembershipTier`, `DonationRecord`, `GiftCard`, `LoyaltyPointsEntry`, `LoyaltyVoucher`, `ReferralConversion`), relationships, `to_dict()` serializations, and unique constraints are correctly implemented and structurally sound.
- **Pytest Suite (`python -m pytest`)**: **FAIL** — `python -m pytest` fails out-of-the-box (`2 failed, 13 passed`). Worker 1's unit tests (`test_m1_1_models.py` and `test_query_counts.py`) connect directly to the application context without database fixture isolation or `db.create_all()` setup. When run against the configured environment (`DATABASE_URL` pointing to Neon Postgres or unmigrated local `app.db`), tests crash with `psycopg2.errors.UndefinedTable` / `sqlite3.OperationalError`.

---

## 2. Empirical Verification Checklist

Empirical verification was conducted by writing and executing a comprehensive 9-test stress suite (`tests/test_challenger_m1_1.py`) using an isolated test database fixture.

| Requirement | Test Function | Status | Evidence / Notes |
| :--- | :--- | :---: | :--- |
| **User birth_date & referral_code** | `test_user_birth_date_and_referral_code` | **PASS** | Successfully inserted user with `date(1990, 12, 25)` and `referral_code="CHALLENGE123"`. Verified `to_dict()` outputs `"1990-12-25"`. |
| **Self-Referral Link** | `test_user_self_referral_link` | **PASS** | Created `u1` (referrer) and `u2` (referee with `referred_by_id=u1.id`). Verified `u2.referred_by` equals `u1` and `u1.referees` dynamic query contains `u2`. |
| **MembershipTier Record Insertion** | `test_membership_tier_creation_to_dict_and_uniqueness` | **PASS** | Created `MembershipTier(name="Gold", spend_threshold=5000.0, sort_order=2)`. Verified DB persistence and `to_dict()`. |
| **DonationRecord Insertion** | `test_donation_record_creation_to_dict_and_uniqueness` | **PASS** | Created `DonationRecord(period="2026-Q1", status="completed")`. Verified DB persistence and ISO datetime string serialization. |
| **GiftCard Insertion** | `test_gift_card_creation_to_dict_and_uniqueness` | **PASS** | Created `GiftCard(code="GIFT-2026-VAL", value=250.0)`. Verified `to_dict()` output and default `is_redeemed=False`. |
| **LoyaltyPointsEntry Insertion** | `test_loyalty_points_entry_creation_and_to_dict` | **PASS** | Inserted entry with `amount=100`, `source="purchase"`, `user_id`. Verified FK constraint and `to_dict()` keys. |
| **LoyaltyVoucher Insertion** | `test_loyalty_voucher_creation_and_to_dict` | **PASS** | Inserted voucher with `value=50.0`, `min_order_amount=500.0`, `redeemed=False`. Verified `to_dict()` output. |
| **ReferralConversion Insertion** | `test_referral_conversion_creation_and_to_dict` | **PASS** | Linked `referrer_id`, `referee_id`, and `qualifying_order_id`. Verified `reward_issued=True` and `to_dict()` keys. |
| **to_dict() Serializations** | Tested across all 9 functions | **PASS** | Confirmed all `DateTime` and `Date` fields output ISO 8601 strings when populated, and `None` when null. |
| **Unique Constraints Enforcement** | Tested across all 9 functions | **PASS** | Verified that duplicate `User.referral_code`, `GiftCard.code`, `MembershipTier.name`, and `DonationRecord.period` trigger `sqlalchemy.exc.IntegrityError`. |

---

## 3. Pytest Suite Execution Findings

Command executed:
```bash
python -m pytest
```

### Output Summary
```
=========================== short test summary info ===========================
FAILED tests/test_m1_1_models.py::test_m1_new_models - sqlalchemy.exc.ProgrammingError / UndefinedTable
FAILED tests/test_query_counts.py::test_query_counts - sqlalchemy.exc.ProgrammingError / UndefinedTable
======================== 2 failed, 13 passed in 30.82s ========================
```

### Root Cause Analysis of Pytest Failures
1. **Missing Test Fixtures in `test_m1_1_models.py`**:
   Worker 1 wrote `test_m1_1_models.py` using `app = create_app()` inside each test without configuring `TESTING=True`, setting an in-memory database (`sqlite:///:memory:`), or running `db.create_all()`.
   When `python -m pytest` executes, Flask initializes with the environment's `DATABASE_URL` (Neon Postgres). Because Alembic schema migrations have not been applied to the Neon database, Postgres throws `psycopg2.errors.UndefinedTable` (`relation "membership_tiers" does not exist`, `relation "users" does not exist`).
2. **Local Fallback Failure (`app.db`)**:
   When `DATABASE_URL` is omitted, `create_app()` falls back to `app.db` in the repository root. That SQLite database contains an outdated schema prior to Milestone 1, causing `OperationalError: table users has no column named birth_date`.

---

## 4. Adversarial Attack Surface & Failure Modes

1. **Test Environment Fragility (High Risk)**:
   - Worker 1's unit tests are tightly coupled to the ambient database connection rather than using isolated test fixtures. Any developer running `pytest` without a fully migrated database will experience test suite failure.
2. **Timezone Awareness Handling (Medium Risk)**:
   - `GiftCard`, `LoyaltyPointsEntry`, `LoyaltyVoucher`, and `ReferralConversion` use `default=datetime.utcnow` (naive UTC), whereas `User`, `Category`, `Product`, `Order`, `CartItem`, and `WishlistItem` use `default=lambda: datetime.now(timezone.utc)` (timezone-aware UTC).
   - In Python 3.12+, `datetime.utcnow()` is deprecated and can produce naive datetime objects that fail exact string comparison when stored in timezone-aware backends.

---

## 5. Required Mitigations for Worker 1

1. **Update `tests/test_m1_1_models.py`**:
   Use a pytest fixture that configures `app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'` and calls `db.create_all()` before tests run.
2. **Standardize Datetime Defaults in `api/core/models.py`**:
   Replace `datetime.utcnow` in `GiftCard`, `LoyaltyPointsEntry`, `LoyaltyVoucher`, and `ReferralConversion` with `lambda: datetime.now(timezone.utc)` to match the rest of the codebase and avoid Python 3.12 deprecation warnings.
3. **Database Migration Execution**:
   Run `python -m flask --app api db migrate -m "Add Milestone 1 models and User fields"` and `python -m flask --app api db upgrade` to ensure both local and Neon databases have updated tables.
