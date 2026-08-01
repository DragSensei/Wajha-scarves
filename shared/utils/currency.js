export function formatPrice(price) {
  if (price === undefined || price === null) return '';
  // Convert USD database prices to EGP equivalent (using a multiplier of 42.5)
  const converted = price * 42.5;
  return `EGP ${Math.round(converted).toLocaleString('en-US')}`;
}

export function formatRawPrice(price) {
  if (price === undefined || price === null) return '';
  const num = Number(price) || 0;
  return `EGP ${Math.round(num).toLocaleString('en-US')}`;
}

