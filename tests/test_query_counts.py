import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from api import create_app
from api.core.db_utils import get_query_count, reset_query_count
from api.core.db import db
from api.core.models import Product, Category, Setting

def test_query_counts():
    app = create_app()
    app.config['TESTING'] = True
    
    with app.test_client() as client:
        with app.app_context():
            # Seed test categories and products if empty
            cat = Category.query.filter_by(slug='test-silk-count').first()
            if not cat:
                cat = Category(name="Test Silk Count", slug="test-silk-count")
                db.session.add(cat)
                db.session.commit()
            
            if not Product.query.filter(Product.category_id == cat.id).first():
                for i in range(5):
                    p = Product(name=f"Count Product {i}", price=10.0 + i, category_id=cat.id)
                    db.session.add(p)
                db.session.commit()
            
            # Reset query count
            reset_query_count()
            
            try:
                # Fetch products list
                res = client.get('/api/products')
                assert res.status_code == 200
                
                # Get count
                q_count = get_query_count()
                print(f"Products list query count: {q_count}")
                # With optimizations, query count should be minimal:
                # 1. Total products count query (lean)
                # 2. Main products query (joinedload category_ref)
                # 3. Selectinload images query
                # 4. Settings get_many query (if cache cold)
                assert q_count <= 6, f"Expected <= 6 queries for listing, got {q_count}"
                
                # Test detail endpoint
                prod = Product.query.filter(Product.category_id == cat.id).first()
                if prod:
                    reset_query_count()
                    res = client.get(f'/api/products/{prod.id}')
                    assert res.status_code == 200
                    detail_q_count = get_query_count()
                    print(f"Product detail query count: {detail_q_count}")
                    # 1. Product detail fetch (joinedload category_ref)
                    # 2. Selectinload images
                    # 3. Settings get_many (if cache cold)
                    assert detail_q_count <= 4, f"Expected <= 4 queries for detail, got {detail_q_count}"
            finally:
                # Clean up database test records so the catalog remains clean
                Product.query.filter(Product.category_id == cat.id).delete(synchronize_session=False)
                db.session.delete(cat)
                db.session.commit()

if __name__ == '__main__':
    test_query_counts()
    print("Query count tests passed!")
