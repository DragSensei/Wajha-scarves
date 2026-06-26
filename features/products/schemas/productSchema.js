export const validateProduct = (product) => {
  const errors = {};
  if (!product.name || typeof product.name !== 'string') {
    errors.name = 'Product name is required and must be a string';
  }
  if (typeof product.price !== 'number' || product.price <= 0) {
    errors.price = 'Product price must be a positive number';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
