# Stress Test Report — Milestone 1 Iteration 2 Gate Review

**Author**: Challenger 3 (Empirical Challenger)  
**Date**: 2026-07-30  
**Target Directory**: `c:/Project/Wajha Technologies/Wajha Scarves`  
**VERDICT**: **FAIL**

---

## Executive Summary

An empirical evaluation was conducted on the data models (`api/core/models.py`), relationships, serializations, and test suite execution.

1. **`python -m pytest tests/test_challenger_m1_1.py`**: **PASS** (9/9 passed, 100% pass rate).
2. **`python -m pytest` (Full Test Suite)**: **FAIL** (11 passed, 3 failed, 2 errors).

The primary cause of the test suite failure is a **critical database fixture isolation defect** in `tests/test_m1_1_models.py`. The `app()` fixture invokes `create_app()` without passing a custom test configuration class. Calling `app.config.update({'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})` *after* `create_app()` has already initialized Flask-SQLAlchemy binds `db` to the project database (`app.db` or PostgreSQL from `.env`). Upon teardown, `db.drop_all()` wipes out all tables in the shared database environment, causing subsequent tests (`test_my_orders.py`, `test_query_counts.py`, `test_search.py`) to fail with missing table errors (`sqlite3.OperationalError: no such table: product`).

---

## Stress Test Results Summary

| Target Suite / File | Command | Status | Details |
|---|---|---|---|
| Challenger empirical tests | `python -m pytest tests/test_challenger_m1_1.py` | **PASS** | 9/9 passed cleanly (100% pass rate in 2.42s) |
| Model unit tests (Isolated) | `python -m pytest tests/test_m1_1_models.py` | **PASS** | 3/3 passed when run standalone |
| Full pytest suite | `python -m pytest` | **FAIL** | 11 passed, 3 failed, 2 errors (suite side-effect failure) |

---

## Detailed Model & Relationship Empirical Analysis

### 1. User Model (`User`)
- **Attributes Verified**: `birth_date` (`Date`), `referral_code` (`String(12)`, unique), `referred_by_id` (`ForeignKey('users.id')`).
- **Self-Referral Relationship**: `User.referred_by` (remote_side=[id]) and `User.referees` (dynamic backref) function correctly.
- **Serialization**: `birth_date` formats as ISO string `YYYY-MM-DD` when present, `None` when null. `referral_code` serializes directly.
- **Constraints**: Unique constraint on `referral_code` correctly raises `sqlalchemy.exc.IntegrityError` on duplicates.

### 2. Membership Tier (`MembershipTier`)
- **Attributes Verified**: `name` (unique), `spend_threshold` (`Float`), `sort_order` (`Integer`).
- **Serialization**: `to_dict()` outputs dictionary containing `id`, `name`, `spend_threshold`, `sort_order`.
- **Constraints**: Duplicate name raises `IntegrityError`.

### 3. Donation Record (`DonationRecord`)
- **Attributes Verified**: `period` (unique), `status`, `donated_at` (`DateTime`), `note`.
- **Serialization**: `to_dict()` formats `donated_at` as ISO datetime string when present, `None` when null.
- **Constraints**: Duplicate `period` raises `IntegrityError`.

### 4. Gift Card (`GiftCard`)
- **Attributes Verified**: `code` (unique), `value`, `is_redeemed`, `redeemed_at`, `expires_at`, `created_at`.
- **Serialization**: Datetime fields properly serialize to ISO strings or `None`.
- **Constraints**: Duplicate `code` raises `IntegrityError`.

### 5. Loyalty & Referral Models (`LoyaltyPointsEntry`, `LoyaltyVoucher`, `ReferralConversion`)
- **Foreign Keys**: Cascade delete behavior on `user_id` FK bindings; `ondelete='SET NULL'` on `qualifying_order_id`.
- **Serialization**: All `to_dict()` implementations perform type-safe conversion without throwing runtime exceptions.

---

## Challenge Summary & Findings

### Challenge 1: Unisolated Test Fixture Wipes Application Database (HIGH IMPACT)

- **Assumption challenged**: Running `python -m pytest` executes tests in isolation without destroying persistent or shared database state.
- **Attack Scenario**:
  1. `tests/test_m1_1_models.py` defines `app()` fixture as follows:
     ```python
     @pytest.fixture
     def app():
         app = create_app() # Inits Flask-SQLAlchemy with default Config (app.db or DATABASE_URL)
         app.config.update({
             'TESTING': True,
             'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
         })
         with app.app_context():
             db.create_all()
             yield app
             db.session.remove()
             db.drop_all() # Drops tables in app.db!
     ```
  2. When pytest executes `test_m1_1_models.py`, `db.drop_all()` drops all tables from `app.db`.
  3. Subsequent tests (`test_my_orders.py`, `test_query_counts.py`, `test_search.py`) attempt to query `Product`, `Order`, `User` from `app.db`.
  4. Execution fails with `OperationalError: no such table: product`.
- **Blast Radius**: Full pytest suite failure; local database corruption during test runs.
- **Mitigation**: Update `test_m1_1_models.py` to subclass `Config` (like `test_challenger_m1_1.py` does) and pass it into `create_app(TestConfig)` so `db.init_app(app)` binds directly to `:memory:`.

---

## Final Verdict

**VERDICT: FAIL**

Reason: `python -m pytest` failed with 3 test failures and 2 setup/teardown errors due to test suite database fixture unisolation.
