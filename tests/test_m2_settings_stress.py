import pytest
from api import create_app, Config
from api.core.db import db
from api.core.models import User, Setting

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

ALL_19_WHITELISTED_KEYS = [
    'sale_active',
    'discount_active',
    'discount_percent',
    'custom_sale_text',
    'discount_categories',
    'discount_product_ids',
    'whatsapp_number',
    'contact_number',
    'sale_bundle_name',
    'owner_whatsapp',
    'points_per_egp',
    'points_to_egp_rate',
    'review_bonus_points',
    'social_follow_bonus_points',
    'referral_voucher_amount',
    'referral_voucher_min_spend',
    'referral_min_order_amount',
    'points_expiry_months',
    'voucher_expiry_months'
]

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        # Seed admin user
        admin = User(email="admin@example.com", full_name="Admin User", role="admin")
        admin.set_password("adminpass123")
        # Seed regular user
        student = User(email="student@example.com", full_name="Student User", role="student")
        student.set_password("studentpass123")
        
        db.session.add_all([admin, student])
        db.session.commit()
        
        yield app
        
        db.session.remove()
        db.drop_all()

@pytest.fixture
def admin_client(app):
    client = app.test_client()
    client.post('/api/auth/login', json={"email": "admin@example.com", "password": "adminpass123"})
    return client

@pytest.fixture
def regular_client(app):
    client = app.test_client()
    client.post('/api/auth/login', json={"email": "student@example.com", "password": "studentpass123"})
    return client

@pytest.fixture
def anon_client(app):
    return app.test_client()

# ============================================================================
# 1. VERIFY ALL 19 WHITELISTED KEYS (GET & PUT)
# ============================================================================

def test_all_19_whitelisted_keys_get_and_put(admin_client):
    """Verify all 19 whitelisted settings keys can be updated via PUT and fetched via GET."""
    payload = {key: f"test_val_{i}" for i, key in enumerate(ALL_19_WHITELISTED_KEYS)}
    assert len(payload) == 19
    
    # 1. Update via PUT
    res_put = admin_client.put('/api/settings', json=payload)
    assert res_put.status_code == 200, f"PUT failed: {res_put.get_data(as_text=True)}"
    data_put = res_put.get_json()
    
    for key, expected_val in payload.items():
        assert key in data_put, f"Key {key} missing from PUT response"
        assert data_put[key] == expected_val, f"Mismatch for key {key} in PUT response"
        
    # 2. Fetch via GET
    res_get = admin_client.get('/api/settings')
    assert res_get.status_code == 200, f"GET failed: {res_get.get_data(as_text=True)}"
    data_get = res_get.get_json()
    
    for key, expected_val in payload.items():
        assert key in data_get, f"Key {key} missing from GET response"
        assert data_get[key] == expected_val, f"Mismatch for key {key} in GET response"

def test_scalar_types_conversion(admin_client):
    """Verify int, float, and bool scalar values are converted to strings properly."""
    payload = {
        "discount_percent": 15,
        "points_to_egp_rate": 2.5,
        "sale_active": True
    }
    res = admin_client.put('/api/settings', json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data["discount_percent"] == "15"
    assert data["points_to_egp_rate"] == "2.5"
    assert data["sale_active"] == "True" or data["sale_active"] == "true" or data["sale_active"] == "True"

# ============================================================================
# 2. REJECT UNWHITELISTED KEYS
# ============================================================================

@pytest.mark.parametrize("invalid_key", [
    "unauthorized_setting",
    "DROP TABLE settings;",
    "<script>alert(1)</script>",
    "__proto__",
    "admin_password",
    "user_role",
    "SECRET_KEY",
    "is_admin"
])
def test_reject_unwhitelisted_keys(admin_client, invalid_key):
    """Verify any single unwhitelisted key returns 400 Bad Request."""
    payload = {invalid_key: "malicious_value"}
    res = admin_client.put('/api/settings', json=payload)
    assert res.status_code == 400
    data = res.get_json()
    assert "error" in data
    assert "Invalid setting key" in data["error"]

def test_reject_unwhitelisted_key_in_mixed_payload_atomicity(admin_client):
    """Verify mixed payload with 18 valid keys + 1 invalid key fails atomically with 400."""
    payload = {key: f"valid_val_{i}" for i, key in enumerate(ALL_19_WHITELISTED_KEYS[:18])}
    payload["hacker_injected_key"] = "exploit"
    
    res = admin_client.put('/api/settings', json=payload)
    assert res.status_code == 400
    data = res.get_json()
    assert "Invalid setting key" in data["error"]
    
    # Verify no keys were updated in DB
    res_get = admin_client.get('/api/settings')
    data_get = res_get.get_json()
    assert "hacker_injected_key" not in data_get
    for key in ALL_19_WHITELISTED_KEYS[:18]:
        assert data_get.get(key) != payload[key]

# ============================================================================
# 3. REJECT NON-SCALAR VALUES (DICTS, LISTS, NONE)
# ============================================================================

@pytest.mark.parametrize("non_scalar_val", [
    {"nested_key": "nested_value"},
    [1, 2, 3],
    ["string", "in", "list"],
    {"a": {"b": 1}},
    [{"list_of_dicts": True}],
    None
])
def test_reject_non_scalar_values(admin_client, non_scalar_val):
    """Verify non-scalar values (dicts, lists, None) return 400 Bad Request."""
    payload = {"sale_active": non_scalar_val}
    res = admin_client.put('/api/settings', json=payload)
    assert res.status_code == 400
    data = res.get_json()
    assert "error" in data
    assert "Setting values must be strings" in data["error"]

# ============================================================================
# 4. REJECT NON-ADMIN ACCESS (401 / 403)
# ============================================================================

def test_reject_anonymous_access(anon_client):
    """Verify anonymous unauthenticated users are rejected with 401 or 403."""
    res_get = anon_client.get('/api/settings')
    assert res_get.status_code in (401, 403)
    
    res_put = anon_client.put('/api/settings', json={"sale_active": "true"})
    assert res_put.status_code in (401, 403)

def test_reject_regular_user_access(regular_client):
    """Verify non-admin authenticated users are rejected with 401 or 403."""
    res_get = regular_client.get('/api/settings')
    assert res_get.status_code in (401, 403)
    
    res_put = regular_client.put('/api/settings', json={"sale_active": "true"})
    assert res_put.status_code in (401, 403)

def test_reject_regular_user_unwhitelisted_put(regular_client):
    """Verify non-admin user cannot trigger key validation logic (auth check happens first)."""
    res_put = regular_client.put('/api/settings', json={"unauthorized_key": "val"})
    assert res_put.status_code in (401, 403)

# ============================================================================
# 5. ADDITIONAL EDGE CASES & RESILIENCE
# ============================================================================

def test_empty_json_update(admin_client):
    """Updating with empty dict should succeed without modifying existing settings."""
    res = admin_client.put('/api/settings', json={})
    assert res.status_code == 200

def test_non_json_content_type(admin_client):
    """Submitting non-JSON content type returns 400."""
    res = admin_client.put('/api/settings', data="key=value", content_type="application/x-www-form-urlencoded")
    assert res.status_code == 400

def test_json_array_body(admin_client):
    """Submitting JSON array instead of JSON object returns 400."""
    res = admin_client.put('/api/settings', json=["sale_active", "true"])
    assert res.status_code == 400
