import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { api } from '@/shared/lib/api';
import { syncWishlist } from '@/shared/utils/wishlist';

// Shared Components
import Navbar from '@/shared/components/Navbar';
import Footer from '@/shared/components/Footer';
import AboutPage from '@/shared/components/AboutPage';
import DonationPage from '@/shared/components/DonationPage';
import NotificationToast from '@/shared/components/NotificationToast';

// Customer Pages
import Shop from '@/features/products/components/Shop';
import ProductDetails from '@/features/products/components/ProductDetails';
import WishlistPage from '@/features/products/components/WishlistPage';
import CartPage from '@/features/cart/components/CartPage';
import CheckoutPage from '@/features/cart/components/CheckoutPage';
import LoginPage from '@/features/auth/components/LoginPage';
import RegisterPage from '@/features/auth/components/RegisterPage';
import ProfilePage from '@/features/auth/components/ProfilePage';
import BirthdateOnboarding from '@/features/auth/components/BirthdateOnboarding';
import RewardsPanel from '@/features/loyalty/components/RewardsPanel';
import OrderConfirmationPage from '@/features/cart/components/OrderConfirmationPage';
import VoucherPurchasePage from '@/features/vouchers/components/VoucherPurchasePage';
import MyVouchersList from '@/features/vouchers/components/MyVouchersList';

// Admin Components
import Sidebar from '@/features/admin/components/Sidebar';
import AdminNavbar from '@/features/admin/components/AdminNavbar';

// Admin Pages
import Overview from '@/features/admin/components/Overview';
import ProductsAdmin from '@/features/admin/components/ProductsAdmin';
import ProductFormAdmin from '@/features/admin/components/ProductFormAdmin';
import CategoriesAdmin from '@/features/admin/components/CategoriesAdmin';
import UsersAdmin from '@/features/admin/components/UsersAdmin';
import OrdersAdmin from '@/features/admin/components/OrdersAdmin';
import OrderDetailAdmin from '@/features/admin/components/OrderDetailAdmin';
import SettingsAdmin from '@/features/admin/components/SettingsAdmin';
import TiersManager from '@/features/admin/components/TiersManager';
import DonationsManager from '@/features/admin/components/DonationsManager';
import GiftCardsManager from '@/features/admin/components/GiftCardsManager';
import AdminVouchersManager from '@/features/vouchers/components/AdminVouchersManager';


