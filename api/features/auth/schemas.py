from api.core.utils import EMAIL_REGEX

def validate_register(data):
    """
    Validates input data for registration.
    Returns (is_valid, errors_dict)
    """
    errors = {}
    if not isinstance(data, dict):
        return False, {"error": "Request body must be a JSON object"}

    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    role = data.get('role', 'student')

    if not email:
        errors['email'] = "Email is required"
    elif not isinstance(email, str) or not EMAIL_REGEX.match(email):
        errors['email'] = "Invalid email format"

    if not password:
        errors['password'] = "Password is required"
    elif not isinstance(password, str) or len(password) < 8:
        errors['password'] = "Password must be at least 8 characters long"

    if not full_name:
        errors['full_name'] = "Full name is required"
    elif not isinstance(full_name, str) or not full_name.strip():
        errors['full_name'] = "Full name cannot be empty"

    if role not in ('admin', 'instructor', 'student'):
        errors['role'] = "Role must be one of: admin, instructor, student"

    phone = data.get('phone')
    if phone and not isinstance(phone, str):
        errors['phone'] = "Phone must be a string"

    return len(errors) == 0, errors


def validate_login(data):
    """
    Validates input data for login.
    """
    errors = {}
    if not isinstance(data, dict):
        return False, {"error": "Request body must be a JSON object"}

    email = data.get('email')
    password = data.get('password')

    if not email:
        errors['email'] = "Email is required"
    if not password:
        errors['password'] = "Password is required"

    return len(errors) == 0, errors
