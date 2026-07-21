import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingBag, Menu, X, Heart } from 'lucide-react';
import { api } from '@/shared/lib/api';
import { getWishlist } from '@/shared/utils/wishlist';

export default function Navbar({ cartCount, onCartClick, user, onLogout }) {
  const [categories, setCategories] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistCount, setWishlistCount] = useState(() => getWishlist().length);
  const [isWishlistBouncing, setIsWishlistBouncing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    api.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    const handleSync = () => {
      const newCount = getWishlist().length;
      setWishlistCount(prev => {
        if (newCount > prev) {
          setIsWishlistBouncing(true);
          setTimeout(() => setIsWishlistBouncing(false), 450);
        }
        return newCount;
      });
    };
    window.addEventListener('wishlist-updated', handleSync);
    return () => window.removeEventListener('wishlist-updated', handleSync);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/?q=${encodeURIComponent(query)}`);
    } else {
      navigate('/');
    }
    setIsSearchOpen(false);
  };

  // Close menus on page navigation
  const [currentPathname, setCurrentPathname] = useState(location.pathname);
  if (location.pathname !== currentPathname) {
    setCurrentPathname(location.pathname);
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }

  return (
    <>
      {/* Top Notice Banner */}
      <div className="bg-primary text-white text-[10px] md:text-xs font-sans tracking-widest text-center py-2 px-4 uppercase">
        Luminous Elegance — 15% off on select silk collections
      </div>

      <header className="sticky top-0 z-40 bg-background border-b border-surface-container/60 h-20 flex items-center justify-between px-6 md:px-12 relative">
        {/* Left Side: Clickable Menu Button */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="text-on-background hover:text-primary transition-colors flex items-center gap-2 group cursor-pointer focus:outline-hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          <span className="hidden md:inline text-xs font-sans tracking-widest uppercase font-medium">Menu</span>
        </button>

        {/* Center: Brand Logo & Emblem */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <Link to="/" className="flex flex-col items-center group">
            <img 
              src="/diya-logo.png" 
              alt="Diya Logo" 
              className="h-8 md:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
            />
          </Link>
        </div>

        {/* Right Side: Utility Icons */}
        <div className="flex items-center space-x-6">
          {/* Search Trigger */}
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="text-on-background hover:text-primary transition-transform duration-200 hover:scale-110 cursor-pointer focus:outline-hidden"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* User Account / Profile */}
          {user ? (
            <div className="relative group">
              <button 
                className="flex items-center space-x-1 text-on-background hover:text-primary transition-transform duration-200 hover:scale-110 cursor-pointer focus:outline-hidden"
                aria-label="Account Menu"
              >
                <User className="w-5 h-5" />
                <span className="hidden md:inline text-xs font-sans tracking-widest uppercase">{user.full_name.split(' ')[0]}</span>
              </button>
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block z-50">
                <div className="bg-white border border-surface-container shadow-lg">
                  <Link to="/profile" className="block px-4 py-3 text-xs font-sans tracking-widest uppercase hover:bg-surface-container transition-colors text-on-background">
                    My Profile
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="block px-4 py-3 text-xs font-sans tracking-widest uppercase hover:bg-surface-container transition-colors text-on-background border-t border-surface-container">
                      Admin Dashboard
                    </Link>
                  )}
                  <button 
                    onClick={onLogout}
                    className="w-full text-left block px-4 py-3 text-xs font-sans tracking-widest uppercase hover:bg-surface-container transition-colors text-red-600 border-t border-surface-container cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="text-on-background hover:text-primary transition-transform duration-200 hover:scale-110"
              aria-label="Sign In"
            >
              <User className="w-5 h-5" />
            </Link>
          )}

          {/* Wishlist Trigger */}
          <Link 
            to="/wishlist" 
            className="relative text-on-background hover:text-primary transition-transform duration-200 hover:scale-110 cursor-pointer focus:outline-hidden"
            aria-label="Wishlist"
          >
            <Heart className={`w-5 h-5 transition-colors ${wishlistCount > 0 ? 'text-red-500 fill-red-500/20' : ''} ${isWishlistBouncing ? 'animate-heart-pop text-red-500' : ''}`} />
            {wishlistCount > 0 && (
              <span className={`absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center font-bold font-sans rounded-full ${isWishlistBouncing ? 'animate-badge-bounce' : ''}`}>
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Shopping Cart Trigger */}
          <button 
            onClick={onCartClick}
            className="relative text-on-background hover:text-primary transition-transform duration-200 hover:scale-110 cursor-pointer focus:outline-hidden"
            aria-label="Shopping Bag"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center font-bold font-sans">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Floating Search Bar (Smooth slide-down / fade-in animation) */}
        {/* ponytail: nested inside sticky header so it moves/stays with the navbar */}
        <div 
          className={`absolute top-full left-0 w-full bg-white border-b border-surface-container z-30 p-4 shadow-md transition-all duration-300 ease-in-out ${
            isSearchOpen 
              ? 'opacity-100 translate-y-0 pointer-events-auto' 
              : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex items-center border border-primary p-2 bg-white">
            <input 
              type="text" 
              placeholder="Search premium scarves..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full font-sans text-sm focus:outline-hidden px-2 py-1.5"
              autoFocus={isSearchOpen}
            />
            <button type="submit" className="bg-primary text-white text-xs font-sans tracking-widest uppercase px-5 py-2.5 hover:bg-primary-container transition-colors cursor-pointer">
              Search
            </button>
          </form>
        </div>
      </header>

      {/* Side-out Categories Navigation (Left drawer) */}
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-50 bg-black/45 backdrop-blur-xs transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />
      {/* Panel */}
      <div 
        className={`fixed top-0 left-0 bottom-0 z-50 w-80 max-w-full bg-white h-full flex flex-col justify-between p-8 border-r border-surface-container shadow-2xl transition-transform duration-300 ease-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-10 pb-4 border-b border-surface-container/60">
            <span className="text-xs font-sans text-outline uppercase tracking-[0.2em]">Explore Collections</span>
            <button onClick={() => setIsMenuOpen(false)} className="text-on-background hover:text-primary transition-colors cursor-pointer focus:outline-hidden">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <nav className="flex flex-col space-y-5">
            <Link 
              to="/" 
              onClick={() => setIsMenuOpen(false)}
              className="text-base font-serif tracking-wide text-on-background hover:text-primary transition-colors py-1 flex justify-between items-center group"
            >
              <span>Shop All Collections</span>
              <span className="text-xs font-sans text-outline tracking-normal opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </Link>
            
            {categories.map(cat => (
              <Link 
                key={cat.id} 
                to={`/category/${cat.slug}`}
                onClick={() => setIsMenuOpen(false)}
                className="text-base font-serif tracking-wide text-on-background hover:text-primary transition-colors py-1 flex justify-between items-center group"
              >
                <span>{cat.name}</span>
                <span className="text-xs font-sans text-outline tracking-normal opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </Link>
            ))}
            
            <Link 
              to="/wishlist" 
              onClick={() => setIsMenuOpen(false)}
              className="text-xs font-sans tracking-widest text-outline uppercase hover:text-primary transition-colors pt-6 border-t border-surface-container/40 flex justify-between items-center"
            >
              <span>Wishlist ({wishlistCount})</span>
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            </Link>

            <Link 
              to="/our-story" 
              onClick={() => setIsMenuOpen(false)}
              className="text-xs font-sans tracking-widest text-outline uppercase hover:text-primary transition-colors pt-3"
            >
              Our Story
            </Link>
          </nav>
        </div>

        <div className="border-t border-surface-container pt-6 space-y-4">
          {user ? (
            <div className="flex flex-col space-y-3">
              <span className="text-xs font-sans tracking-wider text-outline">
                Signed in as <strong className="text-on-background">{user.full_name}</strong>
              </span>
              <Link 
                to="/profile" 
                onClick={() => setIsMenuOpen(false)}
                className="text-xs font-sans tracking-widest uppercase hover:text-primary transition-colors"
              >
                My Profile
              </Link>
              {user.role === 'admin' && (
                <Link 
                  to="/admin" 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-xs font-sans tracking-widest uppercase hover:text-primary transition-colors"
                >
                  Admin Dashboard
                </Link>
              )}
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  onLogout();
                }}
                className="text-xs font-sans tracking-widest uppercase text-red-600 hover:text-red-700 transition-colors w-full text-left pt-2 border-t border-surface-container/30 cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              onClick={() => setIsMenuOpen(false)}
              className="block text-xs font-sans tracking-widest uppercase hover:text-primary transition-colors"
            >
              Sign In / Register
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
