from flask import Blueprint

admin_users_bp = Blueprint('admin_users', __name__)
admin_settings_bp = Blueprint('admin_settings', __name__)
admin_images_bp = Blueprint('admin_images', __name__)
admin_orders_bp = Blueprint('admin_orders', __name__)
admin_tiers_bp = Blueprint('admin_tiers', __name__)
admin_donations_bp = Blueprint('admin_donations', __name__)
admin_giftcards_bp = Blueprint('admin_giftcards', __name__)

from api.features.admin import routes

