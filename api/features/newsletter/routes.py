from flask import jsonify, request
from api.features.newsletter import newsletter_bp, admin_newsletter_bp
from api.features.newsletter.schemas import validate_subscribe_payload, validate_campaign_payload
from api.features.newsletter.services import (
    subscribe_email,
    unsubscribe_email,
    get_subscribers_paginated,
    send_newsletter_campaign,
    delete_subscriber
)
from api.core.decorators import admin_required
from api.core.extensions import limiter

@newsletter_bp.route('/subscribe', methods=['POST'])
@limiter.limit("10 per minute")
def api_subscribe_newsletter():
    """Public endpoint to subscribe an email address to the newsletter."""
    is_valid, data_or_err = validate_subscribe_payload(request.get_json(silent=True) or {})
    if not is_valid:
        return jsonify(data_or_err), 400
    
    email = data_or_err
    subscriber, is_new = subscribe_email(email)
    
    if not is_new:
        return jsonify({
            'message': 'You are already subscribed to the newsletter!',
            'subscriber': subscriber
        }), 200
        
    return jsonify({
        'message': 'Thank you for subscribing to Diya Silk Scarves newsletter!',
        'subscriber': subscriber
    }), 201


@newsletter_bp.route('/unsubscribe', methods=['POST'])
@limiter.limit("10 per minute")
def api_unsubscribe_newsletter():
    """Public endpoint to unsubscribe an email address."""
    is_valid, data_or_err = validate_subscribe_payload(request.get_json(silent=True) or {})
    if not is_valid:
        return jsonify(data_or_err), 400
    
    email = data_or_err
    success = unsubscribe_email(email)
    
    if success:
        return jsonify({'message': 'You have been successfully unsubscribed.'}), 200
    return jsonify({'message': 'Email address not found in subscriber list.'}), 404


@admin_newsletter_bp.route('', methods=['GET'])
@admin_required
def api_admin_get_subscribers():
    """
    Admin endpoint to fetch paginated subscribers.
    Uses strict 12-row pagination limit by default to optimize database performance.
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    search = request.args.get('search', '', type=str)
    active_only = request.args.get('active_only', 'false', type=str).lower() == 'true'

    if per_page > 50:
        per_page = 50
    if per_page < 1:
        per_page = 12

    result = get_subscribers_paginated(
        page=page,
        per_page=per_page,
        search=search,
        active_only=active_only
    )
    return jsonify(result), 200


@admin_newsletter_bp.route('/send', methods=['POST'])
@admin_required
def api_admin_send_campaign():
    """Admin endpoint to dispatch newsletter email campaigns to subscribers."""
    is_valid, data_or_err = validate_campaign_payload(request.get_json(silent=True) or {})
    if not is_valid:
        return jsonify(data_or_err), 400
    
    payload = data_or_err
    result = send_newsletter_campaign(
        subject=payload['subject'],
        content=payload['content'],
        recipient_ids=payload['recipient_ids'],
        send_all=payload['send_all']
    )
    return jsonify(result), 200


@admin_newsletter_bp.route('/<int:subscriber_id>', methods=['DELETE'])
@admin_required
def api_admin_delete_subscriber(subscriber_id):
    """Admin endpoint to delete a subscriber."""
    success = delete_subscriber(subscriber_id)
    if success:
        return jsonify({'message': 'Subscriber deleted successfully.'}), 200
    return jsonify({'error': 'Subscriber not found.'}), 404
