import logging
import secrets
from datetime import datetime, timezone
from flask import current_app
from api.core.db import db
from api.core.models import Product, Category, Order, OrderItem, User, MembershipTier
from api.features.admin.schemas import (
    validate_create_user,
    validate_update_user,
    validate_tier_data
)

logger = logging.getLogger(__name__)

# ----------------- User Services -----------------

class DuplicateEmailError(ValueError):
    """Exception raised when an active user email already exists."""
    pass

def create_or_reactivate_user(data):
    is_valid, errors = validate_create_user(data)
    if not is_valid:
        raise ValueError(errors)

    email = data['email']
    full_name = data['full_name']
    phone = data.get('phone')
    role = data.get('role', 'user')
    raw_password = data.get('password')

    generated_password = None
    if not raw_password:
        generated_password = secrets.token_urlsafe(16)
        raw_password = generated_password

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        if existing_user.is_active:
            raise DuplicateEmailError("A user with this email already exists.")
        
        existing_user.full_name = full_name
        existing_user.phone = phone
        existing_user.role = role
        existing_user.set_password(raw_password)
        existing_user.is_active = True
        existing_user.token_version += 1
        
        try:
            db.session.commit()
            return existing_user, generated_password, True
        except Exception:
            db.session.rollback()
            raise
    else:
        ref_code = secrets.token_urlsafe(9)
        while User.query.filter_by(referral_code=ref_code).first():
            ref_code = secrets.token_urlsafe(9)
        new_user = User(
            email=email,
            full_name=full_name,
            phone=phone,
            role=role,
            is_active=True,
            referral_code=ref_code
        )
        new_user.set_password(raw_password)
        db.session.add(new_user)
        
        try:
            db.session.commit()
            return new_user, generated_password, False
        except Exception:
            db.session.rollback()
            raise


def update_user(user, data):
    is_valid, errors = validate_update_user(data)
    if not is_valid:
        raise ValueError(errors)

    new_email = data.get('email')
    if new_email and new_email != user.email:
        conflict_user = User.query.filter_by(email=new_email).first()
        if conflict_user:
            raise DuplicateEmailError("A user with this email already exists.")

    email_changed = (new_email is not None and new_email != user.email)
    role_changed = ('role' in data and data['role'] != user.role)
    password_changed = ('password' in data and bool(data['password']))

    if email_changed:
        user.email = new_email
    if role_changed:
        user.role = data['role']
    if password_changed:
        user.set_password(data['password'])
        
    if 'full_name' in data:
        user.full_name = data['full_name']
    if 'phone' in data:
        user.phone = data['phone']
    if 'is_active' in data:
        user.is_active = bool(data['is_active'])

    if email_changed or role_changed or password_changed:
        user.token_version += 1

    # Auto-unlock account on admin update/reset
    user.failed_login_attempts = 0
    user.lockout_until = None

    try:
        db.session.commit()
        return user
    except Exception:
        db.session.rollback()
        raise


def soft_delete_user(user):
    user.is_active = False
    user.token_version += 1
    try:
        db.session.commit()
        return user
    except Exception:
        db.session.rollback()
        raise


def serialize_user(user):
    return user.to_dict()


# ----------------- Membership Tier Services -----------------

class DuplicateTierError(ValueError):
    """Exception raised when a tier with the same name already exists."""
    pass

class ProtectedTierError(ValueError):
    """Exception raised when attempting to delete a protected tier."""
    pass

def get_all_tiers():
    return MembershipTier.query.order_by(
        MembershipTier.sort_order.asc(),
        MembershipTier.spend_threshold.asc()
    ).all()

def create_tier(data):
    is_valid, errors = validate_tier_data(data, is_update=False)
    if not is_valid:
        raise ValueError(errors)

    name = data['name'].strip()
    spend_threshold = float(data['spend_threshold'])
    sort_order = data.get('sort_order', 0)

    if MembershipTier.query.filter_by(name=name).first():
        raise DuplicateTierError(f"A tier named '{name}' already exists.")

    features = data.get('features') if isinstance(data.get('features'), dict) else None
    new_tier = MembershipTier(name=name, spend_threshold=spend_threshold, sort_order=sort_order, features=features)
    db.session.add(new_tier)
    try:
        db.session.commit()
        return new_tier
    except Exception:
        db.session.rollback()
        raise

def update_tier(tier, data):
    is_valid, errors = validate_tier_data(data, is_update=True)
    if not is_valid:
        raise ValueError(errors)

    if 'name' in data:
        new_name = data['name'].strip()
        if new_name != tier.name:
            conflict = MembershipTier.query.filter(
                MembershipTier.name == new_name,
                MembershipTier.id != tier.id
            ).first()
            if conflict:
                raise DuplicateTierError(f"A tier named '{new_name}' already exists.")
            tier.name = new_name

    if 'spend_threshold' in data:
        tier.spend_threshold = float(data['spend_threshold'])
    if 'sort_order' in data:
        tier.sort_order = int(data['sort_order'])
    if 'features' in data and isinstance(data['features'], dict):
        tier.features = data['features']

    try:
        db.session.commit()
        return tier
    except Exception:
        db.session.rollback()
        raise

