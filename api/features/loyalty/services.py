from datetime import datetime, timezone, timedelta
from sqlalchemy import func
from api.core.db import db
from api.core.models import (
    User, Order, Setting, LoyaltyPointsEntry, LoyaltyVoucher,
    ReferralConversion, MembershipTier
)

def get_user_loyalty_status(user_id):
    user = db.session.get(User, user_id)
    if not user:
        raise ValueError("User not found")

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # Calculate active points balance
    entries = LoyaltyPointsEntry.query.filter_by(user_id=user_id).all()
    points_balance = 0
    for e in entries:
        if e.expires_at:
            exp = e.expires_at
            if exp.tzinfo:
                exp = exp.replace(tzinfo=None)
            if now > exp:
                continue
        points_balance += e.amount

    points_balance = max(0, points_balance)

    # Active vouchers
    vouchers = LoyaltyVoucher.query.filter_by(user_id=user_id, redeemed=False).all()
    active_vouchers = []
    for v in vouchers:
        exp = v.expires_at
        if exp and exp.tzinfo:
            exp = exp.replace(tzinfo=None)
        if exp and now > exp:
            continue
        active_vouchers.append(v.to_dict())

    # Current membership tier by lifetime spend
    completed_spend = db.session.query(func.coalesce(func.sum(Order.total_amount), 0.0)).filter(
        Order.user_id == user_id,
        Order.status == 'completed'
    ).scalar() or 0.0

    tiers = MembershipTier.query.order_by(MembershipTier.spend_threshold.desc()).all()
    current_tier = "Bronze"
    for t in tiers:
        if completed_spend >= t.spend_threshold:
            current_tier = t.name
            break

    # Referral info
    referral_code = user.referral_code

    return {
        'points_balance': points_balance,
        'lifetime_spend': float(completed_spend),
        'membership_tier': current_tier,
        'active_vouchers': active_vouchers,
        'referral_code': referral_code,
        'birth_date': user.birth_date.isoformat() if user.birth_date else None
    }


def get_user_points_history(user_id):
    entries = LoyaltyPointsEntry.query.filter_by(user_id=user_id).order_by(
        LoyaltyPointsEntry.earned_at.desc()
    ).all()
    return [e.to_dict() for e in entries]


def convert_points_to_voucher(user_id):
    status = get_user_loyalty_status(user_id)
    points_balance = status['points_balance']

    user_tier = get_user_tier(user_id)
    tier_features = (user_tier.features if user_tier and isinstance(user_tier.features, dict) else {})
    
    # Tier specifies conversion rate (e.g., 'egp_per_point': 0.01 or 'points_to_egp_rate': 100)
    if 'egp_per_point' in tier_features:
        egp_per_point = _parse_feature_number(tier_features.get('egp_per_point'), default=0.01)
        points_to_egp_rate = (1.0 / egp_per_point) if egp_per_point > 0 else 100.0
    elif 'points_to_egp_rate' in tier_features:
        points_to_egp_rate = _parse_feature_number(tier_features.get('points_to_egp_rate'), default=100.0)
    else:
        points_to_egp_rate = 100.0

    try:
        voucher_expiry_months = int(Setting.get_setting('voucher_expiry_months', '1'))
    except (ValueError, TypeError):
        voucher_expiry_months = 1

    if points_balance < points_to_egp_rate:
        raise ValueError(f"Minimum {int(points_to_egp_rate)} points required to convert to a voucher.")

    # Convert all available points (or step by rate)
    voucher_value = points_balance / points_to_egp_rate
    points_used = points_balance

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    expires_at = now + timedelta(days=voucher_expiry_months * 30)

    # Create voucher
    voucher = LoyaltyVoucher(
        user_id=user_id,
        value=round(voucher_value, 2),
        source='points_conversion',
        expires_at=expires_at,
        redeemed=False,
        min_order_amount=0.0
    )
    db.session.add(voucher)

    # Deduct points entry
    deduction = LoyaltyPointsEntry(
        user_id=user_id,
        amount=-points_used,
        source='voucher_conversion',
        earned_at=now
    )
    db.session.add(deduction)

    try:
        db.session.commit()
        return {
            'voucher': voucher.to_dict(),
            'points_deducted': points_used,
            'new_balance': 0
        }
    except Exception:
        db.session.rollback()
        raise


