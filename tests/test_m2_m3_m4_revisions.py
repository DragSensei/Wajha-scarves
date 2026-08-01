import pytest
from datetime import datetime, timedelta
from api import create_app, Config
from api.core.db import db
from api.core.models import User, Setting, MembershipTier, DonationRecord, Order

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
        
        # Seed student user with birthdate
        student_with_bday = User(
            email="student_bday@example.com", 
            full_name="Student With Birthday", 
            role="student",
            birth_date=datetime.strptime("1995-05-15", "%Y-%m-%d").date()
        )
        student_with_bday.set_password("studentpass123")

        # Seed student user without birthdate
        student_no_bday = User(
            email="student_nobday@example.com", 
            full_name="Student No Birthday", 
            role="student"
        )
        student_no_bday.set_password("studentpass123")
        
        db.session.add_all([admin, student_with_bday, student_no_bday])
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
def bday_client(app):
    client = app.test_client()
    client.post('/api/auth/login', json={"email": "student_bday@example.com", "password": "studentpass123"})
    return client

@pytest.fixture
def no_bday_client(app):
    client = app.test_client()
    client.post('/api/auth/login', json={"email": "student_nobday@example.com", "password": "studentpass123"})
    return client


# ============================================================================
# 1. BIRTHDATE IMMUTABILITY & VALIDATION TESTS
# ============================================================================

def test_profile_update_immutable_birthdate(bday_client):
    # Attempting to change an already set birthdate must fail with HTTP 400
    res = bday_client.put('/api/auth/profile', json={"birth_date": "2000-01-01"})
    assert res.status_code == 400
    data = res.get_json()
    assert "immutable" in data["error"].lower()

def test_profile_update_set_birthdate_once(no_bday_client):
    # Setting birthdate when currently empty must succeed
    res = no_bday_client.put('/api/auth/profile', json={"birth_date": "1998-10-20"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["user"]["birth_date"] == "1998-10-20"

    # Second update attempt must be rejected
    res2 = no_bday_client.put('/api/auth/profile', json={"birth_date": "2000-01-01"})
    assert res2.status_code == 400

def test_register_future_birthdate_rejected(app):
    client = app.test_client()
    future_date = (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d')
    res = client.post('/api/auth/register', json={
        "email": "future_bday@example.com",
        "password": "password123",
        "full_name": "Future Person",
        "birth_date": future_date
    })
    assert res.status_code == 400
    data = res.get_json()
    assert "future" in str(data).lower()


# ============================================================================
# 2. SETTINGS DOMAIN & BOUNDS VALIDATION TESTS
# ============================================================================

def test_update_settings_percentage_out_of_bounds(admin_client):
    # Percentage above 100% must be rejected
    res = admin_client.put('/api/settings', json={"discount_percent": "150"})
    assert res.status_code == 400
    assert "between 0 and 100" in res.get_json()["error"]

    # Negative percentage must be rejected
    res2 = admin_client.put('/api/settings', json={"donation_percentage": "-10"})
    assert res2.status_code == 400
    assert "between 0 and 100" in res2.get_json()["error"]

def test_update_settings_negative_number(admin_client):
    res = admin_client.put('/api/settings', json={"points_per_egp": "-5"})
    assert res.status_code == 400
    assert "cannot be negative" in res.get_json()["error"]

def test_update_settings_valid_bounds(admin_client):
    res = admin_client.put('/api/settings', json={
        "discount_percent": "25.5",
        "donation_percentage": "7.5",
        "points_per_egp": "1.5"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["discount_percent"] == "25.5"
    assert data["donation_percentage"] == "7.5"


# ============================================================================
# 3. MEMBERSHIP TIER STRING COERCION TESTS
# ============================================================================

def test_create_tier_with_numeric_strings(admin_client):
    res = admin_client.post('/api/admin/tiers', json={
        "name": "Silver Star",
        "spend_threshold": "250.00",
        "sort_order": "2"
    })
    assert res.status_code == 201
    tier = res.get_json()["tier"]
    assert tier["name"] == "Silver Star"
    assert tier["spend_threshold"] == 250.0

def test_create_tier_invalid_negative_threshold(admin_client):
    res = admin_client.post('/api/admin/tiers', json={
        "name": "Invalid Tier",
        "spend_threshold": "-50",
        "sort_order": "1"
    })
    assert res.status_code == 400
