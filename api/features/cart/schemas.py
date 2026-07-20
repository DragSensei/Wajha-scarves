from api.core.utils import EMAIL_REGEX

def validate_checkout(data):
    """
    Validates checkout/order creation input.
    """
    errors = {}
    if not isinstance(data, dict):
        return False, {"error": "Request body must be a JSON object"}

    customer_name = data.get('name')
    customer_email = data.get('email')
    total_amount = data.get('total')

    if not customer_name or not isinstance(customer_name, str) or not customer_name.strip():
        errors['name'] = "Name is required"

    if not customer_email:
        errors['email'] = "Email is required"
    elif not isinstance(customer_email, str) or not EMAIL_REGEX.match(customer_email):
        errors['email'] = "Invalid email format"

    if total_amount is None:
        errors['total'] = "Total amount is required"
    else:
        try:
            val = float(total_amount)
            if val < 0:
                errors['total'] = "Total amount cannot be negative"
        except (ValueError, TypeError):
            errors['total'] = "Total amount must be a number"

    return len(errors) == 0, errors
