export function formatPrice(price) {
  if (price === undefined || price === null) return '';
  // Convert USD database prices to EGP equivalent (using a multiplier of 42.5)
  const converted = price * 42.5;
  return `EGP ${Math.round(converted).toLocaleString('en-US')}`;
}
