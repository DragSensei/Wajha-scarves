# Challenge Report — Milestone 2: Tiers CRUD & User Spend Ranking

## Challenge Summary

**Overall risk assessment**: LOW

All endpoints and business logic governing Tier CRUD operations (`/api/admin/tiers`) and User Lifetime Spend Ranking (`/api/admin/tiers/users`) have been empirically tested and verified. All 28 test assertions across the unit test suite and custom empirical stress tests passed with 100% success rate.

---

## Targeted Verification Areas & Empirical Stress Results

### 1. Duplicate Tier Name Conflict Handling (409 Conflict)
- **Assumption Tested**: Creating or updating a membership tier with a name that already exists (ignoring leading/trailing whitespace) must be rejected with HTTP status `409 Conflict` and a clear error message.
- **Attack / Stress Scenario**:
  - Created tier `VIP Gold` (201 Created).
  - Attempted duplicate POST with exact name `VIP Gold` -> returns `409 Conflict` (`"A tier named 'VIP Gold' already exists."`).
  - Attempted duplicate POST with leading/trailing spaces ` VIP Gold  ` -> returns `409 Conflict`.
  - Created tier `VIP Silver` (201 Created), then attempted PUT to rename `VIP Silver` to `VIP Gold` -> returns `409 Conflict`.
  - Updated `VIP Gold` with its own name `VIP Gold` -> returns `200 OK` (no self-conflict).
- **Result**: PASS

### 2. Tier Sorting by `sort_order` Ascending
- **Assumption Tested**: `GET /api/admin/tiers` must return all tiers strictly sorted by `sort_order` ascending. In case of identical `sort_order`, secondary ordering by `spend_threshold` ascending must be preserved.
- **Attack / Stress Scenario**:
  - Inserted tiers in randomized out-of-order sequence:
    - Tier Diamond: `sort_order=10`, `spend_threshold=10000.0`
    - Tier Bronze: `sort_order=1`, `spend_threshold=0.0`
    - Tier Gold: `sort_order=5`, `spend_threshold=5000.0`
    - Tier Silver 2: `sort_order=3`, `spend_threshold=2500.0`
    - Tier Silver 1: `sort_order=3`, `spend_threshold=2000.0`
  - Queried `GET /api/admin/tiers`.
  - Response order verified: `Tier Bronze` (1), `Tier Silver 1` (3), `Tier Silver 2` (3), `Tier Gold` (5), `Tier Diamond` (10).
- **Result**: PASS

### 3. User Lifetime Spend Calculation (Completed Orders Only)
- **Assumption Tested**: User lifetime completed spend calculation must sum `total_amount` ONLY for orders where `status == 'completed'`. Pending, cancelled, processing, refunded, and failed orders must be strictly excluded. Guest orders (no `user_id`) must not pollute registered user calculations.
- **Attack / Stress Scenario**:
  - Created user `user_edge@example.com` with:
    - 2 Completed orders: $150.00 + $350.50 = $500.50 total.
    - Non-completed orders: $1000 (pending), $500 (cancelled), $750 (processing), $999 (refunded), $250 (failed).
    - 1 Guest order ($9999 completed) sharing the user's email address but `user_id = None`.
  - Queried `GET /api/admin/tiers/users`.
  - Evaluated `lifetime_spend` for `user_edge@example.com`.
  - Actual lifetime spend calculated: `$500.50` (all non-completed and guest orders correctly excluded).
- **Result**: PASS

### 4. User Tier Assignment & Boundary Conditions
- **Assumption Tested**: Users are assigned to the highest tier where `lifetime_spend >= spend_threshold`. Users with zero spend fall back to base tier (`spend_threshold == 0.0`).
- **Attack / Stress Scenario**:
  - Tier setup: Base ($0.0), Silver ($500.0), Gold ($1000.0), Platinum ($2500.0).
  - Tested Zero-spend user ($0.0) -> assigned `Base` tier.
  - Tested Boundary below Silver ($499.99) -> assigned `Base` tier.
  - Tested Exact threshold equality ($500.00) -> assigned `Silver` tier.
  - Tested Exact threshold equality ($1000.00) -> assigned `Gold` tier.
  - Tested High spend ($3000.00) -> assigned `Platinum` tier.
- **Result**: PASS

### 5. Tier Deletion
- **Assumption Tested**: Deleting a tier via `DELETE /api/admin/tiers/<id>` succeeds cleanly (returns HTTP 200), removes the tier from the DB, and causes subsequent user tier evaluations to gracefully fall back to the next eligible tier. Deleting a non-existent tier returns HTTP 404.
- **Attack / Stress Scenario**:
  - Created temporary tier `Temp Tier` (id `tier_id`).
  - Issued `DELETE /api/admin/tiers/<tier_id>` -> returns `200 OK` with JSON `{"message": "Tier deleted successfully", "id": tier_id}`.
  - Verified tier removal from `GET /api/admin/tiers`.
  - Issued duplicate DELETE request for the deleted ID -> returns `404 Not Found`.
- **Result**: PASS

---

## Stress Test Results Summary

| Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|
| POST duplicate tier name | HTTP 409 Conflict | HTTP 409 Conflict | PASS |
| PUT rename tier to existing name | HTTP 409 Conflict | HTTP 409 Conflict | PASS |
| GET /api/admin/tiers sorting | `sort_order` ASC, `spend_threshold` ASC | Returned strictly sorted | PASS |
| Lifetime spend filtering | Completed orders only | Non-completed/guest excluded | PASS |
| Tier assignment boundary ($499.99 vs $500.00) | $499.99 -> Base; $500.00 -> Silver | Correct tier assigned | PASS |
| Zero-spend tier assignment | Base tier ($0.0 threshold) | Base tier assigned | PASS |
| DELETE /api/admin/tiers/<id> | HTTP 200 on success, 404 on missing | HTTP 200 success / 404 missing | PASS |

---

## Unchallenged Areas

- **Frontend Tier UI Components**: Out of scope for backend API empirical verification.
