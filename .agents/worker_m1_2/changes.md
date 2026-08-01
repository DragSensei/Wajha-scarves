# Implementation Changes Report - Worker 2 (M1 Iteration 2 Remediation)

## Modified Files

### 1. `tests/test_m1_1_models.py`
- **Changes**: Added `TestConfig(Config)` class setting `TESTING=True` and `SQLALCHEMY_DATABASE_URI='sqlite:///:memory:'`, and created `@pytest.fixture def app():` that passes `TestConfig` to `create_app()`, creates database schema via `db.create_all()`, yields `app`, and tears down via `db.session.remove()` and `db.drop_all()`.
- **Purpose**: Ensures 100% test database isolation in SQLite in-memory DB without affecting external or persistent database schemas.
- **Affected functions**: `test_user_model_m1_updates(app)`, `test_m1_new_models(app)`, `test_allowed_settings(app)`.

### 2. `migrations/versions/a42ba4f066bf_add_r1_models_and_settings_seed.py`
- **Changes**:
  - In `upgrade()`, specified explicit names for constraints on `users`:
    `batch_op.create_unique_constraint('uq_users_referral_code', ['referral_code'])`
    `batch_op.create_foreign_key('fk_users_referred_by_id', 'users', ['referred_by_id'], ['id'], ondelete='SET NULL')`
  - In `downgrade()`, dropped constraints explicitly by name:
    `batch_op.drop_constraint('fk_users_referred_by_id', type_='foreignkey')`
    `batch_op.drop_constraint('uq_users_referral_code', type_='unique')`
  - In `downgrade()`, added SQL delete query for seeded setting keys to allow idempotent upgrade/downgrade migration cycles.
- **Purpose**: Prevent constraint naming mismatches across database engines (e.g. PostgreSQL vs SQLite) and guarantee clean migration downgrades and upgrades.

### 3. `api/core/models.py`
- **Changes**: Replaced `default=datetime.utcnow` with `default=lambda: datetime.now(timezone.utc)` across 4 models:
  - `GiftCard.created_at`
  - `LoyaltyPointsEntry.earned_at`
  - `LoyaltyVoucher.created_at`
  - `ReferralConversion.created_at`
- **Purpose**: Fix Python 3.12+ datetime deprecation warning and enforce timezone-aware UTC default timestamp generation.

### 4. `tests/test_my_orders.py`
- **Changes**: Added admin user bootstrapping fallback in `test_my_orders()` if no admin user exists in the test DB environment.
- **Purpose**: Ensure standalone test suite self-containment.

## Verification Status
- `pytest`: Passed 15/15 tests (100%).
- `import-linter`: 0 broken contracts (2 kept).
- `npm run lint`: 0 ESLint errors.
- Migration testing: `flask db downgrade 54afcbd02d2c` and `flask db upgrade` executed cleanly without errors.
