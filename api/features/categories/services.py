from api.core.models import Category
from api.core.db import db

def is_descendant(parent_id: int, child_id: int) -> bool:
    """
    Checks if parent_id is a descendant of child_id.
    Traces parent_id upwards to see if we ever hit child_id.
    """
    if parent_id is None or child_id is None:
        return False
        
    current_parent_id = parent_id
    visited = set()
    while current_parent_id is not None:
        if current_parent_id == child_id:
            return True
        if current_parent_id in visited:
            break
        visited.add(current_parent_id)
        parent_cat = db.session.get(Category, current_parent_id)
        if not parent_cat:
            break
        current_parent_id = parent_cat.parent_id
        
    return False

def serialize_category(category) -> dict:
    """
    Serializes a Category model to a dictionary.
    Includes immediate child categories in the 'children' list.
    """
    return {
        'id': category.id,
        'name': category.name,
        'slug': category.slug,
        'description': category.description,
        'parent_id': category.parent_id,
        'children': [
            {
                'id': child.id,
                'name': child.name,
                'slug': child.slug,
                'description': child.description,
                'parent_id': child.parent_id
            }
            for child in category.children
        ]
    }
