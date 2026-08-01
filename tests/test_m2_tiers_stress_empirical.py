import pytest
from api import create_app, Config
from api.core.db import db
from api.core.models import User, Setting, MembershipTier, Order

class StressTestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

@pytest.fixture
def app():
    app = create_app(StressTestConfig)
    with app.app_context():
        db.create_all()
        admin = User(email="admin_stress@example.com", full_name="Admin Stress", role="admin")
        admin.set_password("adminpass123")
        
        user_zero = User(email="user_zero@example.com", full_name="Zero Spend User", role="student")
        user_zero.set_password("userpass123")

        user_edge = User(email="user_edge@example.com", full_name="Edge Spend User", role="student")
        user_edge.set_password("userpass123")

        user_high = User(email="user_high@example.com", full_name="High Spend User", role="student")
        user_high.set_password("userpass123")

        db.session.add_all([admin, user_zero, user_edge, user_high])
        db.session.commit()
        
        yield app
        
        db.session.remove()
        db.drop_all()

@pytest.fixture
def admin_client(app):
    client = app.test_client()
    client.post('/api/auth/login', json={"email": "admin_stress@example.com", "password": "adminpass123"})
    return client


# ============================================================================
# EMPIRICAL STRESS TESTS FOR MILESTONE 2: TIERS CRUD & USER SPEND RANKING
# ============================================================================

def test_duplicate_tier_name_returns_409_conflict(admin_client):
    """Verify that creating a tier with duplicate name returns 409 Conflict."""
    payload = {"name": "VIP Gold", "spend_threshold": 5000.0, "sort_order": 1}
    res1 = admin_client.post('/api/admin/tiers', json=payload)
    assert res1.status_code == 201

    # Attempt exact duplicate
    res2 = admin_client.post('/api/admin/tiers', json=payload)
    assert res2.status_code == 409
    data2 = res2.get_json()
    assert "already exists" in data2.get("error", "")

    # Attempt duplicate with whitespace (should be stripped and conflict)
    payload_ws = {"name": " VIP Gold  ", "spend_threshold": 6000.0, "sort_order": 2}
    res3 = admin_client.post('/api/admin/tiers', json=payload_ws)
    assert res3.status_code == 409

    # Update tier to another existing tier name -> 409 Conflict
    res_silver = admin_client.post('/api/admin/tiers', json={"name": "VIP Silver", "spend_threshold": 2000.0, "sort_order": 2})
    assert res_silver.status_code == 201
    silver_id = res_silver.get_json()["tier"]["id"]

    res_update_conflict = admin_client.put(f'/api/admin/tiers/{silver_id}', json={"name": "VIP Gold"})
    assert res_update_conflict.status_code == 409


def test_tiers_returned_strictly_sorted_by_sort_order_ascending(admin_client):
    """Verify GET /api/admin/tiers returns items strictly sorted by sort_order ascending."""
    tiers_to_create = [
        {"name": "Tier Diamond", "spend_threshold": 10000.0, "sort_order": 10},
        {"name": "Tier Bronze", "spend_threshold": 0.0, "sort_order": 1},
        {"name": "Tier Gold", "spend_threshold": 5000.0, "sort_order": 5},
        {"name": "Tier Silver 2", "spend_threshold": 2500.0, "sort_order": 3},
        {"name": "Tier Silver 1", "spend_threshold": 2000.0, "sort_order": 3},
    ]

    for t in tiers_to_create:
        res = admin_client.post('/api/admin/tiers', json=t)
        assert res.status_code == 201

    res_get = admin_client.get('/api/admin/tiers')
    assert res_get.status_code == 200
    tiers = res_get.get_json()["tiers"]

    sort_orders = [t["sort_order"] for t in tiers]
    assert sort_orders == sorted(sort_orders), f"Sort orders not ascending: {sort_orders}"

    # Verify order of names
    expected_order = ["Tier Bronze", "Tier Silver 1", "Tier Silver 2", "Tier Gold", "Tier Diamond"]
    actual_names = [t["name"] for t in tiers]
    assert actual_names == expected_order, f"Expected {expected_order}, got {actual_names}"


def test_user_lifetime_completed_spend_filters_status_completed_only(app, admin_client):
    """Verify spend calculation includes ONLY status=='completed' orders."""
    with app.app_context():
        user = User.query.filter_by(email="user_edge@example.com").first()

        orders = [
            # Completed orders (Total = 150.0 + 350.50 = 500.50)
            Order(user_id=user.id, customer_name="Edge", total_amount=150.00, status='completed'),
            Order(user_id=user.id, customer_name="Edge", total_amount=350.50, status='completed'),

            # Non-completed orders (MUST BE EXCLUDED)
            Order(user_id=user.id, customer_name="Edge", total_amount=1000.00, status='pending'),
            Order(user_id=user.id, customer_name="Edge", total_amount=500.00, status='cancelled'),
            Order(user_id=user.id, customer_name="Edge", total_amount=750.00, status='processing'),
            Order(user_id=user.id, customer_name="Edge", total_amount=999.00, status='refunded'),
            Order(user_id=user.id, customer_name="Edge", total_amount=250.00, status='failed'),

            # Guest order with same email (no user_id) -> MUST BE EXCLUDED from user_id spend
            Order(user_id=None, customer_name="Edge", customer_email="user_edge@example.com", total_amount=9999.00, status='completed')
        ]
        db.session.add_all(orders)
        db.session.commit()

    res = admin_client.get('/api/admin/tiers/users')
    assert res.status_code == 200
    users = res.get_json()["users"]

    user_data = next((u for u in users if u["email"] == "user_edge@example.com"), None)
    assert user_data is not None
    assert user_data["lifetime_spend"] == 500.50, f"Expected 500.50, got {user_data['lifetime_spend']}"


