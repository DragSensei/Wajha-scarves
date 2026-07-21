from api.core.db import db
from api.core.models import CartItem, Product, Order
from sqlalchemy.orm import joinedload, selectinload

def get_cart_items(user_id):
    """
    Returns all cart items for a given user.
    """
    # ponytail: Point 12 — selectinload avoids row fan-out for 1-to-many images relationship
    return CartItem.query.filter_by(user_id=user_id).options(
        joinedload(CartItem.product).joinedload(Product.category_ref),
        joinedload(CartItem.product).selectinload(Product.images)
    ).all()

def add_item_to_cart(user_id, product_id, quantity=1):
    """
    Adds a product to the user's cart, or increments quantity if already exists.
    """
    product = Product.query.options(
        joinedload(Product.category_ref),
        selectinload(Product.images)
    ).filter(Product.id == product_id).first()
    
    if not product:
        raise ValueError("Product not found")

    cart_item = CartItem.query.options(
        joinedload(CartItem.product).joinedload(Product.category_ref),
        joinedload(CartItem.product).selectinload(Product.images)
    ).filter_by(user_id=user_id, product_id=product_id).first()

    if cart_item:
        cart_item.quantity += quantity
    else:
        cart_item = CartItem(user_id=user_id, product_id=product_id, quantity=quantity)
        db.session.add(cart_item)
        cart_item.product = product

    db.session.commit()
    return cart_item

def update_cart_item_quantity(user_id, product_id, quantity):
    """
    Updates the quantity of a product in the user's cart.
    If quantity <= 0, the item is removed.
    """
    cart_item = CartItem.query.options(
        joinedload(CartItem.product).joinedload(Product.category_ref),
        joinedload(CartItem.product).selectinload(Product.images)
    ).filter_by(user_id=user_id, product_id=product_id).first()

    if not cart_item:
        raise ValueError("Cart item not found")

    if quantity <= 0:
        db.session.delete(cart_item)
        cart_item = None
    else:
        cart_item.quantity = quantity

    db.session.commit()
    return cart_item

def remove_item_from_cart(user_id, product_id):
    """
    Removes a product from the user's cart.
    """
    cart_item = CartItem.query.filter_by(user_id=user_id, product_id=product_id).first()
    if cart_item:
        db.session.delete(cart_item)
        db.session.commit()
        return True
    return False

def clear_user_cart(user_id):
    """
    Clears all cart items for a user.
    """
    CartItem.query.filter_by(user_id=user_id).delete()
    db.session.commit()

def sync_local_cart_to_db(user_id, local_items):
    """
    Merges local storage cart items into the database cart upon login.
    local_items format: [{'product_id': int, 'quantity': int}]
    """
    if not isinstance(local_items, list):
        return get_cart_items(user_id)

    for item in local_items:
        product_id = item.get('product_id')
        quantity = item.get('quantity', 1)
        if product_id is None:
            continue
        try:
            # Check if this item is already in user's cart
            cart_item = CartItem.query.filter_by(user_id=user_id, product_id=int(product_id)).first()
            if cart_item:
                # Merge quantities
                cart_item.quantity += int(quantity)
            else:
                cart_item = CartItem(user_id=user_id, product_id=int(product_id), quantity=int(quantity))
                db.session.add(cart_item)
        except ValueError:
            # Skip invalid products
            continue

    db.session.commit()
    return get_cart_items(user_id)

# ----------------- Order History Services -----------------

def get_orders_by_user_or_email(user_id=None, email=None):
    """
    Returns all orders placed by user_id or matching customer email.
    """
    if not user_id and not email:
        return []
    from sqlalchemy import or_
    filters = []
    if user_id:
        filters.append(Order.user_id == user_id)
    if email:
        filters.append(Order.customer_email.ilike(email))
    return Order.query.filter(or_(*filters)).order_by(Order.created_at.desc()).all()

def get_orders_by_email(email):
    return get_orders_by_user_or_email(email=email)
