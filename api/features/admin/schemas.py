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
    if password is not None:
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
        if role not in ('admin', 'instructor', 'student'):
            errors['role'] = "Role must be one of: admin, instructor, student"

    return len(errors) == 0, errors


def validate_update_user(data):
    """
    Validates input data for updating a user.
    """
    errors = {}
    if not isinstance(data, dict):
        return False, {"error": "Request body must be a JSON object"}

    allowed_fields = {'email', 'full_name', 'phone', 'password', 'role'}
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
    if password is not None:
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
        if role not in ('admin', 'instructor', 'student'):
            errors['role'] = "Role must be one of: admin, instructor, student"

    return len(errors) == 0, errors
