from flask import jsonify, request, current_app
from api.features.products import products_bp
from api.core.models import Product, ProductImage, Category
from api.core.db import db
from api.core.extensions import limiter
from api.core.decorators import admin_required
from api.features.products.services import (
    delete_product_helper,
    process_and_save_image
)
from api.features.products.schemas import validate_product
from api.core.utils import paginate_query, serialize_product, get_image_url

# ----------------- Public Routes -----------------

@products_bp.route('', methods=['GET'])
@limiter.limit("200 per day; 50 per hour")
def get_products():
    query = Product.query
    
    category_filter = request.args.get('category')
    search_query = request.args.get('q') or request.args.get('search')
    from sqlalchemy import or_

    if category_filter:
        query = query.outerjoin(Category, Product.category_id == Category.id)
        query = query.filter(
            or_(
                Category.slug == category_filter,
                db.and_(Product.category_id == None, Product.category == category_filter)
            )
        )
        
    if search_query:
        term = f"%{search_query.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(term),
                Product.description.ilike(term)
            )
        )
        
    query = query.order_by(Product.created_at.desc())
    pagination = paginate_query(query, request)
    serialized_products = [serialize_product(p) for p in pagination.items]

    return jsonify({
        'products': serialized_products,
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total_items': pagination.total,
            'total_pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    })

@products_bp.route('/<int:product_id>', methods=['GET'])
@limiter.limit("200 per day; 50 per hour")
def get_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify(serialize_product(product))

# ----------------- Admin Routes -----------------

@products_bp.route('', methods=['POST'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def create_product():
    data = request.get_json()
    is_valid, errors = validate_product(data)
    if not is_valid:
        return jsonify({"error": "Validation failed", "details": errors}), 400
        
    name = data.get('name')
    price = float(data.get('price'))
    description = data.get('description')
    category = data.get('category')
    category_id = data.get('category_id')
    stock = int(data.get('stock', 0))
    
    resolved_category_id = None
    if category_id is not None:
        category_id = int(category_id)
        cat = db.session.get(Category, category_id)
        if not cat:
            return jsonify({"error": "Validation failed", "details": [{"field": "category_id", "message": "Category not found."}]}), 400
        resolved_category_id = category_id
        
    try:
        product = Product(
            name=name,
            price=price,
            description=description,
            category_id=resolved_category_id,
            category=category if resolved_category_id is None else 'unclassified',
            stock=stock or 0
        )
        db.session.add(product)
        db.session.commit()
        return jsonify(serialize_product(product)), 201
    except Exception as e:
        db.session.rollback()
        if 'UNIQUE constraint failed' in str(e) or 'duplicate key' in str(e):
            return jsonify({"error": "A product with this name already exists. Please choose a unique name."}), 400
        return jsonify({"error": str(e)}), 500

@products_bp.route('/<int:product_id>', methods=['PUT'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def update_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
        
    data = request.get_json()
    is_valid, errors = validate_product(data, is_update=True)
    if not is_valid:
        return jsonify({"error": "Validation failed", "details": errors}), 400
        
    has_category_id = 'category_id' in data
    category_id = data.get('category_id')
    
    resolved_category_id = None
    if has_category_id:
        if category_id is not None:
            category_id = int(category_id)
            cat = db.session.get(Category, category_id)
            if not cat:
                return jsonify({"error": "Validation failed", "details": [{"field": "category_id", "message": "Category not found."}]}), 400
            resolved_category_id = category_id
            
    try:
        if 'name' in data:
            product.name = data['name']
        if 'price' in data:
            product.price = float(data['price'])
        if 'description' in data:
            product.description = data['description']
        if 'stock' in data:
            product.stock = int(data['stock'])
            
        if has_category_id:
            product.category_id = resolved_category_id
        elif 'category' in data:
            product.category = data['category']
            product.category_id = None
            
        db.session.commit()
        return jsonify(serialize_product(product))
    except Exception as e:
        db.session.rollback()
        if 'UNIQUE constraint failed' in str(e) or 'duplicate key' in str(e):
            return jsonify({"error": "A product with this name already exists. Please choose a unique name."}), 400
        return jsonify({"error": str(e)}), 500

@products_bp.route('/<int:product_id>', methods=['DELETE'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def delete_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
        
    try:
        upload_dir = current_app.config['UPLOAD_FOLDER']
        delete_product_helper(db.session, product, upload_dir)
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ----------------- Product-Image Association (Admin) -----------------

@products_bp.route('/<int:product_id>/images/<int:image_id>/primary', methods=['PUT'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def set_primary_image(product_id, image_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
        
    image = db.session.get(ProductImage, image_id)
    if not image or image.product_id != product_id:
        return jsonify({"error": "Image not found or not associated with this product"}), 404
        
    try:
        for img in product.images:
            img.is_primary = False
            
        image.is_primary = True
        product.image_filename = image.filename
        db.session.commit()
        
        # Helper function serialization
        return jsonify({
            'id': image.id,
            'url': get_image_url(image.filename),
            'is_primary': image.is_primary,
            'sort_order': image.sort_order,
            'product_id': image.product_id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@products_bp.route('/<int:product_id>/images', methods=['GET'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def get_product_images(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
        
    images = sorted(product.images, key=lambda x: x.sort_order)
    return jsonify([
        {
            'id': img.id,
            'url': get_image_url(img.filename),
            'is_primary': img.is_primary,
            'sort_order': img.sort_order,
            'product_id': img.product_id
        }
        for img in images
    ])
