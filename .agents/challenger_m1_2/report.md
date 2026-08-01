# Migration Resilience & Test Verification Report (Milestone 1)

**Date/Time**: 2026-07-30T14:50:00Z  
**Role**: Empirical Challenger 2 (Milestone 1)  
**VERDICT**: **FAIL**

---

## Executive Summary

Empirical testing of Milestone 1 database migrations, seed data, unit test suite, and architectural linters revealed a **CRITICAL failure in database migration downgrade capability**, which leads to **database state corruption** and **pytest suite failures**.

While seed data insertion in `Setting` and `MembershipTier` tables works during standard initial `upgrade`, and both `import-linter` and ESLint pass without violations, the migration downgrade script `a42ba4f066bf_add_r1_models_and_settings_seed.py` fails when attempting to drop unnamed constraints on the `users` table.

---

## 1. DB Migration Downgrade/Upgrade Cycle Empirical Testing

### Command Executed:
```bash
python -m flask --app api db downgrade 54afcbd02d2c
```

### Empirical Result: **FAILED (Exit Code: 1)**

### Exception Trace:
```
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running downgrade a42ba4f066bf -> 54afcbd02d2c, add_r1_models_and_settings_seed
Traceback (most recent call last):
  ...
  File "c:\Project\Wajha Technologies\Wajha Scarves\migrations\versions\a42ba4f066bf_add_r1_models_and_settings_seed.py", line 127, in downgrade
    with op.batch_alter_table('users', schema=None) as batch_op:
  ...
sqlalchemy.exc.CompileError: Can't emit DROP CONSTRAINT for constraint ForeignKeyConstraint(<sqlalchemy.sql.base.ReadOnlyColumnCollection object at 0x0000018681F5CF40>, None, table=Table('users', MetaData(), schema=None)); it has no name
```

### Root Cause Analysis:
In `migrations/versions/a42ba4f066bf_add_r1_models_and_settings_seed.py`:
1. In `upgrade()`:
   ```python
   with op.batch_alter_table('users', schema=None) as batch_op:
       batch_op.add_column(sa.Column('birth_date', sa.Date(), nullable=True))
       batch_op.add_column(sa.Column('referral_code', sa.String(length=12), nullable=True))
       batch_op.add_column(sa.Column('referred_by_id', sa.Integer(), nullable=True))
       batch_op.create_unique_constraint(None, ['referral_code'])
       batch_op.create_foreign_key(None, 'users', ['referred_by_id'], ['id'], ondelete='SET NULL')
   ```
   `create_unique_constraint(None, ...)` and `create_foreign_key(None, ...)` pass `None` for constraint names.
2. In `downgrade()`:
   ```python
   with op.batch_alter_table('users', schema=None) as batch_op:
       batch_op.drop_constraint(None, type_='foreignkey')
       batch_op.drop_constraint(None, type_='unique')
       batch_op.drop_column('referred_by_id')
       batch_op.drop_column('referral_code')
       batch_op.drop_column('birth_date')
   ```
   Passing `None` to `drop_constraint` prevents Alembic/SQLAlchemy from constructing the `DROP CONSTRAINT` DDL statement, throwing a `CompileError`.

### Database Schema Corruption Impact:
When `downgrade` crashed halfway, Alembic dropped the tables:
- `referral_conversions`
- `loyalty_vouchers`
- `loyalty_points_entries`
- `membership_tiers`
- `gift_cards`
- `donation_records`

However, `alembic_version` remained at `a42ba4f066bf`. Subsequent calls to `python -m flask --app api db upgrade` log:
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
```
Alembic skips re-creating the dropped tables because `alembic_version` records that `a42ba4f066bf` has already been applied. This leaves the database in an unrecoverable, corrupted state unless manually repaired or reset.

---

## 2. Seed Data Integrity Check

Before downgrade attempt:
- `Setting` default keys present in DB:
  `points_per_egp` ('1'), `points_to_egp_rate` ('10'), `review_bonus_points` ('50'), `social_follow_bonus_points` ('50'), `referral_voucher_amount` ('200'), `referral_voucher_min_spend` ('2000'), `referral_min_order_amount` ('2000'), `points_expiry_months` ('6'), `voucher_expiry_months` ('1').
- `MembershipTier` default records present in DB:
  - Bronze (threshold: 0.0, sort_order: 1)
  - Silver (threshold: 2000.0, sort_order: 2)
  - Gold (threshold: 5000.0, sort_order: 3)
  - Platinum (threshold: 10000.0, sort_order: 4)

---

## 3. Pytest Suite Execution

### Command Executed:
```bash
python -m pytest
```

### Empirical Result: **FAILED (3 Passed, 3 Failed)**

```
=========================== short test summary info ===========================
FAILED tests/test_m1_1_models.py::test_m1_new_models - sqlalchemy.exc.IntegrityError: (psycopg2.errors.UniqueViolation) duplicate key value violates unique constraint "membership_tiers_name_key"
FAILED tests/test_query_counts.py::test_query_counts - sqlalchemy.exc.OperationalError / missing relation
FAILED tests/test_search.py::test_search_query - sqlalchemy.exc.ProgrammingError: (psycopg2.errors.UndefinedTable) relation "product" does not exist
======================== 3 failed, 3 passed in 30.05s =========================
```

### Root Cause Analysis:
1. `test_m1_new_models` failed because test setup/cleanup failed to isolate tests from persistent DB state, leaving duplicate keys when re-run.
2. `test_query_counts` and `test_search_query` failed due to missing tables resulting from the crashed migration downgrade.

---

## 4. Architectural Linters Verification

1. **Python Import Boundaries (`import-linter`)**:
   ```bash
   python -m importlinter.cli lint
   ```
   Result: **PASS** (0 contract violations found against `.importlinter`).

2. **Frontend ESLint (`npm run lint`)**:
   ```bash
   npm run lint
   ```
   Result: **PASS** (0 lint errors reported).

---

## Findings & Actionable Recommendations for Workers

1. **Fix Constraint Naming in Migration `a42ba4f066bf`**:
   - In `upgrade()`, assign explicit constraint names:
     - `create_unique_constraint('uq_users_referral_code', ['referral_code'])`
     - `create_foreign_key('fk_users_referred_by_id', 'users', ['referred_by_id'], ['id'], ondelete='SET NULL')`
   - In `downgrade()`, drop constraints using their explicit names:
     - `batch_op.drop_constraint('fk_users_referred_by_id', type_='foreignkey')`
     - `batch_op.drop_constraint('uq_users_referral_code', type_='unique')`

2. **Test DB Isolation**:
   - Configure pytest fixtures to run against a separate test DB or rollback transactions cleanly per test to avoid polluting the target environment.
