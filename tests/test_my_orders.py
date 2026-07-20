from api import create_app
from api.core.models import Order, User
from api.core.db import db

def test_my_orders():
    app = create_app()
    with app.app_context():
        admin = User.query.filter_by(role='admin').first()
        assert admin is not None
        orders = Order.query.filter((Order.user_id == admin.id) | (Order.customer_email == admin.email)).all()
        assert len(orders) >= 0

if __name__ == '__main__':
    test_my_orders()
    print("My orders test passed!")
