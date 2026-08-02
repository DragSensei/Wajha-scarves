import pytest
from api import create_app
from api.core.db import db
from api.core.models import GiftCard
from api.features.vouchers.services import purchase_voucher, generate_voucher_code

class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SECRET_KEY = 'test_secret'
    JWT_SECRET = 'test_jwt_secret'
    ADMIN_PASSWORD = 'test_admin_password'
    WTF_CSRF_ENABLED = False
    RATELIMIT_ENABLED = False

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_generate_voucher_code():
    code = generate_voucher_code(500)
    assert code.startswith('DIY-500-')
    assert len(code) == 14  # DIY-500- (8) + 6 hex chars = 14 chars

def test_purchase_voucher_service(app):
    with app.app_context():
        data = {
            'value': 1000,
            'buyer_name': 'Test Buyer',
            'buyer_email': 'buyer@example.com',
            'recipient_name': 'Test Recipient',
            'recipient_email': 'recipient@example.com',
            'gift_message': 'Happy Birthday!'
        }
        card = purchase_voucher(data)
        assert card is not None
        assert card.value == 1000.0
        assert card.code.startswith('DIY-1000-')
        assert card.buyer_email == 'buyer@example.com'
        assert card.recipient_name == 'Test Recipient'

def test_buy_voucher_api_denominations(client):
    # Allowed: 100, 200, 500, 1000, 2000
    res_invalid = client.post('/api/vouchers/buy', json={'value': 350})
    assert res_invalid.status_code == 400
    assert 'Denomination must be one of' in res_invalid.get_json()['details']['value']

    for denom in [100, 200, 500, 1000, 2000]:
        res = client.post('/api/vouchers/buy', json={
            'value': denom,
            'buyer_name': 'User',
            'buyer_email': f'user{denom}@test.com'
        })
        assert res.status_code == 201
        data = res.get_json()
        assert data['success'] is True
        assert data['voucher']['value'] == float(denom)
        assert data['voucher']['code'].startswith(f'DIY-{denom}-')

def test_update_voucher_status(app):
    with app.app_context():
        from api.features.vouchers.services import update_voucher_status
        card = purchase_voucher({'value': 500, 'buyer_email': 'test@status.com'})
        assert card.status == 'pending'

        updated = update_voucher_status(card.id, 'contacted')
        assert updated.status == 'contacted'

        done_card = update_voucher_status(card.id, 'done')
        assert done_card.status == 'done'

