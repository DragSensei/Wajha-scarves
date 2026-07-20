import os
import shutil
from api import create_app
from api.core.db import db
from api.core.models import Category, Product, ProductImage, User
from api.core.utils import generate_slug

def seed():
    app = create_app()
    with app.app_context():
        # 1. Ensure upload directory exists
        upload_dir = app.config['UPLOAD_FOLDER']
        os.makedirs(upload_dir, exist_ok=True)

        # 2. Seed Categories
        categories_data = [
            {'name': 'Bamboo Collection', 'slug': 'bamboo-collection', 'description': 'Premium, ultra-soft, and eco-friendly bamboo scarves.'},
            {'name': 'Scarf & Bandana Sets', 'slug': 'scarf-bandana-sets', 'description': 'Matching scarf and bandana sets for effortless styling.'},
            {'name': 'Solid Colors & Pastels', 'slug': 'solid-colors-pastels', 'description': 'Vibrant and subtle solid tone scarves for everyday wear.'},
            {'name': 'Luxury Essentials', 'slug': 'luxury-essentials', 'description': 'Signature luxury scarves for special occasions and elevated style.'},
        ]
        
        cats_by_slug = {}
        for cat_info in categories_data:
            cat = Category.query.filter_by(slug=cat_info['slug']).first()
            if not cat:
                cat = Category(**cat_info)
                db.session.add(cat)
                db.session.commit()
                print(f"Created Category: {cat.name}")
            cats_by_slug[cat_info['slug']] = cat

        def get_target_cat(p_name):
            low = p_name.lower()
            if 'set' in low or 'bandana' in low:
                return cats_by_slug['scarf-bandana-sets']
            if any(k in low for k in ['yellow', 'blue', 'green', 'berry', 'mauve', 'mist', 'mint', 'teal', 'crimson']):
                return cats_by_slug['solid-colors-pastels']
            if 'pics' in low or 'luxury' in low:
                return cats_by_slug['luxury-essentials']
            return cats_by_slug['bamboo-collection']

        # 3. Discover and process local images from google-stitch-designs
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        stitch_dir = os.path.join(base_dir, 'google-stitch-designs')
        
        image_dirs = [d for d in os.listdir(stitch_dir) if d.startswith('image_from_') and os.path.isdir(os.path.join(stitch_dir, d))]
        
        added_count = 0
        for img_dir in image_dirs:
            screen_file = os.path.join(stitch_dir, img_dir, 'screen.png')
            if not os.path.exists(screen_file):
                continue

            # Extract clean product name
            raw_name = img_dir.replace('image_from_https_worood.co_cdn_shop_files_', '')
            for cleanup in ['.png_v', '.jpg_v', '.jpg', '.png', '_1376_x_2028_2']:
                raw_name = raw_name.replace(cleanup, '')
            
            clean_name = raw_name.replace('_', ' ').title()
            clean_name = clean_name.replace('Worood ', '').replace('Set Scarf Bandana', 'Set (Scarf + Bandana)').replace('Scarf Set', 'Scarf Set')
            if 'Bamboo' not in clean_name:
                clean_name += ' Bamboo Scarf'

            slug = generate_slug(clean_name)
            target_filename = f"bamboo_{slug}.png"
            target_path = os.path.join(upload_dir, target_filename)

            # Copy image file
            shutil.copyfile(screen_file, target_path)

            target_cat = get_target_cat(clean_name)

            # Check if product exists
            prod = Product.query.filter_by(name=clean_name).first()
            if not prod:
                prod = Product(
                    name=clean_name,
                    price=28.00,
                    description=f"Luxury {clean_name} made from 100% organic bamboo fiber. Ultra-soft, breathable, and hypoallergenic with a silk-like texture.",
                    category=target_cat.name,
                    category_id=target_cat.id,
                    image_filename=target_filename,
                    stock=25
                )
                db.session.add(prod)
                db.session.commit()

                # Add primary product image
                prod_img = ProductImage(
                    product_id=prod.id,
                    filename=target_filename,
                    is_primary=True,
                    sort_order=0
                )
                db.session.add(prod_img)
                db.session.commit()
                added_count += 1

        # Re-assign existing products to appropriate categories
        for prod in Product.query.all():
            cat = get_target_cat(prod.name)
            if prod.category_id != cat.id or prod.category != cat.name:
                prod.category_id = cat.id
                prod.category = cat.name
        db.session.commit()

        print(f"Seeded {added_count} products from local stitch images.")

        # 4. Seed Admin and Client accounts
        admin = User.query.filter_by(email='admin@diya.com').first()
        if not admin:
            admin = User(
                email='admin@diya.com',
                full_name='Diya Admin',
                role='admin'
            )
            admin.set_password('AdminPassword123!')
            db.session.add(admin)
            print("Created Admin User: admin@diya.com / AdminPassword123!")

        client = User.query.filter_by(email='client@diya.com').first()
        if not client:
            client = User(
                email='client@diya.com',
                full_name='Diya Client',
                role='student'  # default client role
            )
            client.set_password('ClientPassword123!')
            db.session.add(client)
            print("Created Client User: client@diya.com / ClientPassword123!")

        db.session.commit()
        print("Database seeding completed successfully.")

if __name__ == '__main__':
    seed()
