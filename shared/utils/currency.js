export function formatPrice(price) {
  if (price === undefined || price === null) return '';
  const num = Number(price) || 0;
  return `EGP ${Math.round(num).toLocaleString('en-US')}`;
}

export function formatRawPrice(price) {
  if (price === undefined || price === null) return '';
  const num = Number(price) || 0;
  return `EGP ${Math.round(num).toLocaleString('en-US')}`;
}