def reconcile_order_loyalty():
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    try:
        points_per_egp = float(Setting.get_setting('points_per_egp', '1'))
    except (ValueError, TypeError):
        points_per_egp = 1.0

    try:
        points_expiry_months = int(Setting.get_setting('points_expiry_months', '6'))
    except (ValueError, TypeError):
        points_expiry_months = 6

    try:
        ref_min_spend = float(Setting.get_setting('referral_min_order_amount', '0'))
    except (ValueError, TypeError):
        ref_min_spend = 0.0

    try:
        ref_voucher_amt = float(Setting.get_setting('referral_voucher_amount', '200'))
    except (ValueError, TypeError):
        ref_voucher_amt = 200.0

    try:
        voucher_expiry_months = int(Setting.get_setting('voucher_expiry_months', '1'))
    except (ValueError, TypeError):
        voucher_expiry_months = 1

    try:
        referral_bonus_points = int(Setting.get_setting('referral_bonus_points', '500'))
    except (ValueError, TypeError):
        referral_bonus_points = 500

    active_orders = Order.query.filter(Order.status.in_(['completed', 'pending'])).all()
    credited_count = 0
    referral_rewards_count = 0

    for order in active_orders:
        if not order.user_id:
            continue

        # Check if points already credited for this order
        existing = LoyaltyPointsEntry.query.filter_by(
            user_id=order.user_id,
            source='order_earned',
            ref_id=order.id
        ).first()

        if not existing:
            user_tier = get_user_tier(order.user_id)
            tier_features = (user_tier.features if user_tier and isinstance(user_tier.features, dict) else {})
            earn_rate_str = tier_features.get('earn_rate')
            user_rate = _parse_feature_number(earn_rate_str, default=points_per_egp) if earn_rate_str else points_per_egp
            earned_points = int((order.total_amount or 0) * (user_rate if user_rate > 0 else points_per_egp))

            if earned_points > 0:
                expires_at = now + timedelta(days=points_expiry_months * 30)
                entry = LoyaltyPointsEntry(
                    user_id=order.user_id,
                    amount=earned_points,
                    source='order_earned',
                    ref_id=order.id,
                    earned_at=now,
                    expires_at=expires_at
                )
                db.session.add(entry)
                credited_count += 1

        # Check for referral reward trigger
        user = db.session.get(User, order.user_id)
        if user and user.referred_by_id:
            # Check if this is their qualifying order
            if (order.total_amount or 0) >= ref_min_spend:
                existing_conversion = ReferralConversion.query.filter_by(
                    referee_id=user.id
                ).first()
                if not existing_conversion:
                    try:
                        ref_v_min_spend = float(Setting.get_setting('referral_voucher_min_spend', '0'))
                    except (ValueError, TypeError):
                        ref_v_min_spend = 0.0

                    # Issue voucher to referrer
                    referrer_voucher = LoyaltyVoucher(
                        user_id=user.referred_by_id,
                        value=ref_voucher_amt,
                        source='referral_reward',
                        expires_at=now + timedelta(days=voucher_expiry_months * 30),
                        redeemed=False,
                        min_order_amount=ref_v_min_spend
                    )
                    db.session.add(referrer_voucher)

                    # Award bonus loyalty points to referrer
                    if referral_bonus_points > 0:
                        ref_points_entry = LoyaltyPointsEntry(
                            user_id=user.referred_by_id,
                            amount=referral_bonus_points,
                            source='referral_bonus',
                            ref_id=order.id,
                            earned_at=now,
                            expires_at=now + timedelta(days=points_expiry_months * 30)
                        )
                        db.session.add(ref_points_entry)

                    conversion = ReferralConversion(
                        referrer_id=user.referred_by_id,
                        referee_id=user.id,
                        qualifying_order_id=order.id,
                        reward_issued=True,
                        created_at=now
                    )
                    db.session.add(conversion)
                    referral_rewards_count += 1

    try:
        db.session.commit()
        return {
            'orders_processed': len(active_orders),
            'points_entries_created': credited_count,
            'referral_rewards_issued': referral_rewards_count
        }
    except Exception:
        db.session.rollback()
        raise


def _parse_feature_number(val_str, default=0.0):
    if val_str is None:
        return default
    if isinstance(val_str, (int, float)):
        return float(val_str)
    if not isinstance(val_str, str):
        return default
    cleaned = val_str.replace(',', '').strip()
    import re
    match = re.search(r'(\d+(?:\.\d+)?)', cleaned)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            return default
    return default