def delete_tier(tier):
    try:
        db.session.delete(tier)
        db.session.commit()
        return True
    except Exception:
        db.session.rollback()
        raise

def get_user_rankings():
    from sqlalchemy import func
    spends = db.session.query(
        Order.user_id,
        func.coalesce(func.sum(Order.total_amount), 0.0).label('total_spend')
    ).filter(
        Order.status == 'completed',
        Order.user_id.isnot(None)
    ).group_by(Order.user_id).all()

    spend_map = {s.user_id: float(s.total_spend) for s in spends}
    users = User.query.filter_by(is_active=True).all()
    tiers = MembershipTier.query.order_by(MembershipTier.spend_threshold.desc()).all()

    user_rankings = []
    for user in users:
        lifetime_spend = spend_map.get(user.id, 0.0)
        assigned_tier = next((t.to_dict() for t in tiers if lifetime_spend >= t.spend_threshold), None)
        user_rankings.append({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "lifetime_spend": lifetime_spend,
            "tier": assigned_tier
        })

    user_rankings.sort(key=lambda u: u['lifetime_spend'], reverse=True)
    return user_rankings


# ----------------- Donation Services -----------------

def get_donation_summary(period=None):
    from sqlalchemy import func
    from api.core.models import Setting, DonationRecord

    if not period:
        now = datetime.now(timezone.utc)
        quarter = (now.month - 1) // 3 + 1
        period = f"{now.year}-Q{quarter}"

    # Calculate total revenue of all completed orders
    total_completed_revenue = db.session.query(
        func.coalesce(func.sum(Order.total_amount), 0.0)
    ).filter(Order.status == 'completed').scalar()

    try:
        percentage = float(Setting.get_setting('donation_percentage', '5'))
    except (ValueError, TypeError):
        percentage = 5.0

    accrued_amount = round(float(total_completed_revenue) * (percentage / 100.0), 2)
    record = DonationRecord.query.filter_by(period=period).first()

    return {
        'period': period,
        'donation_percentage': percentage,
        'total_completed_revenue': float(total_completed_revenue),
        'accrued_amount': accrued_amount,
        'status': record.status if record else 'pending',
        'note': record.note if record else '',
        'donated_at': record.donated_at.isoformat() if record and record.donated_at else None
    }

def get_donation_history():
    from api.core.models import DonationRecord
    records = DonationRecord.query.order_by(DonationRecord.period.desc()).all()
    return [{
        'id': r.id,
        'period': r.period,
        'status': r.status,
        'donated_at': r.donated_at.isoformat() if r.donated_at else None,
        'note': r.note
    } for r in records]

def toggle_donation_status(period, status, note=''):
    from api.core.models import DonationRecord
    record = DonationRecord.query.filter_by(period=period).first()
    if not record:
        record = DonationRecord(period=period)
        db.session.add(record)

    record.status = status
    record.note = note or ''
    if status == 'donated':
        record.donated_at = datetime.now(timezone.utc)
    else:
        record.donated_at = None

    try:
        db.session.commit()
        return {
            'id': record.id,
            'period': record.period,
            'status': record.status,
            'donated_at': record.donated_at.isoformat() if record.donated_at else None,
            'note': record.note
        }
    except Exception:
        db.session.rollback()
        raise


# ----------------- Gift Card Admin Services -----------------

def generate_gift_card(value, expiry_months=None):
    from datetime import timedelta
    from api.core.models import GiftCard, Setting

    if value <= 0:
        raise ValueError("Gift card value must be greater than zero")

    if expiry_months is None:
        try:
            expiry_months = int(Setting.get_setting('gift_card_default_expiry_months', '12'))
        except (ValueError, TypeError):
            expiry_months = 12

    code = secrets.token_hex(8).upper()
    while GiftCard.query.filter_by(code=code).first():
        code = secrets.token_hex(8).upper()

    expires_at = datetime.now(timezone.utc) + timedelta(days=expiry_months * 30)
    card = GiftCard(
        code=code,
        value=float(value),
        expires_at=expires_at,
        is_redeemed=False
    )
    db.session.add(card)
    try:
        db.session.commit()
        return card.to_dict()
    except Exception:
        db.session.rollback()
        raise

def get_all_gift_cards():
    from api.core.models import GiftCard
    cards = GiftCard.query.order_by(GiftCard.created_at.desc()).all()
    return [c.to_dict() for c in cards]





