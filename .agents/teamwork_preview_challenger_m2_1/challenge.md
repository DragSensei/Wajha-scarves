# Milestone 2 Settings Whitelist & API Stress Challenge Report

## Challenge Summary

**Overall risk assessment**: LOW

Empirical testing confirmed that the backend settings API (`GET /api/settings`, `PUT /api/settings`) strictly enforces authorization, key whitelisting, type coercion for valid scalars, and rejection of non-scalar data types (dicts, lists, nulls). 

All 19 whitelisted keys were updated via PUT and retrieved via GET with 100% data integrity. All unwhitelisted keys (including SQL injection strings, XSS payloads, internal model attributes) and non-scalar values were correctly rejected with HTTP 400 Bad Request. All unauthorized / non-admin access attempts were rejected with HTTP 401/403.

Total pytest suite results: **46 passed in 22.04s** (23 standard tier/settings tests + 23 dedicated stress tests).

Result: **PASS**

---

## Challenges

### [Low] Challenge 1: Type Coercion of Numeric/Boolean Scalars into Strings
- **Assumption challenged**: Settings values are expected to be stored and returned as string representations, but input payloads may supply numbers or booleans (e.g. `{"discount_percent": 15, "sale_active": true}`).
- **Attack scenario**: Sending integer/float/boolean JSON primitives might either cause database type mismatch errors or unhandled schema validation exceptions if not explicitly coerced.
- **Blast radius**: Low. Internal error HTTP 500 or failed setting updates.
- **Mitigation**: `update_settings` explicitly performs type coercion for `(int, float, bool)` via `str(value)`, converting them safely into strings before setting persistence.
- **Empirical result**: Verified via `test_scalar_types_conversion`. `15` -> `"15"`, `2.5` -> `"2.5"`, `True` -> `"True"`. PASS.

### [Low] Challenge 2: Atomic Rollback on Injected Invalid Keys in Mixed Payloads
- **Assumption challenged**: If an attacker sends a bulk settings update containing 18 valid keys and 1 unwhitelisted key, partial updates might persist before the invalid key error triggers.
- **Attack scenario**: An attacker submits a mixed payload hoping that valid configuration keys are overwritten while the request fails.
- **Blast radius**: Low/Medium. Partial state corruption.
- **Mitigation**: Route handler validates all keys in the input dictionary prior to modifying database records.
- **Empirical result**: Verified via `test_reject_unwhitelisted_key_in_mixed_payload_atomicity`. The entire request is aborted with HTTP 400, and zero keys are written to the DB. PASS.

---

## Stress Test Results

| Scenario | Expected Behavior | Actual Behavior | Result |
| --- | --- | --- | --- |
| 19 Whitelisted Keys PUT/GET | Update 19 keys, fetch via GET with matching values | HTTP 200, all 19 keys returned matching updated values | PASS |
| Single Unwhitelisted Key (`unauthorized_setting`) | Reject with HTTP 400 Bad Request | HTTP 400, `{"error": "Invalid setting key..."}` | PASS |
| SQLi Key Injection (`DROP TABLE settings;`) | Reject with HTTP 400 Bad Request | HTTP 400, `{"error": "Invalid setting key..."}` | PASS |
| XSS Key Injection (`<script>alert(1)</script>`) | Reject with HTTP 400 Bad Request | HTTP 400, `{"error": "Invalid setting key..."}` | PASS |
| Proto Pollution Key (`__proto__`) | Reject with HTTP 400 Bad Request | HTTP 400, `{"error": "Invalid setting key..."}` | PASS |
| Sensitive Key Injection (`SECRET_KEY`, `user_role`) | Reject with HTTP 400 Bad Request | HTTP 400, `{"error": "Invalid setting key..."}` | PASS |
| Mixed Valid + Invalid Keys | Reject with HTTP 400, no DB state modified | HTTP 400, zero keys modified in DB | PASS |
| Dict Value (`{"nested": "value"}`) | Reject with HTTP 400 Bad Request | HTTP 400, `{"error": "Setting values must be strings"}` | PASS |
| List of Ints (`[1, 2, 3]`) | Reject with HTTP 400 Bad Request | HTTP 400, `{"error": "Setting values must be strings"}` | PASS |
| List of Strings (`["a", "b"]`) | Reject with HTTP 400 Bad Request | HTTP 400, `{"error": "Setting values must be strings"}` | PASS |
| Nested Dict (`{"a": {"b": 1}}`) | Reject with HTTP 400 Bad Request | HTTP 400, `{"error": "Setting values must be strings"}` | PASS |
| List of Dicts (`[{"a": True}]`) | Reject with HTTP 400 Bad Request | HTTP 400, `{"error": "Setting values must be strings"}` | PASS |
| Null / None Value (`None`) | Reject with HTTP 400 Bad Request | HTTP 400, `{"error": "Setting values must be strings"}` | PASS |
| Unauthenticated Access (GET/PUT) | Reject with HTTP 401/403 | HTTP 401/403 Unauthorized | PASS |
| Non-Admin Regular User Access (GET/PUT) | Reject with HTTP 401/403 | HTTP 401/403 Unauthorized | PASS |
| Empty JSON Payload `{}` | HTTP 200 OK | HTTP 200 OK | PASS |
| Non-JSON Content Type | Reject with HTTP 400 Bad Request | HTTP 400 Bad Request | PASS |
| JSON Array Payload `[...]` | Reject with HTTP 400 Bad Request | HTTP 400 Bad Request | PASS |

---

## Unchallenged Areas

- Frontend settings UI rendering — out of scope for Challenger 1 (backend API stress focus).
- Rate limiter exhaustion limits in production environment — tested local rate limiter headers, production redis backend out of scope.
