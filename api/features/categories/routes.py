import re
from flask import jsonify, request
from api.features.categories import categories_bp
from api.core.models import Category, CategoryGroup, Product
from api.core.db import db
from api.core.extensions import limiter
from api.core.decorators import admin_required
from api.core.utils import generate_slug
from api.features.categories.services import is_descendant, serialize_category, serialize_category_group
from api.features.categories.schemas import validate_category, SLUG_REGEX

# Caches for Categories
_CATEGORIES_CACHE = None

def get_categories_tree_cached():
    global _CATEGORIES_CACHE
    if _CATEGORIES_CACHE is None:
        all_cats = Category.query.all()
        name_map = {c.id: c.name for c in all_cats}
        group_name_map = {g.id: g.name for g in CategoryGroup.query.all()}
        cat_map = {c.id: {
            'id': c.id,
            'name': c.name,
            'slug': c.slug,
            'description': c.description,
            'group_id': c.group_id,
            'group_name': group_name_map.get(c.group_id) if c.group_id else name_map.get(c.parent_id),
            'parent_id': c.parent_id,
            'parent_name': name_map.get(c.parent_id),
            'children': []
        } for c in all_cats}
        
        for c in all_cats:
            if c.parent_id and c.parent_id in cat_map:
                cat_map[c.parent_id]['children'].append(cat_map[c.id])
                
        _CATEGORIES_CACHE = cat_map
    return _CATEGORIES_CACHE

def invalidate_categories_cache():
    global _CATEGORIES_CACHE
    _CATEGORIES_CACHE = None

# ---------------- Category Group (Parent Categories) CRUD ----------------

@categories_bp.route('/groups', methods=['GET'])
@limiter.limit("200 per day; 50 per hour")
def get_category_groups():
    groups = CategoryGroup.query.order_by(CategoryGroup.name.asc()).all()
    return jsonify([serialize_category_group(g) for g in groups])

@categories_bp.route('/groups', methods=['POST'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def create_category_group():
    data = request.get_json() or {}
    name = data.get('name')
    description = data.get('description')
    slug = data.get('slug')

    if not name or not isinstance(name, str) or not name.strip():
        return jsonify({"error": "Validation failed", "details": [{"field": "name", "message": "Parent category name is required."}]}), 400

    name = name.strip()
    if not slug:
        slug = generate_slug(name)

    existing_name = CategoryGroup.query.filter_by(name=name).first()
    if existing_name:
        return jsonify({"error": "Conflict", "message": "A parent category group with this name already exists."}), 409

    try:
        group = CategoryGroup(name=name, slug=slug, description=description)
        db.session.add(group)
        db.session.commit()
        invalidate_categories_cache()
        return jsonify(serialize_category_group(group)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@categories_bp.route('/groups/<int:group_id>', methods=['PUT'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def update_category_group(group_id):
    group = db.session.get(CategoryGroup, group_id)
    if not group:
        return jsonify({"error": "Parent category group not found"}), 404

    data = request.get_json() or {}
    name = data.get('name')
    description = data.get('description')
    slug = data.get('slug')

    if 'name' in data:
        if not name or not isinstance(name, str) or not name.strip():
            return jsonify({"error": "Validation failed", "details": [{"field": "name", "message": "Name cannot be empty."}]}), 400
        name = name.strip()
        if name != group.name:
            existing = CategoryGroup.query.filter(CategoryGroup.name == name, CategoryGroup.id != group_id).first()
            if existing:
                return jsonify({"error": "Conflict", "message": "A parent category group with this name already exists."}), 409
            group.name = name
            if 'slug' not in data:
                group.slug = generate_slug(name)

    if 'slug' in data and data['slug']:
        group.slug = data['slug']

    if 'description' in data:
        group.description = description

    try:
        db.session.commit()
        invalidate_categories_cache()
        return jsonify(serialize_category_group(group))
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@categories_bp.route('/groups/<int:group_id>', methods=['DELETE'])
@admin_required
@limiter.limit("200 per day; 50 per hour")
def delete_category_group(group_id):
    group = db.session.get(CategoryGroup, group_id)
    if not group:
        return jsonify({"error": "Parent category group not found"}), 404

    try:
        # Unlink child categories
        for cat in group.categories:
            cat.group_id = None
        db.session.delete(group)
        db.session.commit()
        invalidate_categories_cache()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ---------------- Category (Subcategories) CRUD ----------------

@categories_bp.route('', methods=['GET'])
@limiter.limit("200 per day; 50 per hour")
def get_categories():
    parent_id_val = request.args.get('parent_id')
    cat_map = get_categories_tree_cached()
    
    if parent_id_val is not None:
        if parent_id_val.lower() in ('null', 'none', ''):
            results = [data for data in cat_map.values() if data['parent_id'] is None and data['group_id'] is None]
        else:
            try:
                p_id = int(parent_id_val)
                parent_data = cat_map.get(p_id)
                results = parent_data['children'] if parent_data else []
            except ValueError:
                return jsonify({"error": "parent_id must be an integer"}), 400
    else:
        results = list(cat_map.values())
        
    return jsonify(results)

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
    group_id = data.get('group_id')
    parent_id = data.get('parent_id')
    slug = data.get('slug')
    
    if not slug and name:
        slug = generate_slug(name)
            
    if parent_id is not None:
        parent_id = int(parent_id)
        parent_cat = db.session.get(Category, parent_id)
        if not parent_cat:
            return jsonify({"error": "Validation failed", "details": [{"field": "parent_id", "message": "Parent category not found."}]}), 400

    if group_id is not None:
        group_id = int(group_id)
        grp = db.session.get(CategoryGroup, group_id)
        if not grp:
            return jsonify({"error": "Validation failed", "details": [{"field": "group_id", "message": "Parent category group not found."}]}), 400
        
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
            group_id=group_id,
            parent_id=parent_id
        )
        db.session.add(new_cat)
        db.session.commit()
        invalidate_categories_cache()
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
        if 'group_id' in data:
            category.group_id = int(data['group_id']) if data['group_id'] is not None else None
        if 'parent_id' in data:
            category.parent_id = int(data['parent_id']) if data['parent_id'] is not None else None
            
        db.session.commit()
        invalidate_categories_cache()
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
        invalidate_categories_cache()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
