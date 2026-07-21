import json
import logging
from datetime import datetime, timezone
from flask import jsonify, request, current_app, url_for, send_from_directory
from api.features.admin import (
    admin_users_bp,
    admin_settings_bp,
    admin_images_bp,
    admin_orders_bp
)
from api.core.decorators import admin_required, require_auth
from api.core.extensions import limiter, csrf
from api.core.db import db
from api.core.models import User, Order, Setting, ProductImage, Product
from api.core.utils import paginate_query
from api.features.admin.services import (
    create_or_reactivate_user,
    update_user,
    soft_delete_user,
    serialize_user,
    DuplicateEmailError
)
from api.features.products.services import process_and_save_image

logger = logging.getLogger(__name__)

# Helpers for image serialization
def get_image_url(filename):
    if not filename:
        return None
    if filename.startswith('http'):
        return filename
    return f"/api/uploads/{filename}"

def serialize_image(img):
    return {
        'id': img.id,
        'url': get_image_url(img.filename),
        'is_primary': img.is_primary,
        'sort_order': img.sort_order,
        'product_id': img.product_id
    }

def serialize_order(order):
    customer_name = order.customer_name
    items_summary = "Unknown Items"
    if " — Ordered: " in order.customer_name:
        parts = order.customer_name.split(" — Ordered: ", 1)
        customer_name = parts[0]
        items_summary = parts[1]
    
    items = [item.to_dict() for item in (order.items or [])]

    account_info = None
    user = None
    if order.user_id:
        # ponytail: Point 15 — use eager loaded user relationship directly to avoid db.session.get round trip
        user = order.user
    elif order.customer_email:
        user = User.query.filter_by(email=order.customer_email).first()

    if user:
        account_info = user.to_dict()

    return {
        'id': order.id,
        'user_id': order.user_id,
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
        'items': items,
        'account': account_info
    }

# ----------------- USERS ADMIN ROUTES -----------------

@admin_users_bp.route('', methods=['GET'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def get_users():
    role = request.args.get('role')
    query = User.query.filter_by(is_active=True)
    if role:
        query = query.filter_by(role=role)
        
    query = query.order_by(User.id.asc())
    pagination = paginate_query(query, request, default_per_page=12, max_per_page=50)
    serialized_users = [serialize_user(u) for u in pagination.items]

    return jsonify({
        'users': serialized_users,
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total_items': pagination.total,
            'total_pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    })

@admin_users_bp.route('', methods=['POST'])
@admin_required
@limiter.limit("5 per minute")
def create_user():
    if not request.is_json:
        return jsonify({"error": "Request body must be a JSON object"}), 400

    data = request.get_json()
    try:
        user, gen_password, is_reactivated = create_or_reactivate_user(data)
        response_data = {"user": serialize_user(user)}
        if gen_password:
            response_data["password"] = gen_password
            
        status_code = 200 if is_reactivated else 201
        return jsonify(response_data), status_code
    except DuplicateEmailError as e:
        return jsonify({"error": str(e)}), 409
    except ValueError as e:
        details = e.args[0] if e.args and isinstance(e.args[0], dict) else {"error": str(e)}
        return jsonify({"error": "Validation failed", "details": details}), 400

@admin_users_bp.route('/<int:user_id>', methods=['PUT'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def update_user_route(user_id):
    if not request.is_json:
        return jsonify({"error": "Request body must be a JSON object"}), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    try:
        updated_user = update_user(user, data)
        return jsonify({"user": serialize_user(updated_user)}), 200
    except DuplicateEmailError as e:
        return jsonify({"error": str(e)}), 409
    except ValueError as e:
        details = e.args[0] if e.args and isinstance(e.args[0], dict) else {"error": str(e)}
        return jsonify({"error": "Validation failed", "details": details}), 400

@admin_users_bp.route('/<int:user_id>', methods=['DELETE'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def delete_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    soft_delete_user(user)
    return jsonify({"message": "User soft-deleted successfully", "user": serialize_user(user)}), 200


# ----------------- ORDERS ADMIN ROUTES -----------------

@admin_orders_bp.route('', methods=['GET'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def get_orders():
    from sqlalchemy.orm import joinedload, selectinload
    # ponytail: Point 15 — eager load user and items (selectinload is safer for 1-to-many items to avoid row fan-out)
    # ponytail: Point 16 — Offset pagination works for now. TODO: implement keyset/cursor pagination at scale.
    query = Order.query.options(
        joinedload(Order.user),
        selectinload(Order.items)
    ).order_by(Order.created_at.desc())
    
    pagination = paginate_query(query, request)
    serialized_orders = [serialize_order(o) for o in pagination.items]
    return jsonify({
        'orders': serialized_orders,
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total_items': pagination.total,
            'total_pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    })

@admin_orders_bp.route('/<int:order_id>/complete', methods=['POST'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def complete_order(order_id):
    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    try:
        order.status = 'completed'
        db.session.commit()
        return jsonify(serialize_order(order))
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ----------------- SETTINGS ADMIN ROUTES -----------------

@admin_settings_bp.route('', methods=['GET'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def get_settings():
    settings = Setting.query.all()
    return jsonify({s.key: s.value for s in settings})

@admin_settings_bp.route('', methods=['PUT'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def update_settings():
    if not request.is_json:
        return jsonify({"error": "Request body must be a JSON object"}), 400
    
    data = request.get_json()
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object"}), 400
        
    whitelist = current_app.config.get('ALLOWED_SETTINGS', set())
    
    for key, value in data.items():
        if key not in whitelist:
            return jsonify({"error": f"Invalid setting key: {key}"}), 400
        if not isinstance(value, str):
            return jsonify({"error": "Setting values must be strings"}), 400
            
    try:
        for key, value in data.items():
            Setting.set_setting(key, value)
        
        settings = Setting.query.all()
        return jsonify({s.key: s.value for s in settings})
    except Exception as e:
        return jsonify({"error": str(e)}), 500





# ----------------- IMAGES ADMIN UPLOAD ROUTE -----------------

@admin_images_bp.route('/upload', methods=['POST'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def upload_image():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
        
    file = request.files['file']
    if not file or not file.filename:
        return jsonify({"error": "No file selected for uploading"}), 400
        
    product_id = request.form.get('product_id')
    product = None
    if product_id:
        try:
            product_id = int(product_id)
        except ValueError:
            return jsonify({"error": "product_id must be an integer"}), 400
            
        product = db.session.get(Product, product_id)
        if not product:
            return jsonify({"error": "Product not found"}), 404
            
    try:
        upload_dir = current_app.config['UPLOAD_FOLDER']
        final_filename = process_and_save_image(file, upload_dir)
        
        sort_order = 0
        if product:
            sort_order = len(product.images)
            
        new_img = ProductImage(
            product_id=product.id if product else None,
            filename=final_filename,
            is_primary=False,
            sort_order=sort_order
        )
        
        db.session.add(new_img)
        db.session.commit()
        return jsonify(serialize_image(new_img)), 201
    except ValueError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
