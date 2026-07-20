from flask import Blueprint

auth_bp = Blueprint('auth', __name__)

from api.features.auth import routes
