import secrets
from datetime import datetime, timedelta, timezone
from api.core.db import db
from api.core.models import GiftCard, Setting

def generate_voucher_code(value):
    prefix = f"DIY-{int(value)}"
    suffix = secrets.token_hex(3).upper()
    return f"{prefix}-{suffix}"

def purchase_voucher(data, buyer_user=None):
    value = float(data.get('value'))
    buyer_id = buyer_user.id if buyer_user and hasattr(buyer_user, 'id') else None
    buyer_email = (buyer_user.email if buyer_user and hasattr(buyer_user, 'email') else data.get('buyer_email')) or 'guest@diyascarves.com'
    recipient_name = data.get('recipient_name', '').strip() or None
    recipient_email = data.get('recipient_email', '').strip() or None
    gift_message = data.get('gift_message', '').strip() or None

    # Expiry setting (default 12 months)
    expiry_months = int(Setting.get_setting('gift_card_expiry_months', '12'))
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=expiry_months * 30)

    # Unique code generation
    code = generate_voucher_code(value)
    while GiftCard.query.filter_by(code=code).first() is not None:
        code = generate_voucher_code(value)

    card = GiftCard(
        code=code,
        value=value,
        is_redeemed=False,
        expires_at=expires_at,
        created_at=now,
        buyer_id=buyer_id,
        buyer_email=buyer_email,
        recipient_name=recipient_name,
        recipient_email=recipient_email,
        gift_message=gift_message
    )
    db.session.add(card)
    db.session.commit()

    # ponytail: Dispatch CallMeBot WhatsApp alert to site owner on voucher purchase with full details
    try:
        from api.core.utils import send_callmebot_whatsapp
        buyer_label = f"User #{buyer_id} ({buyer_email})" if buyer_id else buyer_email
        expiry_str = expires_at.strftime('%Y-%m-%d') if expires_at else 'N/A'
        voucher_msg = (
            f"🎁 *NEW GIFT CARD PURCHASED!*\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"🎟️ *Voucher Code:* `{card.code}`\n"
            f"💵 *Amount:* {card.value:.2f} EGP\n"
            f"👤 *Buyer:* {buyer_label}\n"
            f"👤 *Recipient Name:* {recipient_name or 'Self'}\n"
            f"✉️ *Recipient Email:* {recipient_email or 'N/A'}\n"
            f"⏳ *Expires:* {expiry_str}\n"
            f"💬 *Gift Message:* {gift_message if gift_message else 'None'}\n"
            f"━━━━━━━━━━━━━━━━━━━"
        )
        send_callmebot_whatsapp(voucher_msg)
    except Exception:
        pass

    return card

def get_user_vouchers(user_id=None, user_email=None):
    query = GiftCard.query
    filters = []
    if user_id:
        filters.append(GiftCard.buyer_id == user_id)
    if user_email:
        filters.append(GiftCard.buyer_email == user_email)
        filters.append(GiftCard.recipient_email == user_email)

    if not filters:
        return []

    cards = query.filter(db.or_(*filters)).order_by(GiftCard.created_at.desc()).all()
    return [c.to_dict() for c in cards]

def get_all_vouchers():
    cards = GiftCard.query.order_by(GiftCard.created_at.desc()).all()
    return [c.to_dict() for c in cards]

VALID_VOUCHER_STATUSES = ['pending', 'contacted', 'done']

def update_voucher_status(voucher_id, new_status):
    if new_status not in VALID_VOUCHER_STATUSES:
        raise ValueError(f"Invalid status. Must be one of: {', '.join(VALID_VOUCHER_STATUSES)}")
    card = db.session.get(GiftCard, voucher_id)
    if not card:
        raise ValueError("Voucher not found")
    card.status = new_status
    db.session.commit()
    return card
