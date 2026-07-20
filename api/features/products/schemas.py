def validate_product(data, is_update=False):
    """
    Validates product input data.
    """
    errors = []
    if not isinstance(data, dict):
        return False, [{"field": "body", "message": "Request body must be a JSON object"}]

    name = data.get('name')
    price = data.get('price')
    stock = data.get('stock')
    category_id = data.get('category_id')

    if not is_update or 'name' in data:
        if not name or not str(name).strip():
            errors.append({"field": "name", "message": "Product name is required"})

    if not is_update or 'price' in data:
        if price is None:
            errors.append({"field": "price", "message": "Price is required"})
        else:
            try:
                price = float(price)
                if price < 0:
                    errors.append({"field": "price", "message": "Price cannot be negative"})
            except (ValueError, TypeError):
                errors.append({"field": "price", "message": "Price must be a valid number"})

    if 'stock' in data and stock is not None:
        try:
            stock = int(stock)
            if stock < 0:
                errors.append({"field": "stock", "message": "Stock cannot be negative"})
        except (ValueError, TypeError):
            errors.append({"field": "stock", "message": "Stock must be a valid integer"})

    if 'category_id' in data and category_id is not None:
        try:
            int(category_id)
        except (ValueError, TypeError):
            errors.append({"field": "category_id", "message": "Category ID must be an integer"})

    return len(errors) == 0, errors