function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isCheckoutRoute = location.pathname === '/checkout' || location.pathname === '/order-confirmation';

  // Automatically scroll to top of window and main scroll container on any route navigation
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  // State management
  const [cartItems, setCartItems] = useState(() => {
    const localCartStr = localStorage.getItem('diya_cart');
    if (localCartStr) {
      try {
        return JSON.parse(localCartStr);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);

  // Helper to map DB cart items to frontend flat product representation
  const mapDbCartToFront = (dbCartItems) => {
    if (!dbCartItems) return [];
    return dbCartItems.map(item => ({
      ...item.product,
      quantity: item.quantity,
      cartItemId: item.id
    }));
  };

  // On Startup: Init CSRF token and fetch logged-in user profile
  useEffect(() => {
    api.initCsrf().then(() => {
      api.getMe({ silent: true })
        .then((data) => {
          if (data && data.user) {
            setUser(data.user);
            syncWishlist();
          } else {
            setUser(null);
          }
        })
        .catch(() => {
          setUser(null);
        });
    });
  }, []);

  // Sync / Load cart items on authentication state changes
  useEffect(() => {
    if (user) {
      // Sync local cart items to DB if any
      const localCartStr = localStorage.getItem('diya_cart');
      if (localCartStr) {
        try {
          const localCart = JSON.parse(localCartStr);
          if (localCart && localCart.length > 0) {
            const formatted = localCart.map(item => ({
              product_id: item.id,
              quantity: item.quantity
            }));
            api.syncCart(formatted)
              .then((dbItems) => {
                setCartItems(mapDbCartToFront(dbItems));
                localStorage.removeItem('diya_cart');
              })
              .catch(() => {
                api.getCart().then(items => setCartItems(mapDbCartToFront(items)));
              });
            return;
          }
        } catch (e) {
          console.error("Error syncing local cart:", e);
        }
      }

      // Default load from DB
      api.getCart()
        .then(items => setCartItems(mapDbCartToFront(items)))
        .catch(() => setCartItems([]));
    } else {
      // Logged out: load from localStorage in microtask
      Promise.resolve().then(() => {
        const localCartStr = localStorage.getItem('diya_cart');
        if (localCartStr) {
          try {
            setCartItems(JSON.parse(localCartStr));
          } catch {
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
      });
    }
  }, [user]);

  const handleAddToCart = async (product) => {
    if (user) {
      try {
        await api.addToCart(product.id, 1);
        const dbItems = await api.getCart();
        setCartItems(mapDbCartToFront(dbItems));
      } catch (err) {
        console.error("Failed to add item to DB cart:", err);
      }
    } else {
      setCartItems((prevItems) => {
        const existing = prevItems.find((i) => i.id === product.id);
        let updated;
        if (existing) {
          updated = prevItems.map((i) => 
            i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        } else {
          updated = [...prevItems, { ...product, quantity: 1 }];
        }
        localStorage.setItem('diya_cart', JSON.stringify(updated));
        return updated;
      });
    }
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    if (user) {
      try {
        await api.updateCart(productId, quantity);
        const dbItems = await api.getCart();
        setCartItems(mapDbCartToFront(dbItems));
      } catch (err) {
        console.error("Failed to update cart item quantity:", err);
      }
    } else {
      setCartItems((prev) => {
        const updated = prev.map((item) => (item.id === productId ? { ...item, quantity } : item));
        localStorage.setItem('diya_cart', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleRemoveItem = async (productId) => {
    if (user) {
      try {
        await api.removeFromCart(productId);
        const dbItems = await api.getCart();
        setCartItems(mapDbCartToFront(dbItems));
      } catch (err) {
        console.error("Failed to delete cart item:", err);
      }
    } else {
      setCartItems((prev) => {
        const updated = prev.filter((item) => item.id !== productId);
        localStorage.setItem('diya_cart', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleClearCart = () => {
    setCartItems([]);
    localStorage.removeItem('diya_cart');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn("Logout request failed:", e);
    }
    setUser(null);
    setCartItems([]);
    localStorage.removeItem('diya_cart');
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    syncWishlist();
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Mandatory Birthdate Gate Check
  const isOnboardingRoute = location.pathname === '/onboarding/birthdate';
  if (user && !user.birth_date && !isAdminRoute && !isOnboardingRoute) {
    return <Navigate to="/onboarding/birthdate" replace />;
  }

  if (isAdminRoute) {
    if (!user || user.role !== 'admin') {
      return <Navigate to="/login" replace />;
    }

    return (
      <div className="flex bg-background h-screen overflow-hidden">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <AdminNavbar user={user} onLogout={handleLogout} />
          <main className="flex-1 bg-surface-container/20 overflow-y-auto">
            <div key={location.pathname} className="animate-admin-view min-h-full">
              <Routes>
                <Route path="/admin" element={<Overview />} />
                <Route path="/admin/products" element={<ProductsAdmin />} />
                <Route path="/admin/products/new" element={<ProductFormAdmin mode="create" />} />
                <Route path="/admin/products/:id/edit" element={<ProductFormAdmin mode="edit" />} />
                <Route path="/admin/products/:id/delete" element={<ProductFormAdmin mode="delete" />} />
                <Route path="/admin/categories" element={<CategoriesAdmin />} />
                <Route path="/admin/users" element={<UsersAdmin />} />
                <Route path="/admin/tiers" element={<TiersManager />} />
                <Route path="/admin/donations" element={<DonationsManager />} />
                <Route path="/admin/gift-cards" element={<GiftCardsManager />} />
                <Route path="/admin/vouchers" element={<AdminVouchersManager />} />
                <Route path="/admin/orders" element={<OrdersAdmin />} />
                <Route path="/admin/orders/:id" element={<OrderDetailAdmin />} />
                <Route path="/admin/settings" element={<SettingsAdmin />} />

                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background">
      {!isCheckoutRoute && (
        <Navbar 
          cartCount={totalCartCount} 
          onCartClick={() => setIsCartOpen(true)} 
          user={user}
          onLogout={handleLogout}
        />
      )}

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Shop onAddToCart={handleAddToCart} />} />
          <Route path="/category/:categorySlug" element={<Shop onAddToCart={handleAddToCart} />} />
          <Route path="/product/:id" element={<ProductDetails onAddToCart={handleAddToCart} />} />
          <Route path="/wishlist" element={<WishlistPage onAddToCart={handleAddToCart} />} />
          <Route path="/checkout" element={<CheckoutPage cartItems={cartItems} onClearCart={handleClearCart} user={user} />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/register" element={<RegisterPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/onboarding/birthdate" element={<BirthdateOnboarding user={user} onUserUpdate={setUser} />} />
          <Route path="/rewards" element={<RewardsPanel user={user} />} />
          <Route path="/vouchers" element={<VoucherPurchasePage user={user} />} />
          <Route path="/profile" element={user ? <ProfilePage user={user} onUserUpdate={setUser} vouchersElement={<MyVouchersList />} /> : <Navigate to="/login" replace />} />
          <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
          <Route path="/our-story" element={<AboutPage />} />
          <Route path="/donation" element={<DonationPage />} />
          <Route path="/donations" element={<DonationPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isCheckoutRoute && <Footer />}

      <NotificationToast />
      <CartPage 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
