import time
from datetime import datetime, timezone
from api.core.db import db
from werkzeug.security import generate_password_hash, check_password_hash

# Category Model
class Category(db.Model):
    __tablename__ = 'category'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('category.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    children = db.relationship('Category', backref=db.backref('parent', remote_side=[id]), lazy='selectin')

    def __repr__(self):
        return f"<Category {self.name}>"

# Product Model
class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), unique=True, nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), nullable=True, default='unclassified')
    category_id = db.Column(db.Integer, db.ForeignKey('category.id', ondelete='SET NULL'), nullable=True, default=None)
    image_filename = db.Column(db.String(255), nullable=True)
    stock = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    images = db.relationship('ProductImage', backref='product', lazy='selectin', cascade='all, delete-orphan')  
    category_ref = db.relationship('Category', backref=db.backref('products', lazy='selectin'), lazy='selectin')

    @property
    def ordered_images(self):
        return sorted(self.images, key=lambda x: (not x.is_primary, x.sort_order))

class ProductImage(db.Model):
    __tablename__ = 'product_images'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=True)
    filename = db.Column(db.String(255), nullable=False)
    is_primary = db.Column(db.Boolean, default=False)
    sort_order = db.Column(db.Integer, default=0)

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    customer_name = db.Column(db.String(150), nullable=False)
    customer_email = db.Column(db.String(150), nullable=True)
    shipping_address = db.Column(db.Text, nullable=True)
    city = db.Column(db.String(100), nullable=True)
    postal_code = db.Column(db.String(50), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='completed')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    items = db.relationship('OrderItem', backref='order', lazy='selectin', cascade='all, delete-orphan')
    user = db.relationship('User', lazy='selectin')

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id', ondelete='SET NULL'), nullable=True)
    product_name = db.Column(db.String(255), nullable=True)
    quantity = db.Column(db.Integer, nullable=False)
    price_at_order = db.Column(db.Float, nullable=False)

    product = db.relationship('Product', lazy='selectin')

    def to_dict(self):
        from api.core.utils import get_image_url
        img_url = None
        if self.product:
            if self.product.image_filename:
                img_url = get_image_url(self.product.image_filename)
            elif self.product.images:
                sorted_imgs = sorted(self.product.images, key=lambda x: (not x.is_primary, x.sort_order))
                if sorted_imgs:
                    img_url = get_image_url(sorted_imgs[0].filename)

        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product_name or (self.product.name if self.product else "Unknown Product"),
            'quantity': self.quantity,
            'price_at_order': self.price_at_order,
            'image_url': img_url
        }

class Setting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=True)

    @staticmethod
    def get_setting(key, default=None):
        """Helper function to retrieve a setting's value with request-level caching."""
        from flask import has_request_context, g
        if has_request_context():
            if not hasattr(g, '_settings_cache'):
                g._settings_cache = {}
            if key in g._settings_cache:
                return g._settings_cache[key]

        try:
            setting = Setting.query.filter_by(key=key).first()
            val = setting.value if setting else default
            if has_request_context():
                g._settings_cache[key] = val
            return val
        except Exception:
            return default

    @staticmethod
    def get_many(keys, defaults=None):
        """Retrieves multiple settings at once, using request-level cache or a single database query."""
        if not defaults:
            defaults = {}
        results = {}
        missing_keys = []
        from flask import has_request_context, g

        for k in keys:
            if has_request_context() and hasattr(g, '_settings_cache') and k in g._settings_cache:
                results[k] = g._settings_cache[k]
            else:
                missing_keys.append(k)

        if missing_keys:
            try:
                db_settings = Setting.query.filter(Setting.key.in_(missing_keys)).all()
                found_map = {s.key: s.value for s in db_settings}
                for k in missing_keys:
                    val = found_map.get(k, defaults.get(k))
                    results[k] = val
                    if has_request_context():
                        if not hasattr(g, '_settings_cache'):
                            g._settings_cache = {}
                        g._settings_cache[k] = val
            except Exception:
                for k in missing_keys:
                    results[k] = defaults.get(k)

        return results

    @staticmethod
    def set_setting(key, value):
        """Helper function to create or update a setting."""
        setting = Setting.query.filter_by(key=key).first()
        if setting:
            setting.value = value
        else:
            setting = Setting(key=key, value=value)
            db.session.add(setting)
        try:
            db.session.commit()
            from flask import has_request_context, g
            if has_request_context():
                if not hasattr(g, '_settings_cache'):
                    g._settings_cache = {}
                g._settings_cache[key] = value
        except Exception:
            db.session.rollback()
        return setting


