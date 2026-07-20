import re
from flask import jsonify, request
from api.features.categories import categories_bp
from api.core.models import Category, Product
from api.core.db import db
from api.core.extensions import limiter
from api.core.decorators import admin_required
from api.core.utils import generate_slug
from api.features.categories.services import is_descendant, serialize_category
from api.features.categories.schemas import validate_category, SLUG_REGEX

@categories_bp.route('', methods=['GET'])
@limiter.limit("200 per day; 50 per hour")
def get_categories():
    parent_id_val = request.args.get('parent_id')
    if parent_id_val is not None:
        if parent_id_val.lower() in ('null', 'none', ''):
            query = Category.query.filter(Category.parent_id == None)
        else:
            try:
                query = Category.query.filter(Category.parent_id == int(parent_id_val))
            except ValueError:
                return jsonify({"error": "parent_id must be an integer"}), 400
    else:
        query = Category.query
        
    categories = query.all()
    return jsonify([serialize_category(c) for c in categories])

@categories_bp.route('', methods=['POST'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def create_category():
    data = request.get_json()
    is_valid, errors = validate_category(data)
    if not is_valid:
        return jsonify({"error": "Validation failed", "details": errors}), 400
        
    name = data.get('name')
    description = data.get('description')
    parent_id = data.get('parent_id')
    slug = data.get('slug')
    
    if not slug and name:
        slug = generate_slug(name)
            
    if parent_id is not None:
        parent_id = int(parent_id)
        parent_cat = db.session.get(Category, parent_id)
        if not parent_cat:
            return jsonify({"error": "Validation failed", "details": [{"field": "parent_id", "message": "Parent category not found."}]}), 400
        
    # Uniqueness checks
    existing_name = Category.query.filter_by(name=name).first()
    if existing_name:
        return jsonify({"error": "Conflict", "message": "A category with this name already exists."}), 409
        
    existing_slug = Category.query.filter_by(slug=slug).first()
    if existing_slug:
        return jsonify({"error": "Conflict", "message": "A category with this slug already exists."}), 409
        
    try:
        new_cat = Category(
            name=name,
            slug=slug,
            description=description,
            parent_id=parent_id
        )
        db.session.add(new_cat)
        db.session.commit()
        return jsonify(serialize_category(new_cat)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@categories_bp.route('/<int:category_id>', methods=['PUT'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def update_category(category_id):
    category = db.session.get(Category, category_id)
    if not category:
        return jsonify({"error": "Category not found"}), 404
        
    data = request.get_json()
    is_valid, errors = validate_category(data, is_update=True)
    if not is_valid:
        return jsonify({"error": "Validation failed", "details": errors}), 400
        
    name = data.get('name')
    slug = data.get('slug')
    description = data.get('description')
    parent_id = data.get('parent_id')
    
    if 'parent_id' in data and parent_id is not None:
        parent_id = int(parent_id)
        if parent_id == category_id:
            return jsonify({"error": "Validation failed", "details": [{"field": "parent_id", "message": "A category cannot be its own parent."}]}), 400
        
        parent_cat = db.session.get(Category, parent_id)
        if not parent_cat:
            return jsonify({"error": "Validation failed", "details": [{"field": "parent_id", "message": "Parent category not found."}]}), 400
        elif is_descendant(parent_id, category_id):
            return jsonify({"error": "Validation failed", "details": [{"field": "parent_id", "message": "Cycle detected: parent category is a descendant of this category."}]}), 400
        
    # Uniqueness checks (excluding self)
    if 'name' in data and name != category.name:
        existing_name = Category.query.filter(Category.name == name, Category.id != category_id).first()
        if existing_name:
            return jsonify({"error": "Conflict", "message": "A category with this name already exists."}), 409
            
    if 'name' in data and 'slug' not in data:
        slug = generate_slug(name)
    elif 'slug' in data:
        slug = slug
    else:
        slug = None
        
    if slug:
        existing_slug = Category.query.filter(Category.slug == slug, Category.id != category_id).first()
        if existing_slug:
            return jsonify({"error": "Conflict", "message": "A category with this slug already exists."}), 409
            
    try:
        if 'name' in data:
            category.name = name
        if slug:
            category.slug = slug
        if 'description' in data:
            category.description = description
        if 'parent_id' in data:
            category.parent_id = parent_id
            
        db.session.commit()
        return jsonify(serialize_category(category))
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@categories_bp.route('/<int:category_id>', methods=['DELETE'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def delete_category(category_id):
    category = db.session.get(Category, category_id)
    if not category:
        return jsonify({"error": "Category not found"}), 404
        
    # Check if category has any children
    if category.children:
        return jsonify({"error": "Cannot delete category that is in use."}), 409
        
    # Check if category has any associated products
    product_in_use = Product.query.filter_by(category_id=category_id).first()
    if product_in_use:
        return jsonify({"error": "Cannot delete category that is in use."}), 409
        
    try:
        db.session.delete(category)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
