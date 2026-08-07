import re
from flask import url_for

# ponytail: shared EMAIL_REGEX to avoid duplication across auth, admin, and checkout schemas.
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


def paginate_query(query, request, default_per_page=12, max_per_page=50, total=None):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', default_per_page, type=int)
    
    if per_page > max_per_page:
        per_page = max_per_page
    if per_page < 1:
        per_page = 1
    if page < 1:
        page = 1

    # ponytail: Point 10 — if total is pre-computed, pass count=False to avoid expensive subquery wrapping count
    if total is not None:
        pagination = query.paginate(page=page, per_page=per_page, error_out=False, count=False)
        pagination.total = total
    else:
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return pagination


def generate_slug(name: str) -> str:
    """Generates a URL-friendly slug from a given string."""
    if not name:
        return ""
    return re.sub(r'[-\s]+', '-', re.sub(r'[^\w\s-]', '', name.lower())).strip('-')


def get_image_url(filename):
    if not filename:
        return None
    if filename.startswith('http'):
        return filename
    return f"/api/uploads/{filename}"


def calculate_discounted_price(product, user=None):
    """
    Calculates the discounted price of a product based on global sale settings
    and user birthday discounts (5% off on user's birthday).
    """
    from flask import request, has_request_context
    if user is None and has_request_context():
        user = getattr(request, 'current_user', None)
        if user is None:
            try:
                from api.core.decorators import get_token_from_request, decode_token
                token = get_token_from_request()
                if token:
                    payload = decode_token(token)
                    uid = payload.get('user_id') or payload.get('sub')
                    if uid:
                        from api.core.models import User
                        from api.core.db import db
                        user = db.session.get(User, int(uid))
                        request.current_user = user
            except Exception:
                pass

    bday_discount_price = None
    if user and getattr(user, 'birth_date', None):
        from datetime import datetime, timezone
        from api.core.models import Setting
        today = datetime.now(timezone.utc).date()
        if user.birth_date.month == today.month and user.birth_date.day == today.day:
            try:
                bday_pct = float(Setting.get_setting('birthday_reward_percent', '5'))
            except (ValueError, TypeError):
                bday_pct = 5.0
            if bday_pct > 0:
                bday_discount_price = product.price * (1.0 - (bday_pct / 100.0))

    # ponytail: use Setting.get_many to fetch all discount parameters in a single batch query/cache hit
    from api.core.models import Setting
    keys = ['discount_active', 'discount_percent', 'discount_categories', 'discount_product_ids']
    settings = Setting.get_many(keys)

    discount_active = settings.get('discount_active') == 'true'
    try:
        discount_percent = float(settings.get('discount_percent') or 0)
    except ValueError:
        discount_percent = 0

    std_discount_price = product.price
    if discount_active and discount_percent > 0 and discount_percent <= 100:
        cats_setting = settings.get('discount_categories') or ''
        discount_categories = [c.strip() for c in cats_setting.split(',') if c.strip()]

        ids_setting = settings.get('discount_product_ids') or ''
        discount_product_ids = [i.strip() for i in ids_setting.split(',') if i.strip()]

        prod_category = product.category_ref.slug if product.category_ref else product.category
        is_category_match = prod_category in discount_categories
        is_item_match = str(product.id) in discount_product_ids

        if not discount_categories and not discount_product_ids:
            std_discount_price = product.price * (1.0 - (discount_percent / 100.0))
        elif is_category_match or is_item_match:
            std_discount_price = product.price * (1.0 - (discount_percent / 100.0))

    prices = [product.price]
    if std_discount_price < product.price:
        prices.append(std_discount_price)
    if bday_discount_price is not None:
        prices.append(bday_discount_price)

    return min(prices)


def serialize_product(product):
    disc_price = calculate_discounted_price(product)
    discounted_price = disc_price if disc_price < product.price else None
    discount_active = discounted_price is not None
    discount_percent = round((1.0 - (disc_price / product.price)) * 100) if (discount_active and product.price > 0) else 0

    primary_image_url = None
    if product.images:
        sorted_imgs = sorted(product.images, key=lambda x: (not x.is_primary, x.sort_order))
        primary_image_url = get_image_url(sorted_imgs[0].filename)
    elif product.image_filename:
        primary_image_url = get_image_url(product.image_filename)

    serialized_images = [
        {
            'id': img.id,
            'url': get_image_url(img.filename),
            'is_primary': img.is_primary,
            'sort_order': img.sort_order
        }
        for img in sorted(product.images, key=lambda x: x.sort_order)
    ]

    res = {
        'id': product.id,
        'name': product.name,
        'description': product.description,
        # ponytail: details & care instructions fields
        'details': product.details,
        'care_instructions': product.care_instructions,
        'created_at': product.created_at.isoformat() if product.created_at else None,
        'original_price': product.price,
        'discounted_price': discounted_price,
        'discount_active': discount_active,
        'discount_percent': discount_percent,
        'primary_image_url': primary_image_url,
        'images': serialized_images,
        'stock': product.stock
    }

    if product.category_ref is not None:
        res['category'] = product.category_ref.name
        res['category_slug'] = product.category_ref.slug
        res['category_id'] = product.category_id
    else:
        res['category'] = product.category

    return res


def send_callmebot_whatsapp(message: str, phone_override: str = None, apikey_override: str = None, sync: bool = False):
    """
    # ponytail: CallMeBot WhatsApp notification helper.
    Dispatches free WhatsApp messages to the site owner via CallMeBot API.
    Handles Egyptian and international phone numbers cleanly.
    """
    import urllib.request
    import urllib.parse
    import threading
    import re

    # Fetch configuration on parent thread where Flask context is present
    from api.core.models import Setting
    enabled = Setting.get_setting('callmebot_enabled', 'false')
    phone = phone_override or Setting.get_setting('callmebot_phone') or Setting.get_setting('owner_whatsapp')
    apikey = apikey_override or Setting.get_setting('callmebot_apikey')

    if not phone_override and str(enabled).lower() not in ('true', '1', 'yes'):
        return False, "CallMeBot notifications are disabled."

    if not phone or not apikey:
        return False, "Missing phone number or CallMeBot API key."

    # Clean and format phone number
    raw = str(phone).strip()
    clean = re.sub(r'[^\d+]', '', raw)
    if clean.startswith('01') and len(clean) == 11:
        clean = '+20' + clean[1:]
    elif clean.startswith('20') and len(clean) == 12:
        clean = '+' + clean

    def _execute():
        try:
            encoded_text = urllib.parse.quote(message)
            url = f"https://api.callmebot.com/whatsapp.php?phone={urllib.parse.quote(clean)}&text={encoded_text}&apikey={urllib.parse.quote(str(apikey).strip())}"
            req = urllib.request.Request(url, headers={'User-Agent': 'DiyaScarves/1.0'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                body = resp.read().decode('utf-8', errors='ignore')
                return True, body
        except Exception as e:
            return False, str(e)

    if sync:
        return _execute()
    
    # ponytail: dispatch asynchronously so order flow is never delayed by external API
    thread = threading.Thread(target=_execute, daemon=True)
    thread.start()
    return True, "Dispatched"