def test_user_tier_assignment_boundary_and_highest_tier(app, admin_client):
    """Verify placement in highest tier where spend >= spend_threshold, and fallback to base tier (0.0)."""
    # Create tiers: Base (0), Silver (500), Gold (1000), Platinum (2500)
    admin_client.post('/api/admin/tiers', json={"name": "Base", "spend_threshold": 0.0, "sort_order": 1})
    admin_client.post('/api/admin/tiers', json={"name": "Silver", "spend_threshold": 500.0, "sort_order": 2})
    admin_client.post('/api/admin/tiers', json={"name": "Gold", "spend_threshold": 1000.0, "sort_order": 3})
    admin_client.post('/api/admin/tiers', json={"name": "Platinum", "spend_threshold": 2500.0, "sort_order": 4})

    with app.app_context():
        u_zero = User.query.filter_by(email="user_zero@example.com").first()
        u_edge = User.query.filter_by(email="user_edge@example.com").first()
        u_high = User.query.filter_by(email="user_high@example.com").first()

        # u_zero: spend = 0.0 -> Base (0.0)
        # u_edge: spend = 499.99 -> Base (0.0)
        # u_edge: spend = 500.00 exact -> Silver (500.0)
        # u_high: spend = 1000.00 exact -> Gold (1000.0)
        # u_high: spend = 3000.00 -> Platinum (2500.0)

        o_edge_below = Order(user_id=u_edge.id, customer_name="Edge", total_amount=499.99, status='completed')
        o_high_exact = Order(user_id=u_high.id, customer_name="High", total_amount=1000.00, status='completed')
        db.session.add_all([o_edge_below, o_high_exact])
        db.session.commit()

    res = admin_client.get('/api/admin/tiers/users')
    assert res.status_code == 200
    users_map = {u["email"]: u for u in res.get_json()["users"]}

    # Zero spend user
    assert users_map["user_zero@example.com"]["lifetime_spend"] == 0.0
    assert users_map["user_zero@example.com"]["tier"]["name"] == "Base"

    # Edge user (499.99 < 500.0) -> Base
    assert users_map["user_edge@example.com"]["lifetime_spend"] == 499.99
    assert users_map["user_edge@example.com"]["tier"]["name"] == "Base"

    # High user (1000.00 == 1000.0) -> Gold
    assert users_map["user_high@example.com"]["lifetime_spend"] == 1000.00
    assert users_map["user_high@example.com"]["tier"]["name"] == "Gold"

    # Add another completed order to u_edge to reach exact threshold 500.00
    with app.app_context():
        u_edge = User.query.filter_by(email="user_edge@example.com").first()
        db.session.add(Order(user_id=u_edge.id, customer_name="Edge", total_amount=0.01, status='completed'))
        db.session.commit()

    res2 = admin_client.get('/api/admin/tiers/users')
    users_map2 = {u["email"]: u for u in res2.get_json()["users"]}
    assert users_map2["user_edge@example.com"]["lifetime_spend"] == 500.00
    assert users_map2["user_edge@example.com"]["tier"]["name"] == "Silver"


def test_delete_tier_succeeds_cleanly(admin_client):
    """Verify tier deletion succeeds cleanly and user tiers update."""
    res_create = admin_client.post('/api/admin/tiers', json={"name": "Temp Tier", "spend_threshold": 999.0, "sort_order": 99})
    assert res_create.status_code == 201
    tier_id = res_create.get_json()["tier"]["id"]

    res_del = admin_client.delete(f'/api/admin/tiers/{tier_id}')
    assert res_del.status_code == 200
    data_del = res_del.get_json()
    assert data_del["message"] == "Tier deleted successfully"
    assert data_del["id"] == tier_id

    # Confirm tier no longer exists in GET /api/admin/tiers
    res_get = admin_client.get('/api/admin/tiers')
    tier_ids = [t["id"] for t in res_get.get_json()["tiers"]]
    assert tier_id not in tier_ids

    # Deleting non-existent tier -> 404 Not Found
    res_del_404 = admin_client.delete(f'/api/admin/tiers/{tier_id}')
    assert res_del_404.status_code == 404
