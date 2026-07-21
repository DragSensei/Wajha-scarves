import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { api } from '@/shared/lib/api';
import { formatPrice } from '@/shared/utils/currency';
import Pagination from '@/shared/components/Pagination';
import { getWishlist, toggleWishlistId } from '@/shared/utils/wishlist';

const PAGE_SIZE = 12;

export default function WishlistPage({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(getWishlist);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const handleSync = () => setWishlistIds(getWishlist());
    window.addEventListener('wishlist-updated', handleSync);
    return () => window.removeEventListener('wishlist-updated', handleSync);
  }, []);

  useEffect(() => {
    let isMounted = true;
    api.getProducts().then((allProducts) => {
      if (isMounted) {
        setProducts(allProducts || []);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const wishedProducts = products.filter(p => wishlistIds.includes(p.id));
  const totalPages = Math.ceil(wishedProducts.length / PAGE_SIZE) || 1;
  const paginatedWishedProducts = wishedProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleToggleWishlist = (id) => {
    const updated = toggleWishlistId(id);
    setWishlistIds(updated);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48 mb-8"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-4/5 bg-slate-200 rounded-sm"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-surface-container/60">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-primary uppercase font-bold tracking-widest flex items-center gap-3">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <span>Your Wishlist ({wishedProducts.length})</span>
          </h1>
          <p className="text-xs font-sans text-outline mt-1">
            Saved items you love. Add them to your bag anytime.
          </p>
        </div>
        <Link 
          to="/"
          className="text-xs font-sans tracking-widest uppercase text-outline hover:text-primary flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      {wishedProducts.length === 0 ? (
        <div className="text-center py-20 bg-surface-container/10 border border-surface-container/60 rounded-sm">
          <Heart className="w-12 h-12 text-outline/40 mx-auto mb-4" />
          <h2 className="text-xl font-serif text-on-background font-medium mb-2">Your wishlist is empty</h2>
          <p className="text-xs font-sans text-outline mb-6">Heart items while browsing to save them here for later.</p>
          <Link
            to="/"
            className="inline-block bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase px-6 py-3 font-medium transition-colors"
          >
            Explore Scarf Catalog
          </Link>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {paginatedWishedProducts.map((product) => (
              <div key={product.id} className="group relative bg-white border border-surface-container/60 rounded-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="aspect-4/5 overflow-hidden bg-surface-container/20 relative">
                    <Link to={`/product/${product.id}`}>
                      <img 
                        src={product.primary_image_url || 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=800'} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>
                    <button
                      onClick={() => handleToggleWishlist(product.id)}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-xs rounded-full text-red-500 hover:text-red-700 shadow-xs cursor-pointer"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4">
                    <span className="text-[10px] font-sans tracking-widest text-outline uppercase">
                      {product.category || 'Collection'}
                    </span>
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-serif text-sm font-medium text-on-background hover:text-primary transition-colors mt-0.5 line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="mt-2 font-sans font-bold text-xs text-on-background">
                      {formatPrice(product.discounted_price || product.original_price)}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    onClick={() => onAddToCart(product)}
                    className="w-full bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase py-2.5 flex items-center justify-center space-x-2 font-medium cursor-pointer transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Bag</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-12">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
