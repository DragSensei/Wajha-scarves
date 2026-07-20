from flask import Blueprint

products_bp = Blueprint('products', __name__)

from api.features.products import routes
