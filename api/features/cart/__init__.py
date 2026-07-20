from flask import Blueprint

cart_bp = Blueprint('cart', __name__)
cart_db_bp = Blueprint('cart_db', __name__)

from api.features.cart import routes
