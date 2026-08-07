import json
import logging
from datetime import datetime, timezone
from flask import jsonify, request, current_app, url_for, send_from_directory
from api.features.admin import (
    admin_users_bp,
    admin_settings_bp,
    admin_images_bp,
    admin_orders_bp,
    admin_tiers_bp,
    admin_donations_bp,
    admin_giftcards_bp
)
from api.core.decorators import admin_required, require_auth
from api.core.extensions import limiter, csrf
from api.core.db import db
from api.core.models import User, Order, Setting, ProductImage, Product, MembershipTier
from api.core.utils import paginate_query
from api.features.admin.services import (
    create_or_reactivate_user,
    update_user,
    soft_delete_user,
    serialize_user,
    DuplicateEmailError,
    get_all_tiers,
    create_tier,
    update_tier,
    delete_tier,
    get_user_rankings,
    DuplicateTierError,
    ProtectedTierError,
    get_donation_summary,
    get_donation_history,
    toggle_donation_status,
    generate_gift_card,
    get_all_gift_cards
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

    calculated_subtotal = sum(i.get('quantity', 1) * i.get('price_at_order', 0.0) for i in items) if items else order.total_amount
    subtotal_amount = getattr(order, 'subtotal_amount', None)
    if subtotal_amount is None:
        subtotal_amount = calculated_subtotal

    discount_amount = getattr(order, 'discount_amount', None)
    if discount_amount is None or discount_amount == 0.0:
        if subtotal_amount > order.total_amount:
            discount_amount = round(subtotal_amount - order.total_amount, 2)
        else:
            discount_amount = 0.0

    voucher_code = getattr(order, 'voucher_code', None)

    return {
        'id': order.id,
        'user_id': order.user_id,
        'customer_name': customer_name,
        'customer_email': order.customer_email,
        'shipping_address': order.shipping_address,
        'city': order.city,
        'postal_code': order.postal_code,
        'phone': order.phone,
        'subtotal_amount': round(subtotal_amount, 2),
        'discount_amount': round(discount_amount, 2),
        'voucher_code': voucher_code,
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

@admin_orders_bp.route('/<int:order_id>', methods=['GET'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def get_order_by_id(order_id):
    from sqlalchemy.orm import joinedload, selectinload
    order = Order.query.options(
        joinedload(Order.user),
        selectinload(Order.items)
    ).filter_by(id=order_id).first()
    if not order:
        return jsonify({"error": "Order not found"}), 404
    return jsonify({'order': serialize_order(order)})

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
    
    validated_data = {}
    for key, value in data.items():
        if key not in whitelist:
            return jsonify({"error": f"Invalid setting key: {key}"}), 400
        if isinstance(value, (int, float, bool)):
            value = str(value)
        elif not isinstance(value, str):
            return jsonify({"error": "Setting values must be strings"}), 400
        validated_data[key] = value

    # Domain validation for settings
    percentages = {'discount_percent', 'donation_percentage', 'email_quota_warning_percent', 'birthday_reward_percent'}
    non_negative_nums = {'points_per_egp', 'points_to_egp_rate', 'review_bonus_points', 
                        'social_follow_bonus_points', 'referral_voucher_amount', 
                        'referral_voucher_min_spend', 'referral_min_order_amount', 'birthday_reward_amount'}
    integers = {'points_expiry_months', 'voucher_expiry_months', 'gift_card_default_expiry_months', 'birthday_reward_lead_days'}

    for k, v in validated_data.items():
        if k in percentages:
            try:
                val = float(v)
                if not (0 <= val <= 100):
                    return jsonify({"error": f"Setting '{k}' must be a percentage between 0 and 100"}), 400
            except ValueError:
                pass
        elif k in non_negative_nums:
            try:
                val = float(v)
                if val < 0:
                    return jsonify({"error": f"Setting '{k}' cannot be negative"}), 400
            except ValueError:
                pass
        elif k in integers:
            try:
                val = int(v)
                if val < 0:
                    return jsonify({"error": f"Setting '{k}' cannot be negative"}), 400
            except ValueError:
                pass
            
    try:
        for key, value in validated_data.items():
            Setting.set_setting(key, value)
        
        settings = Setting.query.all()
        return jsonify({s.key: s.value for s in settings})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_settings_bp.route('/test-callmebot', methods=['POST'])
@admin_required
@limiter.limit("10 per minute")
def test_callmebot_notification():
    """
    # ponytail: Send a test WhatsApp message to verify CallMeBot credentials.
    Auto-enables callmebot settings when the test succeeds.
    """
    data = request.get_json() or {}
    phone = data.get('phone')
    apikey = data.get('apikey')
    
    from api.core.utils import send_callmebot_whatsapp
    from api.core.models import Setting
    from api.core.db import db
    
    test_msg = "🧪 *Diya Scarves CallMeBot Test*\nYour WhatsApp notification integration is working perfectly!"
    success, res = send_callmebot_whatsapp(test_msg, phone_override=phone, apikey_override=apikey, sync=True)
    
    if success:
        try:
            Setting.set_setting('callmebot_enabled', 'true')
            if phone:
                Setting.set_setting('callmebot_phone', phone)
            if apikey:
                Setting.set_setting('callmebot_apikey', apikey)
            db.session.commit()
        except Exception:
            db.session.rollback()
        return jsonify({'success': True, 'message': 'Test notification sent successfully!', 'response': res})
    else:
        return jsonify({'success': False, 'error': res or 'Failed to send test notification'}), 400



# ----------------- TIERS ADMIN ROUTES -----------------

@admin_tiers_bp.route('', methods=['GET'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def get_tiers():
    tiers = get_all_tiers()
    return jsonify({"tiers": [t.to_dict() for t in tiers]})

@admin_tiers_bp.route('', methods=['POST'])
@admin_required
@limiter.limit("50 per day; 20 per hour")
def create_tier_route():
    if not request.is_json:
        return jsonify({"error": "Request body must be a JSON object"}), 400
    try:
        tier = create_tier(request.get_json())
        return jsonify({"tier": tier.to_dict()}), 201
    except DuplicateTierError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 409
    except ValueError as e:
        db.session.rollback()
        details = e.args[0] if e.args and isinstance(e.args[0], dict) else {"error": str(e)}
        return jsonify({"error": "Validation failed", "details": details}), 400

@admin_tiers_bp.route('/<int:tier_id>', methods=['PUT'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def update_tier_route(tier_id):
    if not request.is_json:
        return jsonify({"error": "Request body must be a JSON object"}), 400
    tier = db.session.get(MembershipTier, tier_id)
    if not tier:
        return jsonify({"error": "Tier not found"}), 404
    try:
        updated_tier = update_tier(tier, request.get_json())
        return jsonify({"tier": updated_tier.to_dict()}), 200
    except DuplicateTierError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 409
    except ValueError as e:
        db.session.rollback()
        details = e.args[0] if e.args and isinstance(e.args[0], dict) else {"error": str(e)}
        return jsonify({"error": "Validation failed", "details": details}), 400

@admin_tiers_bp.route('/<int:tier_id>', methods=['DELETE'])
@admin_required
@limiter.limit("50 per day; 20 per hour")
def delete_tier_route(tier_id):
    tier = db.session.get(MembershipTier, tier_id)
    if not tier:
        return jsonify({"error": "Tier not found"}), 404
    try:
        delete_tier(tier)
        return jsonify({"message": "Tier deleted successfully", "id": tier_id}), 200
    except ProtectedTierError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_tiers_bp.route('/users', methods=['GET'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def get_tier_user_rankings():
    rankings = get_user_rankings()
    return jsonify({"users": rankings})


# ----------------- DONATIONS ADMIN ROUTES -----------------

@admin_donations_bp.route('/summary', methods=['GET'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def donation_summary_route():
    period = request.args.get('period')
    summary = get_donation_summary(period)
    return jsonify(summary)

@admin_donations_bp.route('/history', methods=['GET'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def donation_history_route():
    history = get_donation_history()
    return jsonify({"history": history})

@admin_donations_bp.route('/status', methods=['PUT'])
@admin_required
@limiter.limit("50 per day; 20 per hour")
def update_donation_status_route():
    if not request.is_json:
        return jsonify({"error": "Request body must be a JSON object"}), 400
    data = request.get_json()
    period = data.get('period')
    status = data.get('status')
    note = data.get('note', '')
    if not period or not status:
        return jsonify({"error": "period and status are required"}), 400
    if status not in ('pending', 'donated'):
        return jsonify({"error": "status must be 'pending' or 'donated'"}), 400
    try:
        updated = toggle_donation_status(period, status, note)
        return jsonify(updated), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ----------------- GIFT CARDS ADMIN ROUTES -----------------

@admin_giftcards_bp.route('', methods=['GET'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def get_gift_cards_route():
    cards = get_all_gift_cards()
    return jsonify({"gift_cards": cards})

@admin_giftcards_bp.route('', methods=['POST'])
@admin_required
@limiter.limit("50 per day; 20 per hour")
def create_gift_card_route():
    if not request.is_json:
        return jsonify({"error": "Request body must be a JSON object"}), 400
    data = request.get_json()
    value = data.get('value')
    if value is None:
        return jsonify({"error": "value is required"}), 400
    try:
        val = float(value)
        expiry_months = data.get('expiry_months')
        if expiry_months is not None:
            expiry_months = int(expiry_months)
        card = generate_gift_card(val, expiry_months=expiry_months)
        return jsonify({"gift_card": card}), 201
    except ValueError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
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
        final_filename, blob_debug = process_and_save_image(file, upload_dir)
        
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
        resp_data = serialize_image(new_img)
        resp_data['blob_debug'] = blob_debug
        return jsonify(resp_data), 201
    except ValueError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Image upload failure: {str(e)}", exc_info=True)
        return jsonify({"error": f"Image processing failed: {str(e)}"}), 500


@admin_images_bp.route('/<int:image_id>', methods=['DELETE'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def delete_image(image_id):
    img = db.session.get(ProductImage, image_id)
    if not img:
        return jsonify({"error": "Image not found"}), 404
    try:
        if img.product_id:
            prod = db.session.get(Product, img.product_id)
            if prod and prod.image_filename == img.filename:
                prod.image_filename = None
        db.session.delete(img)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
