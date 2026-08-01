import datetime
import pytest
from sqlalchemy.exc import IntegrityError
from api import create_app, Config
from api.core.db import db
from api.core.models import (
    User, MembershipTier, DonationRecord, GiftCard,
    LoyaltyPointsEntry, LoyaltyVoucher, ReferralConversion, Order
)

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

def test_user_birth_date_and_referral_code(app):
    with app.app_context():
        bd = datetime.date(1990, 12, 25)
        user = User(
            email="referrer_challenger@example.com",
            full_name="Referrer User",
            birth_date=bd,
            referral_code="CHALLENGE123"
        )
        user.set_password("pass123")
        db.session.add(user)
        db.session.commit()

        assert user.id is not None
        assert user.birth_date == bd
        assert user.referral_code == "CHALLENGE123"

        d = user.to_dict()
        assert d["birth_date"] == "1990-12-25"
        assert d["referral_code"] == "CHALLENGE123"
        assert isinstance(d["created_at"], str)

def test_user_self_referral_link(app):
    with app.app_context():
        u1 = User(email="u1@example.com", full_name="User One", referral_code="REF001")
        u1.set_password("pass")
        db.session.add(u1)
        db.session.commit()

        u2 = User(
            email="u2@example.com",
            full_name="User Two",
            referral_code="REF002",
            referred_by_id=u1.id
        )
        u2.set_password("pass")
        db.session.add(u2)
        db.session.commit()

        assert u2.referred_by_id == u1.id
        assert u2.referred_by.id == u1.id
        assert u1.referees.count() == 1
        assert u1.referees.first().id == u2.id

def test_duplicate_referral_code_constraint(app):
    with app.app_context():
        u1 = User(email="dup1@example.com", full_name="Dup 1", referral_code="SAME_CODE")
        u1.set_password("pass")
        db.session.add(u1)
        db.session.commit()

        u2 = User(email="dup2@example.com", full_name="Dup 2", referral_code="SAME_CODE")
        u2.set_password("pass")
        db.session.add(u2)
        with pytest.raises(IntegrityError):
            db.session.commit()
        db.session.rollback()

def test_membership_tier_creation_to_dict_and_uniqueness(app):
    with app.app_context():
        mt1 = MembershipTier(name="Gold", spend_threshold=5000.0, sort_order=2)
        db.session.add(mt1)
        db.session.commit()

        d = mt1.to_dict()
        assert d == {
            "id": mt1.id,
            "name": "Gold",
            "spend_threshold": 5000.0,
            "sort_order": 2
        }

        mt2 = MembershipTier(name="Gold", spend_threshold=10000.0, sort_order=3)
        db.session.add(mt2)
        with pytest.raises(IntegrityError):
            db.session.commit()
        db.session.rollback()

def test_donation_record_creation_to_dict_and_uniqueness(app):
    with app.app_context():
        now = datetime.datetime.now(datetime.timezone.utc)
        dr1 = DonationRecord(period="2026-Q1", status="completed", donated_at=now, note="Donated 500 EGP")
        db.session.add(dr1)
        db.session.commit()

        d = dr1.to_dict()
        assert d["period"] == "2026-Q1"
        assert d["status"] == "completed"
        assert d["donated_at"].startswith("2026-07-30T14:48:54") or d["donated_at"].startswith(now.isoformat()[:19])
        assert d["note"] == "Donated 500 EGP"

        # None donated_at datetime serialization check
        dr_none = DonationRecord(period="2026-Q2", status="pending")
        db.session.add(dr_none)
        db.session.commit()
        assert dr_none.to_dict()["donated_at"] is None

        # Unique period constraint
        dr_dup = DonationRecord(period="2026-Q1", status="pending")
        db.session.add(dr_dup)
        with pytest.raises(IntegrityError):
            db.session.commit()
        db.session.rollback()

