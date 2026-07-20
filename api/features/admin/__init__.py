from flask import Blueprint

admin_users_bp = Blueprint('admin_users', __name__)
admin_settings_bp = Blueprint('admin_settings', __name__)
admin_images_bp = Blueprint('admin_images', __name__)
admin_orders_bp = Blueprint('admin_orders', __name__)

from api.features.admin import routes
