from flask import Blueprint

vouchers_bp = Blueprint('vouchers', __name__, url_prefix='/api/vouchers')

from api.features.vouchers import routes  # noqa
