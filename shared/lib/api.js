import { PRODUCTS, CATEGORIES, SETTINGS } from '@/shared/utils/mockData';

const BASE_URL = '/api';
let csrfToken = null;

async function fetchCsrfToken() {
  try {
    const res = await fetch(`${BASE_URL}/csrf-token`);
    if (res.ok) {
      const data = await res.json();
      csrfToken = data.csrf_token;
    }
  } catch (error) {
    console.warn('Could not fetch CSRF token:', error.message);
  }
}

async function request(path, options = {}) {
  const { silent = false, ...fetchOptions } = options;
  const url = `${BASE_URL}${path}`;
  fetchOptions.headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };
  fetchOptions.credentials = 'include'; // support httponly cookie sessions

  // Attach CSRF token for mutations
  const method = (fetchOptions.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    if (!csrfToken) {
      await fetchCsrfToken();
    }
    if (csrfToken) {
      fetchOptions.headers['X-CSRFToken'] = csrfToken;
    }
  }

  try {
    const res = await fetch(url, fetchOptions);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Request failed with status ${res.status}`);
    }
    if (res.status === 204) return null;
    return await res.json();
  } catch (error) {
    if (!silent) {
      console.warn(`API Error on ${path}:`, error.message);
    }
    throw error;
  }
}

export const api = {
  // CSRF Initialization
  async initCsrf() {
    await fetchCsrfToken();
  },

  // Products
  async getProducts(categorySlug = '', search = '') {
    try {
      const params = new URLSearchParams();
      if (categorySlug) params.append('category', categorySlug);
      if (search) params.append('q', search);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const data = await request(`/products${queryString}`);
      return data.products;
    } catch {
      let list = PRODUCTS;
      if (categorySlug) {
        list = list.filter(p => p.category_slug === categorySlug);
      }
      if (search) {
        const lower = search.toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(lower) || (p.description && p.description.toLowerCase().includes(lower)));
      }
      return list;
    }
  },

  async getProduct(id) {
    try {
      return await request(`/products/${id}`);
    } catch {
      return PRODUCTS.find(p => p.id === Number(id)) || null;
    }
  },

  async createProduct(productData) {
    return await request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  async updateProduct(id, productData) {
    return await request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  async deleteProduct(id) {
    return await request(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  async uploadProductImage(file, productId = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (productId) formData.append('product_id', productId);

    if (!csrfToken) {
      await fetchCsrfToken();
    }
    
    const headers = {};
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    const res = await fetch(`${BASE_URL}/admin/images/upload`, {
      method: 'POST',
      body: formData,
      headers,
      credentials: 'include'
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Upload failed with status ${res.status}`);
    }
    return await res.json();
  },

  async setPrimaryImage(productId, imageId) {
    return await request(`/products/${productId}/images/${imageId}/primary`, {
      method: 'PUT',
    });
  },

  async getDbWishlist() {
    return await request('/wishlist', { silent: true });
  },

  async addToDbWishlist(productId) {
    return await request('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
      silent: true,
    });
  },

  async removeFromDbWishlist(productId) {
    return await request(`/wishlist/${productId}`, {
      method: 'DELETE',
      body: JSON.stringify({ product_id: productId }),
      silent: true,
    });
  },

  async syncDbWishlist(productIds) {
    return await request('/wishlist/sync', {
      method: 'POST',
      body: JSON.stringify({ product_ids: productIds }),
      silent: true,
    });
  },

  // Categories
  async getCategories() {
    try {
      return await request('/categories');
    } catch {
      return CATEGORIES;
    }
  },

  async createCategory(categoryData) {
    return await request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  async updateCategory(id, categoryData) {
    return await request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  async deleteCategory(id) {
    return await request(`/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Checkout & Orders
  async createOrder(orderData) {
    return await request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async getMyOrders() {
    return await request('/orders/my-orders');
  },

  // Database-Backed Cart CRUD
  async getCart() {
    return await request('/cart');
  },

  async addToCart(productId, quantity = 1) {
    return await request('/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    });
  },

  async updateCart(productId, quantity) {
    return await request(`/cart/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  async removeFromCart(productId) {
    return await request(`/cart/${productId}`, {
      method: 'DELETE',
    });
  },

  async syncCart(items) {
    // items: [{ product_id, quantity }]
    return await request('/cart/sync', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },

  // Authentication
  async login(email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    // Re-fetch CSRF token upon successful login session change
    await fetchCsrfToken();
    return data;
  },

  async register(registerData) {
    return await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registerData),
    });
  },

  async logout() {
    const data = await request('/auth/logout', {
      method: 'POST',
    });
    csrfToken = null; // Clear token on logout
    return data;
  },

  async getMe(options = {}) {
    return await request('/auth/me', options);
  },


  async updateProfile(profileData) {
    return await request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Settings
  async getSettings() {
    try {
      return await request('/settings');
    } catch {
      return SETTINGS;
    }
  },

  async updateSettings(settingsData) {
    return await request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  },

  // Admin Operations
  async getAdminOrders() {
    return await request('/orders');
  },

  async completeOrder(orderId) {
    return await request(`/orders/${orderId}/complete`, {
      method: 'POST',
    });
  },

  async getUsers() {
    return await request('/users');
  }
};
