import pytest
from api import create_app, Config
from api.core.db import db
from api.core.models import User, Setting, MembershipTier, Order

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        # Seed admin user
        admin = User(email="admin@example.com", full_name="Admin User", role="admin")
        admin.set_password("adminpass123")
        # Seed regular student user
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


# ============================================================================
# 1. SETTINGS ENDPOINTS TESTS
# ============================================================================

def test_get_settings_unauthorized(app):
    client = app.test_client()
    res = client.get('/api/settings')
    assert res.status_code in (401, 403)

def test_get_settings_regular_user(regular_client):
    res = regular_client.get('/api/settings')
    assert res.status_code in (401, 403)

def test_get_settings_success(admin_client):
    res = admin_client.get('/api/settings')
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, dict)

def test_update_settings_success(admin_client):
    payload = {
        "points_per_egp": "2",
        "review_bonus_points": "100",
        "sale_active": "true"
    }
    res = admin_client.put('/api/settings', json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data["points_per_egp"] == "2"
    assert data["review_bonus_points"] == "100"
    assert data["sale_active"] == "true"

def test_update_settings_invalid_key(admin_client):
    payload = {
        "unauthorized_key": "hack_attempt"
    }
    res = admin_client.put('/api/settings', json=payload)
    assert res.status_code == 400
    data = res.get_json()
    assert "error" in data
    assert "Invalid setting key" in data["error"]

def test_update_settings_non_string_value(admin_client):
    payload = {
        "points_per_egp": {"nested": "dict_value"}
    }
    res = admin_client.put('/api/settings', json=payload)
    assert res.status_code == 400
    data = res.get_json()
    assert "error" in data
    assert "Setting values must be strings" in data["error"]

def test_update_settings_partial_update(admin_client):
    admin_client.put('/api/settings', json={"whatsapp_number": "+201234567890"})
    res = admin_client.put('/api/settings', json={"contact_number": "+201098765432"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["whatsapp_number"] == "+201234567890"
    assert data["contact_number"] == "+201098765432"

def test_update_settings_non_json_body(admin_client):
    res = admin_client.put('/api/settings', data="not json", content_type="text/plain")
    assert res.status_code == 400


# ============================================================================
# 2. MEMBERSHIP TIERS CRUD TESTS
# ============================================================================

def test_get_tiers_empty(admin_client):
    res = admin_client.get('/api/admin/tiers')
    assert res.status_code == 200
    data = res.get_json()
    assert "tiers" in data
    assert isinstance(data["tiers"], list)

def test_create_tier_success(admin_client):
    payload = {
        "name": "Silver",
        "spend_threshold": 2000.0,
        "sort_order": 2
    }
    res = admin_client.post('/api/admin/tiers', json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert "tier" in data
    assert data["tier"]["name"] == "Silver"
    assert data["tier"]["spend_threshold"] == 2000.0
    assert data["tier"]["sort_order"] == 2

def test_create_tier_missing_name(admin_client):
    payload = {
        "spend_threshold": 1000.0
    }
    res = admin_client.post('/api/admin/tiers', json=payload)
    assert res.status_code == 400

def test_create_tier_duplicate_name(admin_client):
    payload = {"name": "Gold", "spend_threshold": 5000.0, "sort_order": 3}
    admin_client.post('/api/admin/tiers', json=payload)
    
    # Duplicate post
    res = admin_client.post('/api/admin/tiers', json=payload)
    assert res.status_code == 409
    data = res.get_json()
    assert "already exists" in data["error"]

def test_create_tier_negative_threshold(admin_client):
    payload = {"name": "Invalid", "spend_threshold": -100.0}
    res = admin_client.post('/api/admin/tiers', json=payload)
    assert res.status_code == 400

def test_create_tier_invalid_sort_order(admin_client):
    payload = {"name": "Invalid", "spend_threshold": 100.0, "sort_order": "abc"}
    res = admin_client.post('/api/admin/tiers', json=payload)
    assert res.status_code == 400

def test_get_tiers_ordered_by_sort_order(admin_client):
    admin_client.post('/api/admin/tiers', json={"name": "Tier 3", "spend_threshold": 3000.0, "sort_order": 3})
    admin_client.post('/api/admin/tiers', json={"name": "Tier 1", "spend_threshold": 1000.0, "sort_order": 1})
    admin_client.post('/api/admin/tiers', json={"name": "Tier 2", "spend_threshold": 2000.0, "sort_order": 2})

    res = admin_client.get('/api/admin/tiers')
    assert res.status_code == 200
    tiers = res.get_json()["tiers"]
    names = [t["name"] for t in tiers]
    assert names == ["Tier 1", "Tier 2", "Tier 3"]

def test_update_tier_success(admin_client):
    res_create = admin_client.post('/api/admin/tiers', json={"name": "Bronze", "spend_threshold": 0.0, "sort_order": 1})
    tier_id = res_create.get_json()["tier"]["id"]

    res_update = admin_client.put(f'/api/admin/tiers/{tier_id}', json={"name": "Bronze VIP", "spend_threshold": 500.0})
    assert res_update.status_code == 200
    data = res_update.get_json()["tier"]
    assert data["name"] == "Bronze VIP"
    assert data["spend_threshold"] == 500.0

def test_update_tier_not_found(admin_client):
    res = admin_client.put('/api/admin/tiers/9999', json={"name": "Ghost"})
    assert res.status_code == 404

def test_update_tier_duplicate_name(admin_client):
    admin_client.post('/api/admin/tiers', json={"name": "Tier Alpha", "spend_threshold": 1000.0, "sort_order": 1})
    res_b = admin_client.post('/api/admin/tiers', json={"name": "Tier Beta", "spend_threshold": 2000.0, "sort_order": 2})
    b_id = res_b.get_json()["tier"]["id"]

    res_dup = admin_client.put(f'/api/admin/tiers/{b_id}', json={"name": "Tier Alpha"})
    assert res_dup.status_code == 409

def test_delete_tier_success(admin_client):
    res_create = admin_client.post('/api/admin/tiers', json={"name": "Temp Tier", "spend_threshold": 999.0, "sort_order": 99})
    tier_id = res_create.get_json()["tier"]["id"]

    res_del = admin_client.delete(f'/api/admin/tiers/{tier_id}')
    assert res_del.status_code == 200

    # Verify deletion
    res_get = admin_client.get('/api/admin/tiers')
    ids = [t["id"] for t in res_get.get_json()["tiers"]]
    assert tier_id not in ids

def test_delete_tier_not_found(admin_client):
    res = admin_client.delete('/api/admin/tiers/9999')
    assert res.status_code == 404

def test_tiers_unauthorized_access(app, regular_client):
    client = app.test_client()
    assert client.get('/api/admin/tiers').status_code in (401, 403)
    assert client.post('/api/admin/tiers', json={"name": "Test"}).status_code in (401, 403)
    assert regular_client.get('/api/admin/tiers').status_code in (401, 403)
    assert regular_client.post('/api/admin/tiers', json={"name": "Test"}).status_code in (401, 403)


# ============================================================================
# 3. LIFETIME SPEND CALCULATION & TIER RANKING TESTS
# ============================================================================

def test_user_spend_completed_orders_only(app, admin_client):
    with app.app_context():
        # Create Tiers: Bronze ($0), Silver ($2000), Gold ($5000)
        admin_client.post('/api/admin/tiers', json={"name": "Bronze", "spend_threshold": 0.0, "sort_order": 1})
        admin_client.post('/api/admin/tiers', json={"name": "Silver", "spend_threshold": 2000.0, "sort_order": 2})
        admin_client.post('/api/admin/tiers', json={"name": "Gold", "spend_threshold": 5000.0, "sort_order": 3})

        student = User.query.filter_by(email="student@example.com").first()

        # Completed orders
        o1 = Order(user_id=student.id, customer_name="Student", total_amount=1200.0, status='completed')
        o2 = Order(user_id=student.id, customer_name="Student", total_amount=1500.0, status='completed')
        # Non-completed orders (should be excluded)
        o3 = Order(user_id=student.id, customer_name="Student", total_amount=4000.0, status='pending')
        o4 = Order(user_id=student.id, customer_name="Student", total_amount=3000.0, status='cancelled')

        db.session.add_all([o1, o2, o3, o4])
        db.session.commit()

    res = admin_client.get('/api/admin/tiers/users')
    assert res.status_code == 200
    users_data = res.get_json()["users"]

    student_data = next((u for u in users_data if u["email"] == "student@example.com"), None)
    assert student_data is not None
    # 1200 + 1500 = 2700.0 (pending & cancelled excluded)
    assert student_data["lifetime_spend"] == 2700.0
    assert student_data["tier"] is not None
    assert student_data["tier"]["name"] == "Silver"

def test_user_spend_zero_orders(admin_client):
    admin_client.post('/api/admin/tiers', json={"name": "Bronze", "spend_threshold": 0.0, "sort_order": 1})
    
    res = admin_client.get('/api/admin/tiers/users')
    assert res.status_code == 200
    users_data = res.get_json()["users"]

    admin_data = next((u for u in users_data if u["email"] == "admin@example.com"), None)
    assert admin_data is not None
    assert admin_data["lifetime_spend"] == 0.0
    assert admin_data["tier"]["name"] == "Bronze"
