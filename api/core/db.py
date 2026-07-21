from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import db_utils to activate events
import api.core.db_utils
