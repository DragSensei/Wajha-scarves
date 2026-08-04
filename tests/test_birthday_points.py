import pytest
from datetime import datetime, timezone
from api import create_app
from api.core.db import db
from api.core.models import User, LoyaltyPointsEntry, LoyaltyVoucher
from api.features.loyalty.services import issue_birthday_rewards, get_user_loyalty_status

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

def test_birthday_points_and_voucher_issuance(app):
    with app.app_context():
        today = datetime.now(timezone.utc).date()
        user = User(
            email='birthday_user@test.com',
            full_name='Birthday User',
            role='user',
            password_hash='dummy',
            birth_date=today
        )
        db.session.add(user)
        db.session.commit()

        # Run birthday rewards issuance
        res = issue_birthday_rewards(target_user_id=user.id)
        assert res['birthday_users_found'] == 1
        assert res['points_entries_created'] == 1
        assert res['vouchers_issued'] == 1

        # Verify points entry created
        pts_entry = LoyaltyPointsEntry.query.filter_by(user_id=user.id, source='birthday_points').first()
        assert pts_entry is not None
        assert pts_entry.amount == 150

        # Verify status endpoint reflects updated balance
        status = get_user_loyalty_status(user.id)
        assert status['points_balance'] == 150
        assert len(status['active_vouchers']) == 1
