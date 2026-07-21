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
    """
    Generates a slug from a given string.
    Lowercases the text, replaces spaces with hyphens, and removes non-alphanumeric/non-hyphen characters.
    """
    if not name:
        return ""
    name = name.lower()
    name = name.replace(' ', '-')
    name = re.sub(r'[^a-z0-9\-]', '', name)
    name = re.sub(r'-+', '-', name)
    name = name.strip('-')
    return name


def get_image_url(filename):
    if not filename:
        return None
    if filename.startswith('http'):
        return filename
    return f"/api/uploads/{filename}"


def calculate_discounted_price(product):
    """
    Calculates the discounted price of a product based on global sale settings.
    Ensures non-stacking of discounts, handles edge cases for invalid/negative percentages.
    """
    # ponytail: use Setting.get_many to fetch all discount parameters in a single batch query/cache hit
    from api.core.models import Setting
    keys = ['discount_active', 'discount_percent', 'discount_categories', 'discount_product_ids']
    settings = Setting.get_many(keys)

    discount_active = settings.get('discount_active') == 'true'
    try:
        discount_percent = float(settings.get('discount_percent') or 0)
    except ValueError:
        discount_percent = 0

    if discount_percent < 0 or discount_percent > 100:
        return product.price

    cats_setting = settings.get('discount_categories')
    discount_categories = [c.strip() for c in cats_setting.split(',')] if cats_setting else []

    ids_setting = settings.get('discount_product_ids')
    discount_product_ids = [i.strip() for i in ids_setting.split(',')] if ids_setting else []

    if not discount_active or discount_percent <= 0:
        return product.price

    prod_category = product.category_ref.slug if product.category_ref else product.category
    is_category_match = prod_category in discount_categories
    is_item_match = str(product.id) in discount_product_ids

    if is_category_match or is_item_match:
        return product.price * (1.0 - (discount_percent / 100.0))

    return product.price


def serialize_product(product):
    disc_price = calculate_discounted_price(product)
    discounted_price = disc_price if disc_price < product.price else None
    discount_active = discounted_price is not None

    primary_image_url = None
    if product.image_filename:
        primary_image_url = get_image_url(product.image_filename)
    elif product.images:
        sorted_imgs = sorted(product.images, key=lambda x: (not x.is_primary, x.sort_order))
        primary_image_url = get_image_url(sorted_imgs[0].filename)

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
        'created_at': product.created_at.isoformat() if product.created_at else None,
        'original_price': product.price,
        'discounted_price': discounted_price,
        'discount_active': discount_active,
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

