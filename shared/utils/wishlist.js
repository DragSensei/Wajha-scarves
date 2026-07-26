import { api } from '@/shared/lib/api';

export function getWishlist() {
  try {
    const saved = localStorage.getItem('diya_wishlist');
    if (!saved) return [];
    let parsed = JSON.parse(saved);
    while (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.wishlist) {
      parsed = parsed.wishlist;
    }
    if (!Array.isArray(parsed)) return [];
    
    // Normalize IDs to numbers if numeric, remove invalid/falsy
    const filtered = parsed
      .map(id => {
        if (id === null || id === undefined || id === '') return null;
        const num = Number(id);
        return isNaN(num) ? String(id) : num;
      })
      .filter(id => id !== null);

    // Deduplicate preserving numbers
    const unique = [];
    const seen = new Set();
    for (const item of filtered) {
      const key = String(item);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }

    if (unique.length !== parsed.length || JSON.stringify(unique) !== saved) {
      localStorage.setItem('diya_wishlist', JSON.stringify(unique));
    }
    return unique;
  } catch {
    return [];
  }
}

export function hasWishlistId(list, id) {
  if (!Array.isArray(list) || id === null || id === undefined) return false;
  const targetStr = String(id);
  return list.some(item => String(item) === targetStr);
}

export function toggleWishlistId(id) {
  if (id === null || id === undefined) return getWishlist();
  const current = getWishlist();
  const targetStr = String(id);
  const isAdded = current.some(item => String(item) === targetStr);
  
  const updated = isAdded 
    ? current.filter(item => String(item) !== targetStr) 
    : [...current, typeof id === 'number' ? id : (isNaN(Number(id)) ? id : Number(id))];
  
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
      // ponytail: silent
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
      const normalized = list.map(i => isNaN(Number(i)) ? i : Number(i));
      localStorage.setItem('diya_wishlist', JSON.stringify(normalized));
      window.dispatchEvent(new Event('wishlist-updated'));
    }
  } catch {
    // ponytail: silent
  }
}
