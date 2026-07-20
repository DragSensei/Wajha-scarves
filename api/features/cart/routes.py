from flask import jsonify, request
from api.features.cart import cart_bp, cart_db_bp
from api.core.models import Order, OrderItem, CartItem, Product
from api.core.db import db
from api.core.extensions import limiter
from api.core.decorators import require_auth
from api.features.cart.schemas import validate_checkout
from api.core.utils import serialize_product
from api.features.cart.services import (
    get_cart_items,
    add_item_to_cart,
    update_cart_item_quantity,
    remove_item_from_cart,
    clear_user_cart,
    sync_local_cart_to_db,
    get_orders_by_email,
    get_orders_by_user_or_email
)

def serialize_cart_item(cart_item):
    """
    Serializes a database CartItem model, including full nested product details.
    """
    prod_dict = serialize_product(cart_item.product)
    return {
        'id': cart_item.id,
        'product_id': cart_item.product_id,
        'quantity': cart_item.quantity,
        'product': prod_dict
    }

# ----------------- Orders/Checkout (cart_bp) -----------------

@cart_bp.route('', methods=['POST'])
@limiter.limit("10 per hour; 3 per minute")
def api_create_order():
    data = request.json or {}
    is_valid, errors = validate_checkout(data)
    if not is_valid:
        return jsonify({'error': 'Validation failed', 'details': errors}), 400
        
    customer_name = data.get('name')
    customer_email = data.get('email')
    shipping_address = data.get('address')
    city = data.get('city')
    postal_code = data.get('postalCode')
    phone = data.get('phone')
    total_amount = float(data.get('total'))
    items_summary = data.get('items', 'Unknown Items')
    raw_items = data.get('order_items', [])

    try:
        user_id = None
        from api.core.decorators import get_token_from_request, decode_token, AuthError
        try:
            token = get_token_from_request()
            payload = decode_token(token)
            uid = payload.get('user_id') or payload.get('sub')
            if uid:
                user_id = int(uid)
                clear_user_cart(user_id)
        except AuthError:
            pass

        detailed_name = f"{customer_name} — Ordered: {items_summary[:100]}"
        new_order = Order(
            user_id=user_id,
            customer_name=detailed_name,
            customer_email=customer_email,
            shipping_address=shipping_address,
            city=city,
            postal_code=postal_code,
            phone=phone,
            total_amount=total_amount,
            status='pending'
        )
        db.session.add(new_order)
        db.session.flush()

        for item in raw_items:
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=item.get('product_id') or item.get('id'),
                product_name=item.get('name'),
                quantity=int(item.get('quantity', 1)),
                price_at_order=float(item.get('price', 0))
            )
            db.session.add(order_item)

        db.session.commit()
        return jsonify({'success': True, 'order_id': new_order.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@cart_bp.route('/my-orders', methods=['GET'])
@require_auth
@limiter.limit("50 per hour")
def get_my_orders():
    """
    Exposes customer order history to the logged-in user.
    """
    user = request.current_user
    email = user.email if hasattr(user, 'email') else user.get('email')
    user_id = getattr(user, 'id', None) or (user.get('id') if isinstance(user, dict) else None) or (user.get('user_id') if isinstance(user, dict) else None) or (user.get('sub') if isinstance(user, dict) else None)
    if user_id:
        try:
            user_id = int(user_id)
        except ValueError:
            user_id = None

    orders = get_orders_by_user_or_email(user_id=user_id, email=email)
    
    serialized_orders = []
    for order in orders:
        customer_name = order.customer_name
        items_summary = "Unknown Items"
        if " — Ordered: " in order.customer_name:
            parts = order.customer_name.split(" — Ordered: ", 1)
            customer_name = parts[0]
            items_summary = parts[1]
            
        items_list = [i.to_dict() for i in order.items] if order.items else []

        serialized_orders.append({
            'id': order.id,
            'customer_name': customer_name,
            'customer_email': order.customer_email,
            'shipping_address': order.shipping_address,
            'city': order.city,
            'postal_code': order.postal_code,
            'phone': order.phone,
            'total_amount': order.total_amount,
            'status': order.status,
            'order_date': order.created_at.isoformat() if order.created_at else None,
            'items_summary': items_summary,
            'items': items_list
        })
        
    return jsonify(serialized_orders), 200


# ----------------- Database-Backed Cart CRUD (cart_db_bp) -----------------

@cart_db_bp.route('', methods=['GET'])
@require_auth
@limiter.limit("100 per minute")
def api_get_cart():
    user_id = request.current_user.id if hasattr(request.current_user, 'id') else int(request.current_user.get('user_id') or request.current_user.get('sub'))
    items = get_cart_items(user_id)
    return jsonify([serialize_cart_item(item) for item in items]), 200


@cart_db_bp.route('', methods=['POST'])
@require_auth
@limiter.limit("100 per minute")
def api_add_to_cart():
    data = request.get_json() or {}
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)

    if not product_id:
        return jsonify({'error': 'product_id is required'}), 400

    user_id = request.current_user.id if hasattr(request.current_user, 'id') else int(request.current_user.get('user_id') or request.current_user.get('sub'))
    try:
        cart_item = add_item_to_cart(user_id, int(product_id), int(quantity))
        return jsonify(serialize_cart_item(cart_item)), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@cart_db_bp.route('/<int:product_id>', methods=['PUT'])
@require_auth
@limiter.limit("100 per minute")
def api_update_cart(product_id):
    data = request.get_json() or {}
    quantity = data.get('quantity')

    if quantity is None:
        return jsonify({'error': 'quantity is required'}), 400

    user_id = request.current_user.id if hasattr(request.current_user, 'id') else int(request.current_user.get('user_id') or request.current_user.get('sub'))
    try:
        cart_item = update_cart_item_quantity(user_id, product_id, int(quantity))
        if cart_item is None:
            return jsonify({'message': 'Item removed from cart'}), 200
        return jsonify(serialize_cart_item(cart_item)), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@cart_db_bp.route('/<int:product_id>', methods=['DELETE'])
@require_auth
@limiter.limit("100 per minute")
def api_delete_cart_item(product_id):
    user_id = request.current_user.id if hasattr(request.current_user, 'id') else int(request.current_user.get('user_id') or request.current_user.get('sub'))
    removed = remove_item_from_cart(user_id, product_id)
    if removed:
        return jsonify({'message': 'Item removed from cart'}), 200
    return jsonify({'error': 'Item not found in cart'}), 404


@cart_db_bp.route('/sync', methods=['POST'])
@require_auth
@limiter.limit("20 per minute")
def api_sync_cart():
    data = request.get_json() or {}
    local_items = data.get('items', [])
    
    user_id = request.current_user.id if hasattr(request.current_user, 'id') else int(request.current_user.get('user_id') or request.current_user.get('sub'))
    try:
        updated_items = sync_local_cart_to_db(user_id, local_items)
        return jsonify([serialize_cart_item(item) for item in updated_items]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
