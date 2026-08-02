ALLOWED_DENOMINATIONS = [100, 200, 500, 1000, 2000]

def validate_voucher_purchase(data):
    errors = {}
    value = data.get('value')
    try:
        val_float = float(value)
        if int(val_float) not in ALLOWED_DENOMINATIONS:
            errors['value'] = f"Denomination must be one of {', '.join(map(str, ALLOWED_DENOMINATIONS))} EGP"
    except (ValueError, TypeError):
        errors['value'] = "Invalid denomination value"

    recipient_email = data.get('recipient_email')
    if recipient_email and '@' not in str(recipient_email):
        errors['recipient_email'] = "Invalid recipient email address"

    buyer_email = data.get('buyer_email')
    if buyer_email and '@' not in str(buyer_email):
        errors['buyer_email'] = "Invalid buyer email address"

    return len(errors) == 0, errors
