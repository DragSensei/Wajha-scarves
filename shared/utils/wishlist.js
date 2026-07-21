import { api } from '@/shared/lib/api';

export function getWishlist() {
  try {
    const saved = localStorage.getItem('diya_wishlist');
    if (!saved) return [];
    let parsed = JSON.parse(saved);
    while (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.wishlist) {
      parsed = parsed.wishlist;
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleWishlistId(id) {
  const current = getWishlist();
  const isAdded = current.includes(id);
  const updated = isAdded 
    ? current.filter(item => item !== id) 
    : [...current, id];
  
  localStorage.setItem('diya_wishlist', JSON.stringify(updated));
  window.dispatchEvent(new Event('wishlist-updated'));

  // Sync to database asynchronously in background if logged in
  (async () => {
    try {
      const me = await api.getMe({ silent: true }).catch(() => null);
      if (me && me.user) {
        if (isAdded) {
          await api.removeFromDbWishlist(id).catch(() => null);
        } else {
          await api.addToDbWishlist(id).catch(() => null);
        }
      }
    } catch {
      // ponytail: silent; only warn on unexpected errors, not 401s
    }
  })();

  return updated;
}

export async function syncWishlist() {
  try {
    const me = await api.getMe({ silent: true }).catch(() => null);
    if (me && me.user) {
      const local = getWishlist();
      const res = await api.syncDbWishlist(local);
      const raw = res?.wishlist;
      const list = Array.isArray(raw) ? raw : (raw?.wishlist || []);
      localStorage.setItem('diya_wishlist', JSON.stringify(list));
      window.dispatchEvent(new Event('wishlist-updated'));
    }
  } catch {
    // ponytail: silent; only warn on unexpected errors
  }
}
