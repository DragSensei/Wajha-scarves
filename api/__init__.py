import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv

from api.core.db import db
from api.core.extensions import limiter, csrf
from werkzeug.middleware.proxy_fix import ProxyFix

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default_secret_key_change_me')
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'default_admin_password_change_me')
    
    # Neon database string in prod, SQLite locally
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app.db'))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Secure cookie attributes to prevent hijacking
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Strict'
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'True').lower() in ('true', '1')
    
    # Image Upload Config
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'uploads'))
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB limit

    ALLOWED_SETTINGS = {
        'sale_active', 'discount_active', 'discount_percent', 'custom_sale_text', 
        'discount_categories', 'discount_product_ids', 'whatsapp_number', 
        'contact_number', 'sale_bundle_name', 'owner_whatsapp'
    }

    # JWT Authentication Configuration
    JWT_SECRET = os.environ.get('JWT_SECRET', 'default_jwt_secret_change_me')
    JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
    JWT_ISSUER = os.environ.get('JWT_ISSUER', None)
    AUTH_MODE = os.environ.get('AUTH_MODE', 'local')
    AUTH_REGISTRATION_ENABLED = os.environ.get('AUTH_REGISTRATION_ENABLED', 'True').lower() in ('true', '1', 'yes')




def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Startup validation for security (if not testing/dev default placeholder keys)
    if not app.testing and not app.debug:
        if app.config.get('SECRET_KEY') == 'default_secret_key_change_me':
            raise ValueError("Missing or invalid SECRET_KEY in environment variables")
        if app.config.get('ADMIN_PASSWORD') == 'default_admin_password_change_me':
            raise ValueError("Missing or invalid ADMIN_PASSWORD in environment variables")
        if app.config.get('JWT_SECRET') == 'default_jwt_secret_change_me':
            raise ValueError("Missing or invalid JWT_SECRET in environment variables")

    # Initialize CORS with locked origins
    allowed_origins = os.environ.get('CORS_ORIGIN', 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000').split(',')
    CORS(app, origins=allowed_origins, supports_credentials=True)

    # Initialize extensions
    db.init_app(app)
    limiter.init_app(app)
    csrf.init_app(app)
    
    # Initialize Migrate
    Migrate(app, db)

    # Register blueprints
    from api.features.auth import auth_bp
    from api.features.categories import categories_bp
    from api.features.products import products_bp
    from api.features.cart import cart_bp, cart_db_bp
    from api.features.admin import (
        admin_users_bp,
        admin_settings_bp,
        admin_images_bp,
        admin_orders_bp
    )

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(categories_bp, url_prefix='/api/categories')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(cart_bp, url_prefix='/api/orders') # handles POST /api/orders
    app.register_blueprint(cart_db_bp, url_prefix='/api/cart') # handles cart persistence CRUD
    
    app.register_blueprint(admin_users_bp, url_prefix='/api/users')
    app.register_blueprint(admin_settings_bp, url_prefix='/api/settings')
    app.register_blueprint(admin_images_bp, url_prefix='/api/images')
    app.register_blueprint(admin_orders_bp, url_prefix='/api/orders') # handles GET /api/orders and POST /api/orders/<id>/complete

    # No general CSRF exemptions to protect JWT HttpOnly cookie authentication.
    # Exclude only testing/verification routes if any.

    # Public image serving route
    @app.route('/api/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # CSRF Token endpoint
    from flask_wtf.csrf import generate_csrf
    @app.route('/api/csrf-token', methods=['GET'])
    def get_csrf_token():
        return jsonify({'csrf_token': generate_csrf()})

    # Apply ProxyFix behind proxies to correct remote_addr for Flask-Limiter
    if not app.debug and not app.testing:
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)

    return app
