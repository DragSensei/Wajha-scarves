import logging
import secrets
from datetime import datetime, timezone
from flask import current_app
from api.core.db import db
from api.core.models import Product, Category, Order, OrderItem, User
from api.features.admin.schemas import validate_create_user, validate_update_user

logger = logging.getLogger(__name__)

# ----------------- User Services -----------------

class DuplicateEmailError(ValueError):
    """Exception raised when an active user email already exists."""
    pass

def create_or_reactivate_user(data):
    is_valid, errors = validate_create_user(data)
    if not is_valid:
        raise ValueError(errors)

    email = data['email']
    full_name = data['full_name']
    phone = data.get('phone')
    role = data.get('role', 'student')
    raw_password = data.get('password')

    generated_password = None
    if not raw_password:
        generated_password = secrets.token_urlsafe(16)
        raw_password = generated_password

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        if existing_user.is_active:
            raise DuplicateEmailError("A user with this email already exists.")
        
        existing_user.full_name = full_name
        existing_user.phone = phone
        existing_user.role = role
        existing_user.set_password(raw_password)
        existing_user.is_active = True
        existing_user.token_version += 1
        
        try:
            db.session.commit()
            return existing_user, generated_password, True
        except Exception:
            db.session.rollback()
            raise
    else:
        new_user = User(
            email=email,
            full_name=full_name,
            phone=phone,
            role=role,
            is_active=True
        )
        new_user.set_password(raw_password)
        db.session.add(new_user)
        
        try:
            db.session.commit()
            return new_user, generated_password, False
        except Exception:
            db.session.rollback()
            raise


def update_user(user, data):
    is_valid, errors = validate_update_user(data)
    if not is_valid:
        raise ValueError(errors)

    new_email = data.get('email')
    if new_email and new_email != user.email:
        conflict_user = User.query.filter_by(email=new_email).first()
        if conflict_user:
            raise DuplicateEmailError("A user with this email already exists.")

    email_changed = (new_email is not None and new_email != user.email)
    role_changed = ('role' in data and data['role'] != user.role)
    password_changed = ('password' in data and data['password'] is not None)

    if email_changed:
        user.email = new_email
    if role_changed:
        user.role = data['role']
    if password_changed:
        user.set_password(data['password'])
        
    if 'full_name' in data:
        user.full_name = data['full_name']
    if 'phone' in data:
        user.phone = data['phone']

    if email_changed or role_changed or password_changed:
        user.token_version += 1

    try:
        db.session.commit()
        return user
    except Exception:
        db.session.rollback()
        raise


def soft_delete_user(user):
    user.is_active = False
    user.token_version += 1
    try:
        db.session.commit()
        return user
    except Exception:
        db.session.rollback()
        raise


def serialize_user(user):
    return user.to_dict()


