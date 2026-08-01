import datetime
import pytest
from api import create_app, Config
from api.core.db import db
from api.core.models import (
    User, Setting, MembershipTier, DonationRecord, GiftCard,
    LoyaltyPointsEntry, LoyaltyVoucher, ReferralConversion, Order
)

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


def test_user_model_m1_updates(app):
    with app.app_context():
        # Create referrer
        u1 = User(
            email="referrer@example.com",
            full_name="Referrer User",
            referral_code="REF123456"
        )
        u1.set_password("pass1234")
        db.session.add(u1)
        db.session.commit()

        # Create referee
        today = datetime.date(1995, 5, 20)
        u2 = User(
            email="referee@example.com",
            full_name="Referee User",
            birth_date=today,
            referral_code="REF987654",
            referred_by_id=u1.id
        )
        u2.set_password("pass1234")
        db.session.add(u2)
        db.session.commit()

        # Verify relationships
        assert u2.referred_by.id == u1.id
        assert u1.referees.count() == 1
        assert u1.referees.first().id == u2.id

        # Verify to_dict()
        d2 = u2.to_dict()
        assert d2['birth_date'] == '1995-05-20'
        assert d2['referral_code'] == 'REF987654'

        d1 = u1.to_dict()
        assert d1['birth_date'] is None
        assert d1['referral_code'] == 'REF123456'

        # Cleanup
        db.session.delete(u2)
        db.session.delete(u1)
        db.session.commit()


def test_m1_new_models(app):
    with app.app_context():
        # 1. MembershipTier
        mt = MembershipTier(name="VIP Test Tier", spend_threshold=15000.0, sort_order=5)
        db.session.add(mt)
        db.session.commit()
        mt_dict = mt.to_dict()
        assert mt_dict['name'] == "VIP Test Tier"
        assert mt_dict['spend_threshold'] == 15000.0
        assert mt_dict['sort_order'] == 5

        # 2. DonationRecord
        dr = DonationRecord(period="2026-Q3", status="pending", note="Quarterly charity donation")
        db.session.add(dr)
        db.session.commit()
        dr_dict = dr.to_dict()
        assert dr_dict['period'] == "2026-Q3"
        assert dr_dict['status'] == "pending"
        assert dr_dict['note'] == "Quarterly charity donation"

        # 3. GiftCard
        gc = GiftCard(code="GC-TEST-100", value=100.0)
        db.session.add(gc)
        db.session.commit()
        gc_dict = gc.to_dict()
        assert gc_dict['code'] == "GC-TEST-100"
        assert gc_dict['value'] == 100.0
        assert gc_dict['is_redeemed'] is False

        # Create users for FK relationships
        u1 = User(email="test_loyalty_ref1@example.com", full_name="Loyalty Referrer")
        u1.set_password("pass123")
        u2 = User(email="test_loyalty_ref2@example.com", full_name="Loyalty Referee")
        u2.set_password("pass123")
        db.session.add_all([u1, u2])
        db.session.commit()

        # 4. LoyaltyPointsEntry
        lpe = LoyaltyPointsEntry(user_id=u1.id, amount=50, source="review")
        db.session.add(lpe)
        db.session.commit()
        lpe_dict = lpe.to_dict()
        assert lpe_dict['user_id'] == u1.id
        assert lpe_dict['amount'] == 50
        assert lpe_dict['source'] == "review"

        # 5. LoyaltyVoucher
        lv = LoyaltyVoucher(user_id=u1.id, value=200.0, source="referral", min_order_amount=2000.0)
        db.session.add(lv)
        db.session.commit()
        lv_dict = lv.to_dict()
        assert lv_dict['user_id'] == u1.id
        assert lv_dict['value'] == 200.0
        assert lv_dict['min_order_amount'] == 2000.0
        assert lv_dict['redeemed'] is False

        # 6. ReferralConversion
        order = Order(customer_name="Test Customer", total_amount=2500.0)
        db.session.add(order)
        db.session.commit()

        rc = ReferralConversion(referrer_id=u1.id, referee_id=u2.id, qualifying_order_id=order.id, reward_issued=True)
        db.session.add(rc)
        db.session.commit()
        rc_dict = rc.to_dict()
        assert rc_dict['referrer_id'] == u1.id
        assert rc_dict['referee_id'] == u2.id
        assert rc_dict['qualifying_order_id'] == order.id
        assert rc_dict['reward_issued'] is True

        # Cleanup
        db.session.delete(rc)
        db.session.delete(order)
        db.session.delete(lv)
        db.session.delete(lpe)
        db.session.delete(u2)
        db.session.delete(u1)
        db.session.delete(gc)
        db.session.delete(dr)
        db.session.delete(mt)
        db.session.commit()


def test_allowed_settings(app):
    allowed = app.config['ALLOWED_SETTINGS']
    expected_new = {
        'points_per_egp', 'points_to_egp_rate', 'review_bonus_points', 
        'social_follow_bonus_points', 'referral_voucher_amount', 
        'referral_voucher_min_spend', 'referral_min_order_amount', 
        'points_expiry_months', 'voucher_expiry_months'
    }
    assert expected_new.issubset(allowed)


