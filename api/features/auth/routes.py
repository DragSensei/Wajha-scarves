import datetime
from flask import request, jsonify, make_response, current_app
from api.features.auth import auth_bp
from api.core.decorators import require_auth, admin_required, generate_access_token
from api.core.db import db
from api.core.extensions import limiter
from api.core.models import User
from api.features.auth.schemas import validate_register, validate_login

@auth_bp.before_request
def check_mode():
    if current_app.config.get('AUTH_MODE') != 'local':
        if request.endpoint and request.endpoint.split('.')[-1] in ('register', 'login'):
            return jsonify({"error": "Endpoint not supported in external authentication mode."}), 501


@auth_bp.route('/register', methods=['POST'])
@limiter.limit("20 per hour; 5 per minute")
def register():
    if not current_app.config.get('AUTH_REGISTRATION_ENABLED', True):
        return jsonify({"error": "Registration is disabled."}), 403

    data = request.get_json() or {}
    is_valid, errors = validate_register(data)
    if not is_valid:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    role = data.get('role', 'student')

    # Security check: only allow public registration for standard customer/student accounts.
    # Creating administrative or instructor accounts requires admin rights (or ADMIN_PASSWORD for initial bootstrap).
    if role in ('admin', 'instructor'):
        from api.core.decorators import get_token_from_request, decode_token, AuthError
        if not User.query.first():
            if data.get('admin_secret') != current_app.config.get('ADMIN_PASSWORD'):
                return jsonify({"error": "Admin secret key is required for initial admin bootstrap."}), 403
        else:
            try:
                token = get_token_from_request()
                payload = decode_token(token, verify_token_version=True)
                role_claim = payload.get('role')
                if role_claim != 'admin':
                    return jsonify({"error": "Admin access required to register admins/instructors."}), 403
            except AuthError as e:
                return jsonify({"error": f"Admin access required to register admins/instructors: {e.message}"}), e.status_code

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Validation failed", "details": {"email": "Email is already registered."}}), 400

    user = User(email=email, full_name=full_name, role=role)
    user.set_password(password)

    phone = data.get('phone')
    if phone and isinstance(phone, str) and phone.strip():
        from api.core.crypto import encrypt_text
        user.phone = encrypt_text(phone.strip())

    try:
        db.session.add(user)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Failed to create user."}), 500

    return jsonify({"user": user.to_dict()}), 201


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("20 per hour; 5 per minute")
def login():
    data = request.get_json() or {}
    is_valid, errors = validate_login(data)
    if not is_valid:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Invalid email or password."}), 401

    # Check lockout
    now = datetime.datetime.now(datetime.timezone.utc)
    if user.lockout_until:
        lockout = user.lockout_until
        if lockout.tzinfo is None:
            lockout = lockout.replace(tzinfo=datetime.timezone.utc)
        if now < lockout:
            wait_seconds = int((lockout - now).total_seconds())
            response = jsonify({"error": f"Account temporarily locked. Please try again in {wait_seconds} seconds."})
            response.headers['Retry-After'] = str(wait_seconds)
            return response, 429

    if user.check_password(password):
        user.failed_login_attempts = 0
        user.lockout_until = None
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

        token = generate_access_token(user)
        user_dict = user.to_dict()
        
        resp = make_response(jsonify({"user": user_dict, "access_token": token}))
        # Set httponly cookie for web clients
        resp.set_cookie(
            'jwt_token', 
            token, 
            httponly=True, 
            secure=current_app.config.get('SESSION_COOKIE_SECURE', False), 
            samesite='Strict', 
            max_age=86400
        )
        return resp

    # Failed login attempt
    user.failed_login_attempts += 1
    if user.failed_login_attempts >= 5:
        user.lockout_until = now + datetime.timedelta(minutes=15)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
        response = jsonify({"error": "Account temporarily locked due to too many failed attempts."})
        response.headers['Retry-After'] = '900'
        return response, 429
    
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

    return jsonify({"error": "Invalid email or password."}), 401


@auth_bp.route('/logout', methods=['POST'])
@require_auth
def logout():
    if current_app.config.get('AUTH_MODE') == 'local':
        user = request.current_user
        user.token_version += 1
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            return jsonify({"error": "Logout failed."}), 500

    resp = make_response(jsonify({"message": "Logged out successfully."}))
    resp.delete_cookie('jwt_token')
    return resp


@auth_bp.route('/me', methods=['GET'])
@require_auth
def me():
    user = request.current_user
    if current_app.config.get('AUTH_MODE') == 'local':
        return jsonify({"user": user.to_dict()})
    else:
        return jsonify({"user": user})


@auth_bp.route('/profile', methods=['PUT'])
@require_auth
@limiter.limit("20 per minute")
def update_profile():
    user = request.current_user
    if current_app.config.get('AUTH_MODE') != 'local':
        return jsonify({"error": "Profile updates not supported in external auth mode."}), 501

    data = request.get_json() or {}
    from api.core.crypto import encrypt_text

    if 'full_name' in data and data['full_name'].strip():
        user.full_name = data['full_name'].strip()
    if 'phone' in data:
        user.phone = encrypt_text(data['phone'].strip())
    if 'address' in data:
        user.address = encrypt_text(data['address'].strip())
    if 'city' in data:
        user.city = encrypt_text(data['city'].strip())
    if 'postal_code' in data:
        user.postal_code = encrypt_text(data['postal_code'].strip())

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Failed to update profile."}), 500

    return jsonify({"user": user.to_dict()}), 200

