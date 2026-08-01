import re
from api.core.utils import EMAIL_REGEX

PHONE_REGEX = re.compile(r'^\+?[0-9\s\-\(\)]+$')

def validate_create_user(data):
    """
    Validates input data for creating a user.
    """
    errors = {}
    if not isinstance(data, dict):
        return False, {"error": "Request body must be a JSON object"}

    email = data.get('email')
    full_name = data.get('full_name')

    if not email:
        errors['email'] = "Email is required"
    elif not isinstance(email, str) or not EMAIL_REGEX.match(email):
        errors['email'] = "Invalid email format"

    if not full_name:
        errors['full_name'] = "Full name is required"
    elif not isinstance(full_name, str) or not full_name.strip():
        errors['full_name'] = "Full name cannot be empty"

    password = data.get('password')
    if password is not None and password != '':
        if not isinstance(password, str) or len(password) < 8 or len(password) > 128:
            errors['password'] = "Password must be between 8 and 128 characters long"

    phone = data.get('phone')
    if phone is not None:
        if not isinstance(phone, str):
            errors['phone'] = "Phone must be a string"
        elif len(phone) > 20:
            errors['phone'] = "Phone cannot exceed 20 characters"
        elif phone.strip() and not PHONE_REGEX.match(phone):
            errors['phone'] = "Invalid phone format"

    role = data.get('role')
    if role is not None:
        if role not in ('admin', 'instructor', 'student', 'user'):
            errors['role'] = "Role must be one of: admin, instructor, student, user"

    return len(errors) == 0, errors


def validate_update_user(data):
    """
    Validates input data for updating a user.
    """
    errors = {}
    if not isinstance(data, dict):
        return False, {"error": "Request body must be a JSON object"}

    allowed_fields = {'email', 'full_name', 'phone', 'password', 'role', 'is_active'}
    provided_fields = set(data.keys()) & allowed_fields

    if not provided_fields:
        return False, {"error": "At least one valid field must be provided for update"}

    email = data.get('email')
    if email is not None:
        if not isinstance(email, str) or not EMAIL_REGEX.match(email):
            errors['email'] = "Invalid email format"

    full_name = data.get('full_name')
    if full_name is not None:
        if not isinstance(full_name, str) or not full_name.strip():
            errors['full_name'] = "Full name cannot be empty"

    password = data.get('password')
    if password is not None and password != '':
        if not isinstance(password, str) or len(password) < 8 or len(password) > 128:
            errors['password'] = "Password must be between 8 and 128 characters long"

    phone = data.get('phone')
    if phone is not None:
        if not isinstance(phone, str):
            errors['phone'] = "Phone must be a string"
        elif len(phone) > 20:
            errors['phone'] = "Phone cannot exceed 20 characters"
        elif phone.strip() and not PHONE_REGEX.match(phone):
            errors['phone'] = "Invalid phone format"

    role = data.get('role')
    if role is not None:
        if role not in ('admin', 'instructor', 'student', 'user'):
            errors['role'] = "Role must be one of: admin, instructor, student, user"

    return len(errors) == 0, errors


def validate_tier_data(data, is_update=False):
    """
    Validates input data for creating or updating a membership tier.
    """
    errors = {}
    if not isinstance(data, dict):
        return False, {"error": "Request body must be a JSON object"}

    if not is_update or 'name' in data:
        name = data.get('name')
        if not name or not isinstance(name, str) or not name.strip():
            errors['name'] = "Tier name is required and cannot be empty"
        elif len(name.strip()) > 50:
            errors['name'] = "Tier name cannot exceed 50 characters"

    if not is_update or 'spend_threshold' in data:
        threshold = data.get('spend_threshold')
        if threshold is None:
            errors['spend_threshold'] = "Spend threshold is required"
        else:
            try:
                val = float(threshold)
                if val < 0:
                    errors['spend_threshold'] = "Spend threshold must be a non-negative number"
            except (ValueError, TypeError):
                errors['spend_threshold'] = "Spend threshold must be a non-negative number"

    if 'sort_order' in data and data['sort_order'] is not None:
        try:
            int(data['sort_order'])
        except (ValueError, TypeError):
            errors['sort_order'] = "Sort order must be an integer"

    return len(errors) == 0, errors