def test_gift_card_creation_to_dict_and_uniqueness(app):
    with app.app_context():
        created = datetime.datetime(2026, 1, 1, 12, 0, 0)
        expires = datetime.datetime(2026, 12, 31, 23, 59, 59)
        redeemed = datetime.datetime(2026, 6, 1, 10, 30, 0)

        gc1 = GiftCard(
            code="GIFT-2026-VAL",
            value=250.0,
            is_redeemed=True,
            redeemed_at=redeemed,
            expires_at=expires,
            created_at=created
        )
        db.session.add(gc1)
        db.session.commit()

        d = gc1.to_dict()
        assert d["code"] == "GIFT-2026-VAL"
        assert d["value"] == 250.0
        assert d["is_redeemed"] is True
        assert d["created_at"] == created.isoformat()
        assert d["expires_at"] == expires.isoformat()
        assert d["redeemed_at"] == redeemed.isoformat()

        # Check None datetimes serialization
        gc_unredeemed = GiftCard(code="GIFT-UNREDEEMED", value=100.0)
        db.session.add(gc_unredeemed)
        db.session.commit()
        d_un = gc_unredeemed.to_dict()
        assert d_un["redeemed_at"] is None
        assert d_un["expires_at"] is None
        assert isinstance(d_un["created_at"], str)

        # Unique code constraint
        gc_dup = GiftCard(code="GIFT-2026-VAL", value=50.0)
        db.session.add(gc_dup)
        with pytest.raises(IntegrityError):
            db.session.commit()
        db.session.rollback()

def test_loyalty_points_entry_creation_and_to_dict(app):
    with app.app_context():
        u = User(email="lpe_user@example.com", full_name="LPE User")
        u.set_password("pass")
        db.session.add(u)
        db.session.commit()

        earned = datetime.datetime(2026, 2, 1, 10, 0, 0)
        expires = datetime.datetime(2027, 2, 1, 10, 0, 0)

        lpe = LoyaltyPointsEntry(
            user_id=u.id,
            amount=100,
            source="purchase",
            ref_id=42,
            earned_at=earned,
            expires_at=expires
        )
        db.session.add(lpe)
        db.session.commit()

        d = lpe.to_dict()
        assert d["user_id"] == u.id
        assert d["amount"] == 100
        assert d["source"] == "purchase"
        assert d["ref_id"] == 42
        assert d["earned_at"] == earned.isoformat()
        assert d["expires_at"] == expires.isoformat()

def test_loyalty_voucher_creation_and_to_dict(app):
    with app.app_context():
        u = User(email="lv_user@example.com", full_name="LV User")
        u.set_password("pass")
        db.session.add(u)
        db.session.commit()

        created = datetime.datetime(2026, 3, 1, 12, 0, 0)
        expires = datetime.datetime(2026, 4, 1, 12, 0, 0)

        lv = LoyaltyVoucher(
            user_id=u.id,
            value=50.0,
            source="points_conversion",
            created_at=created,
            expires_at=expires,
            redeemed=False,
            min_order_amount=500.0
        )
        db.session.add(lv)
        db.session.commit()

        d = lv.to_dict()
        assert d["user_id"] == u.id
        assert d["value"] == 50.0
        assert d["source"] == "points_conversion"
        assert d["created_at"] == created.isoformat()
        assert d["expires_at"] == expires.isoformat()
        assert d["redeemed"] is False
        assert d["min_order_amount"] == 500.0

def test_referral_conversion_creation_and_to_dict(app):
    with app.app_context():
        u1 = User(email="rc_referrer@example.com", full_name="Referrer")
        u1.set_password("pass")
        u2 = User(email="rc_referee@example.com", full_name="Referee")
        u2.set_password("pass")
        db.session.add_all([u1, u2])
        db.session.commit()

        order = Order(customer_name="Referee Order", total_amount=1200.0, user_id=u2.id)
        db.session.add(order)
        db.session.commit()

        created = datetime.datetime(2026, 5, 1, 9, 0, 0)
        rc = ReferralConversion(
            referrer_id=u1.id,
            referee_id=u2.id,
            qualifying_order_id=order.id,
            reward_issued=True,
            created_at=created
        )
        db.session.add(rc)
        db.session.commit()

        d = rc.to_dict()
        assert d["referrer_id"] == u1.id
        assert d["referee_id"] == u2.id
        assert d["qualifying_order_id"] == order.id
        assert d["reward_issued"] is True
        assert d["created_at"] == created.isoformat()
