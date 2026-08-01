from api.core.db import db
from api import create_app
from sqlalchemy import text

app = create_app()
with app.app_context():
    db.session.execute(text("""
        DELETE FROM setting WHERE key IN (
            'points_per_egp', 'points_to_egp_rate', 'review_bonus_points', 
            'social_follow_bonus_points', 'referral_voucher_amount', 
            'referral_voucher_min_spend', 'referral_min_order_amount', 
            'points_expiry_months', 'voucher_expiry_months'
        )
    """))
    db.session.commit()
    print("Seeded settings cleaned up.")
