from flask import Blueprint

loyalty_bp = Blueprint('loyalty', __name__, url_prefix='/api/loyalty')

from api.features.loyalty import routes  # noqa
