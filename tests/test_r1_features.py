import pytest
from datetime import datetime, timezone, timedelta
from api import create_app, Config
from api.core.db import db
from api.core.models import User, Product, Category, GiftCard, DonationRecord, LoyaltyPointsEntry, LoyaltyVoucher, Setting

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        admin = User(email="admin@example.com", full_name="Admin User", role="admin")
        admin.set_password("adminpass123")
        db.session.add(admin)
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
def client(app):
    return app.test_client()

def test_generate_and_validate_gift_card(admin_client, client):
    # Create gift card via admin API
    res = admin_client.post('/api/admin/gift-cards', json={'value': 250.0, 'expiry_months': 6})
    assert res.status_code == 201
    data = res.get_json()
    code = data['gift_card']['code']
    assert len(code) == 16
    assert data['gift_card']['value'] == 250.0

    # Validate gift card via customer route
    val_res = client.post('/api/orders/validate-gift-card', json={'code': code})
    assert val_res.status_code == 200
    val_data = val_res.get_json()
    assert val_data['valid'] is True
    assert val_data['value'] == 250.0

def test_donations_summary_and_status(admin_client):
    # Fetch summary
    res = admin_client.get('/api/admin/donations/summary')
    assert res.status_code == 200
    summary = res.get_json()
    assert 'period' in summary
    assert 'accrued_amount' in summary

    # Update donation status
    update_res = admin_client.put('/api/admin/donations/status', json={
        'period': summary['period'],
        'status': 'donated',
        'note': 'Transferred to Red Crescent'
    })
    assert update_res.status_code == 200
    assert update_res.get_json()['status'] == 'donated'

def test_loyalty_cron_endpoints(client, app):
    # Reconcile cron
    rec_res = client.post('/api/loyalty/cron/reconcile')
    assert rec_res.status_code == 200
    assert 'orders_processed' in rec_res.get_json()

    # Birthdays cron
    bday_res = client.post('/api/loyalty/cron/birthdays')
    assert bday_res.status_code == 200
    assert 'birthday_users_found' in bday_res.get_json()
