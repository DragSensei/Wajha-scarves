import re

SLUG_REGEX = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')

def validate_category(data, is_update=False):
    """
    Validates category input data.
    """
    errors = []
    if not isinstance(data, dict):
        return False, [{"field": "body", "message": "Request body must be a JSON object."}]

    name = data.get('name')
    slug = data.get('slug')
    parent_id = data.get('parent_id')

    if not is_update or 'name' in data:
        if not name or not isinstance(name, str) or not name.strip():
            errors.append({"field": "name", "message": "Category name is required and must be non-empty."})
        elif len(name) > 100:
            errors.append({"field": "name", "message": "Category name must be at most 100 characters."})

    if 'slug' in data and slug:
        if not isinstance(slug, str) or not SLUG_REGEX.match(slug):
            errors.append({"field": "slug", "message": "Slug must match pattern ^[a-z0-9]+(?:-[a-z0-9]+)*$."})
        elif len(slug) > 100:
            errors.append({"field": "slug", "message": "Slug must be at most 100 characters."})

    if 'parent_id' in data and parent_id is not None:
        try:
            int(parent_id)
        except (ValueError, TypeError):
            errors.append({"field": "parent_id", "message": "Parent category ID must be an integer."})

    return len(errors) == 0, errors
