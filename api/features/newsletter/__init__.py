from flask import Blueprint

newsletter_bp = Blueprint('newsletter', __name__)
admin_newsletter_bp = Blueprint('admin_newsletter', __name__)

from api.features.newsletter import routes  # noqa
