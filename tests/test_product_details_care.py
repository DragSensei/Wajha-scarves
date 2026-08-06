# ponytail: test custom product details and care instructions API persistence
import pytest
from api import create_app, Config
from api.core.db import db
from api.core.models import User, Product

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

def test_product_details_and_care_instructions_persistence(app):
    with app.app_context():
        p = Product(
            name="Test Silk Scarf",
            price=49.99,
            description="Luxury scarf description",
            details="Line 1: 100% Silk\nLine 2: 180x70cm",
            care_instructions="Dry clean only\nIron low"
        )
        db.session.add(p)
        db.session.commit()

        fetched = db.session.get(Product, p.id)
        assert fetched is not None
        assert fetched.details == "Line 1: 100% Silk\nLine 2: 180x70cm"
        assert fetched.care_instructions == "Dry clean only\nIron low"

def test_product_api_serialization(admin_client, client):
    # Create product with details & care_instructions
    resp = admin_client.post('/api/products', json={
        'name': 'API Details Scarf',
        'price': 99.0,
        'description': 'API product',
        'details': 'Custom Detail 1\nCustom Detail 2',
        'care_instructions': 'Wash cold'
    })

    assert resp.status_code == 201
    data = resp.get_json()
    assert data['details'] == 'Custom Detail 1\nCustom Detail 2'
    assert data['care_instructions'] == 'Wash cold'
    prod_id = data['id']

    # Update product
    update_resp = admin_client.put(f'/api/products/{prod_id}', json={
        'details': 'Updated Detail 1',
        'care_instructions': 'Updated Care 1'
    })

    assert update_resp.status_code == 200
    updated_data = update_resp.get_json()
    assert updated_data['details'] == 'Updated Detail 1'
    assert updated_data['care_instructions'] == 'Updated Care 1'

    # Get single product endpoint
    get_resp = client.get(f'/api/products/{prod_id}')
    assert get_resp.status_code == 200
    get_data = get_resp.get_json()
    assert get_data['details'] == 'Updated Detail 1'
    assert get_data['care_instructions'] == 'Updated Care 1'