def get_user_tier(user_id):
    completed_spend = db.session.query(func.coalesce(func.sum(Order.total_amount), 0.0)).filter(
        Order.user_id == user_id,
        Order.status == 'completed'
    ).scalar() or 0.0

    tiers = MembershipTier.query.order_by(MembershipTier.spend_threshold.desc()).all()
    for t in tiers:
        if completed_spend >= t.spend_threshold:
            return t
    return None


def award_welcome_points(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return
    tier = get_user_tier(user_id)
    features = (tier.features if tier and isinstance(tier.features, dict) else {})
    val = features.get('welcome_points')
    pts = int(_parse_feature_number(val, default=0))
    if pts > 0:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        existing = LoyaltyPointsEntry.query.filter_by(
            user_id=user_id,
            source='welcome_bonus'
        ).first()
        if not existing:
            try:
                exp_months = int(Setting.get_setting('points_expiry_months', '6'))
            except (ValueError, TypeError):
                exp_months = 6
            entry = LoyaltyPointsEntry(
                user_id=user_id,
                amount=pts,
                source='welcome_bonus',
                earned_at=now,
                expires_at=now + timedelta(days=exp_months * 30)
            )
            db.session.add(entry)
            db.session.commit()


def award_review_points(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return
    tier = get_user_tier(user_id)
    features = (tier.features if tier and isinstance(tier.features, dict) else {})
    val = features.get('product_review')
    pts = int(_parse_feature_number(val, default=100))
    if pts > 0:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        try:
            exp_months = int(Setting.get_setting('points_expiry_months', '6'))
        except (ValueError, TypeError):
            exp_months = 6
        entry = LoyaltyPointsEntry(
            user_id=user_id,
            amount=pts,
            source='product_review_bonus',
            earned_at=now,
            expires_at=now + timedelta(days=exp_months * 30)
        )
        db.session.add(entry)
        db.session.commit()


def issue_birthday_rewards():
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    current_year = now.year
    today_month = now.month
    today_day = now.day

    try:
        voucher_expiry_months = int(Setting.get_setting('voucher_expiry_months', '1'))
    except (ValueError, TypeError):
        voucher_expiry_months = 1

    all_users = User.query.filter(User.birth_date.isnot(None)).all()
    birthday_users = [
        u for u in all_users
        if u.birth_date and u.birth_date.month == today_month and u.birth_date.day == today_day
    ]

    rewarded_count = 0
    for user in birthday_users:
        start_of_year = datetime(current_year, 1, 1)
        existing = LoyaltyVoucher.query.filter(
            LoyaltyVoucher.user_id == user.id,
            LoyaltyVoucher.source == 'birthday_bonus',
            LoyaltyVoucher.created_at >= start_of_year
        ).first()

        if not existing:
            tier = get_user_tier(user.id)
            features = (tier.features if tier and isinstance(tier.features, dict) else {})
            bday_val = features.get('birthday_reward')
            bday_amount = _parse_feature_number(bday_val, default=100.0)

            if bday_amount > 0:
                # Issue as points or voucher depending on threshold
                bday_voucher = LoyaltyVoucher(
                    user_id=user.id,
                    value=bday_amount if bday_amount <= 1000 else 100.0,
                    source='birthday_bonus',
                    expires_at=now + timedelta(days=voucher_expiry_months * 30),
                    redeemed=False,
                    min_order_amount=0.0
                )
                db.session.add(bday_voucher)

                # If large pts specified in tier (e.g. 8000 pts), also issue points entry
                if bday_amount > 100:
                    try:
                        exp_m = int(Setting.get_setting('points_expiry_months', '6'))
                    except (ValueError, TypeError):
                        exp_m = 6
                    entry = LoyaltyPointsEntry(
                        user_id=user.id,
                        amount=int(bday_amount),
                        source='birthday_bonus',
                        earned_at=now,
                        expires_at=now + timedelta(days=exp_m * 30)
                    )
                    db.session.add(entry)

                rewarded_count += 1

    try:
        db.session.commit()
        return {
            'birthday_users_found': len(birthday_users),
            'vouchers_issued': rewarded_count
        }
    except Exception:
        db.session.rollback()
        raise
