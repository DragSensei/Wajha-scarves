from flask import jsonify, request
from api.features.vouchers import vouchers_bp
from api.features.vouchers.schemas import validate_voucher_purchase
from api.features.vouchers.services import (
    purchase_voucher,
    get_user_vouchers,
    get_all_vouchers,
    update_voucher_status
)
from api.core.extensions import limiter
from api.core.decorators import require_auth, admin_required

@vouchers_bp.route('/buy', methods=['POST'])
@limiter.limit("10 per hour; 3 per minute")
def buy_voucher_route():
    data = request.get_json() or {}
    is_valid, errors = validate_voucher_purchase(data)
    if not is_valid:
        return jsonify({'error': 'Validation failed', 'details': errors}), 400

    buyer_user = None
    from api.core.decorators import get_token_from_request, decode_token, AuthError
    try:
        token = get_token_from_request()
        if token:
            buyer_user = request.current_user
    except (AuthError, Exception):
        pass

    try:
        card = purchase_voucher(data, buyer_user=buyer_user)
        return jsonify({
            'success': True,
            'voucher': card.to_dict(),
            'message': f'Voucher for {int(card.value)} EGP successfully created!'
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@vouchers_bp.route('/my-vouchers', methods=['GET'])
@require_auth
@limiter.limit("50 per hour")
def get_my_vouchers_route():
    user = request.current_user
    user_id = getattr(user, 'id', None)
    user_email = getattr(user, 'email', None) or (user.get('email') if isinstance(user, dict) else None)
    vouchers = get_user_vouchers(user_id=user_id, user_email=user_email)
    return jsonify({'vouchers': vouchers}), 200


@vouchers_bp.route('/admin', methods=['GET'])
@admin_required
@limiter.limit("50 per hour")
def get_admin_vouchers_route():
    vouchers = get_all_vouchers()
    return jsonify({'vouchers': vouchers}), 200


@vouchers_bp.route('/admin/<int:voucher_id>/status', methods=['PUT'])
@admin_required
@limiter.limit("100 per minute")
def update_voucher_status_route(voucher_id):
    data = request.get_json() or {}
    new_status = data.get('status')
    if not new_status:
        return jsonify({'error': 'Status is required'}), 400

    try:
        card = update_voucher_status(voucher_id, new_status)
        return jsonify({'success': True, 'voucher': card.to_dict()}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500
