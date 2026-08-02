import { formatHumanErrorMessage, notify } from '@/shared/utils/notifications';

// API Client

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

  // Attach CSRF token to state-mutating requests (POST, PUT, DELETE)
  const method = (fetchOptions.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE'].includes(method)) {
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
      const humanMsg = formatHumanErrorMessage(errData, res.status);
      throw new Error(humanMsg);
    }
    if (res.status === 204) return null;
    return await res.json();
  } catch (error) {
    if (!silent) {
      console.warn(`API Error on ${path}:`, error.message);
      notify.error(error.message);
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
      return [];
    }
  },

  async getProduct(id) {
    try {
      return await request(`/products/${id}`);
    } catch {
      return null;
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
    return await request('/products/wishlist', { silent: true });
  },

  async addToDbWishlist(productId) {
    return await request('/products/wishlist', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
      silent: true,
    });
  },

  async removeFromDbWishlist(productId) {
    return await request(`/products/wishlist/${productId}`, {
      method: 'DELETE',
      body: JSON.stringify({ product_id: productId }),
      silent: true,
    });
  },

  async syncDbWishlist(productIds) {
    return await request('/products/wishlist/sync', {
      method: 'POST',
      body: JSON.stringify({ product_ids: productIds }),
      silent: true,
    });
  },

  // Category Groups (Parent Categories)
  async getCategoryGroups() {
    try {
      return await request('/categories/groups');
    } catch {
      return [];
    }
  },

  async createCategoryGroup(groupData) {
    return await request('/categories/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  },

  async updateCategoryGroup(id, groupData) {
    return await request(`/categories/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(groupData),
    });
  },

  async deleteCategoryGroup(id) {
    return await request(`/categories/groups/${id}`, {
      method: 'DELETE',
    });
  },

  // Categories (Subcategories)
  async getCategories() {
    try {
      return await request('/categories');
    } catch {
      return [];
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
    return await request('/auth/me', { silent: true, ...options });
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
      return {};
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

  async getAdminOrder(orderId) {
    const data = await request(`/orders/${orderId}`);
    return data.order || data;
  },

  async completeOrder(orderId) {
    return await request(`/orders/${orderId}/complete`, {
      method: 'POST',
    });
  },

  async getUsers() {
    return await request('/users');
  },

  async createAdminUser(userData) {
    return await request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateAdminUser(id, userData) {
    return await request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async deleteAdminUser(id) {
    return await request(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Admin Membership Tiers
  async getTiers() {
    try {
      const data = await request('/admin/tiers');
      return data.tiers || [];
    } catch {
      return [
        { id: 1, name: 'Bronze', spend_threshold: 0, sort_order: 1 },
        { id: 2, name: 'Silver', spend_threshold: 2000, sort_order: 2 },
        { id: 3, name: 'Gold', spend_threshold: 5000, sort_order: 3 },
        { id: 4, name: 'Platinum', spend_threshold: 10000, sort_order: 4 },
      ];
    }
  },

  async createTier(tierData) {
    return await request('/admin/tiers', {
      method: 'POST',
      body: JSON.stringify(tierData),
    });
  },

  async updateTier(id, tierData) {
    return await request(`/admin/tiers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tierData),
    });
  },

  async deleteTier(id) {
    return await request(`/admin/tiers/${id}`, {
      method: 'DELETE',
    });
  },

  async getTierUsers() {
    try {
      const data = await request('/admin/tiers/users');
      return data.users || [];
    } catch {
      return [];
    }
  },

  // Admin Donations
  async getDonationSummary(period = '') {
    const q = period ? `?period=${encodeURIComponent(period)}` : '';
    return await request(`/admin/donations/summary${q}`);
  },

  async getDonationHistory() {
    const data = await request('/admin/donations/history');
    return data.history || [];
  },

  async updateDonationStatus(data) {
    return await request('/admin/donations/status', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Gift Cards
  async getGiftCards() {
    const data = await request('/admin/gift-cards');
    return data.gift_cards || [];
  },

  async createGiftCard(cardData) {
    return await request('/admin/gift-cards', {
      method: 'POST',
      body: JSON.stringify(cardData),
    });
  },

  async validateGiftCard(code) {
    return await request('/orders/validate-gift-card', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  // Loyalty & Rewards
  async getLoyaltyTiers() {
    try {
      const data = await request('/loyalty/tiers');
      return data.tiers || [];
    } catch {
      return [{ id: 1, name: 'Bronze', spend_threshold: 0, sort_order: 1 }];
    }
  },

  async getLoyaltyStatus() {
    return await request('/loyalty/status');
  },

  async getLoyaltyProfile() {
    return await this.getLoyaltyStatus();
  },

  async getLoyaltyHistory() {
    const data = await request('/loyalty/history');
    return data.history || [];
  },

  async convertLoyaltyPoints() {
    return await request('/loyalty/convert', {
      method: 'POST',
    });
  },

  // Vouchers
  async buyVoucher(voucherData) {
    return await request('/vouchers/buy', {
      method: 'POST',
      body: JSON.stringify(voucherData),
    });
  },

  async getMyVouchers() {
    const data = await request('/vouchers/my-vouchers');
    return data.vouchers || [];
  },

  async getAdminVouchers() {
    const data = await request('/vouchers/admin');
    return data.vouchers || [];
  },

  async updateVoucherStatus(id, status) {
    return await request(`/vouchers/admin/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
};