# User Model for Local Auth Mode
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')  # 'admin', 'user'
    full_name = db.Column(db.String(255), nullable=False)
    failed_login_attempts = db.Column(db.Integer, default=0, nullable=False)
    lockout_until = db.Column(db.DateTime, nullable=True)
    token_version = db.Column(db.Integer, default=1, nullable=False)
    phone = db.Column(db.String(255), nullable=True)
    address = db.Column(db.Text, nullable=True)
    city = db.Column(db.String(255), nullable=True)
    postal_code = db.Column(db.String(100), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    birth_date = db.Column(db.Date, nullable=True)
    referral_code = db.Column(db.String(12), unique=True, nullable=True)
    referred_by_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    referred_by = db.relationship('User', remote_side=[id], backref=db.backref('referees', lazy='dynamic'))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        from api.core.crypto import decrypt_text
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "full_name": self.full_name,
            "phone": decrypt_text(self.phone),
            "address": decrypt_text(self.address),
            "city": decrypt_text(self.city),
            "postal_code": decrypt_text(self.postal_code),
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "birth_date": self.birth_date.isoformat() if self.birth_date else None,
            "referral_code": self.referral_code,
            "referred_by_id": self.referred_by_id
        }

# Cart Item Model
class CartItem(db.Model):
    __tablename__ = 'cart_items'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id', ondelete='CASCADE'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', backref=db.backref('cart_items', lazy='selectin', cascade='all, delete-orphan'), lazy='selectin')
    product = db.relationship('Product', lazy='selectin')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class WishlistItem(db.Model):
    __tablename__ = 'wishlist_items'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint('user_id', 'product_id', name='uq_user_wishlist_product'),
    )

    product = db.relationship('Product', lazy='selectin')
    user = db.relationship('User', backref=db.backref('wishlist_items', lazy='selectin', cascade='all, delete-orphan'), lazy='selectin')


class MembershipTier(db.Model):
    __tablename__ = 'membership_tiers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    spend_threshold = db.Column(db.Float, default=0.0)
    sort_order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'spend_threshold': self.spend_threshold,
            'sort_order': self.sort_order
        }


class DonationRecord(db.Model):
    __tablename__ = 'donation_records'
    id = db.Column(db.Integer, primary_key=True)
    period = db.Column(db.String(20), unique=True, nullable=False)
    status = db.Column(db.String(20), default="pending")
    donated_at = db.Column(db.DateTime, nullable=True)
    note = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'period': self.period,
            'status': self.status,
            'donated_at': self.donated_at.isoformat() if self.donated_at else None,
            'note': self.note
        }


class GiftCard(db.Model):
    __tablename__ = 'gift_cards'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(32), unique=True, nullable=False)
    value = db.Column(db.Float, nullable=False)
    is_redeemed = db.Column(db.Boolean, default=False)
    redeemed_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'value': self.value,
            'is_redeemed': self.is_redeemed,
            'redeemed_at': self.redeemed_at.isoformat() if self.redeemed_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class LoyaltyPointsEntry(db.Model):
    __tablename__ = 'loyalty_points_entries'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    source = db.Column(db.String(50), nullable=False)
    ref_id = db.Column(db.Integer, nullable=True)
    earned_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'amount': self.amount,
            'source': self.source,
            'ref_id': self.ref_id,
            'earned_at': self.earned_at.isoformat() if self.earned_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }


class LoyaltyVoucher(db.Model):
    __tablename__ = 'loyalty_vouchers'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    value = db.Column(db.Float, nullable=False)
    source = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, nullable=True)
    redeemed = db.Column(db.Boolean, default=False)
    min_order_amount = db.Column(db.Float, default=0.0)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'value': self.value,
            'source': self.source,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'redeemed': self.redeemed,
            'min_order_amount': self.min_order_amount
        }


class ReferralConversion(db.Model):
    __tablename__ = 'referral_conversions'
    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    referee_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    qualifying_order_id = db.Column(db.Integer, db.ForeignKey('order.id', ondelete='SET NULL'), nullable=True)
    reward_issued = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'referrer_id': self.referrer_id,
            'referee_id': self.referee_id,
            'qualifying_order_id': self.qualifying_order_id,
            'reward_issued': self.reward_issued,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }



