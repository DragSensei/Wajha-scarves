import os
from flask import jsonify, request
from api.features.loyalty import loyalty_bp
from api.core.decorators import require_auth
from api.core.extensions import limiter
from api.core.models import MembershipTier
from api.features.loyalty.services import (
    get_user_loyalty_status,
    get_user_points_history,
    convert_points_to_voucher,
    reconcile_order_loyalty,
    issue_birthday_rewards
)

def verify_cron_secret():
    cron_secret = os.environ.get('CRON_SECRET')
    if not cron_secret:
        # In development / demo mode, allow request if no secret set
        return True
    auth_header = request.headers.get('Authorization') or request.headers.get('X-Cron-Secret')
    if auth_header and (auth_header == f"Bearer {cron_secret}" or auth_header == cron_secret):
        return True
    return False


@loyalty_bp.route('/tiers', methods=['GET'])
@limiter.limit("200 per minute")
def loyalty_tiers_route():
    """Public endpoint — returns all membership tiers ordered by spend threshold."""
    tiers = MembershipTier.query.order_by(MembershipTier.spend_threshold.asc()).all()
    return jsonify({"tiers": [t.to_dict() for t in tiers]}), 200


@loyalty_bp.route('/status', methods=['GET'])
@require_auth
@limiter.limit("100 per minute")
def loyalty_status_route():
    user = request.current_user
    user_id = user.id if hasattr(user, 'id') else int(user.get('user_id') or user.get('sub'))
    status = get_user_loyalty_status(user_id)
    return jsonify(status), 200


@loyalty_bp.route('/history', methods=['GET'])
@require_auth
@limiter.limit("100 per minute")
def loyalty_history_route():
    user = request.current_user
    user_id = user.id if hasattr(user, 'id') else int(user.get('user_id') or user.get('sub'))
    history = get_user_points_history(user_id)
    return jsonify({"history": history}), 200


@loyalty_bp.route('/convert', methods=['POST'])
@require_auth
@limiter.limit("10 per minute")
def loyalty_convert_route():
    user = request.current_user
    user_id = user.id if hasattr(user, 'id') else int(user.get('user_id') or user.get('sub'))
    try:
        res = convert_points_to_voucher(user_id)
        return jsonify(res), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@loyalty_bp.route('/cron/reconcile', methods=['POST', 'GET'])
@limiter.limit("60 per hour")
def loyalty_cron_reconcile():
    if not verify_cron_secret():
        return jsonify({"error": "Unauthorized cron request"}), 401
    try:
        res = reconcile_order_loyalty()
        return jsonify(res), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@loyalty_bp.route('/cron/birthdays', methods=['POST', 'GET'])
@limiter.limit("24 per day")
def loyalty_cron_birthdays():
    if not verify_cron_secret():
        return jsonify({"error": "Unauthorized cron request"}), 401
    try:
        res = issue_birthday_rewards()
        return jsonify(res), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
