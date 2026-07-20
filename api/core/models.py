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

    children = db.relationship('Category', backref=db.backref('parent', remote_side=[id]))

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
    images = db.relationship('ProductImage', backref='product', lazy=True, cascade='all, delete-orphan')  
    category_ref = db.relationship('Category', backref='products')

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
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id', ondelete='SET NULL'), nullable=True)
    product_name = db.Column(db.String(255), nullable=True)
    quantity = db.Column(db.Integer, nullable=False)
    price_at_order = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product_name or (self.product.name if self.product else "Unknown Product"),
            'quantity': self.quantity,
            'price_at_order': self.price_at_order
        }

class Setting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=True)

    @staticmethod
    def get_setting(key, default=None):
        """Helper function to retrieve a setting's value."""
        setting = Setting.query.filter_by(key=key).first()
        return setting.value if setting else default

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
        except Exception as e:
            db.session.rollback()
        return setting


# User Model for Local Auth Mode
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='student')  # 'admin', 'instructor', 'student'
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
            "created_at": self.created_at.isoformat() if self.created_at else None
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

    user = db.relationship('User', backref=db.backref('cart_items', lazy=True, cascade='all, delete-orphan'))
    product = db.relationship('Product')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

