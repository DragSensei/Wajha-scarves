import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { X, Heart } from 'lucide-react';
import { api } from '@/shared/lib/api';
import { formatPrice } from '@/shared/utils/currency';
import { getWishlist, toggleWishlistId } from '@/shared/utils/wishlist';

export default function Shop({ onAddToCart }) {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = categorySlug || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [wishlist, setWishlist] = useState(getWishlist);
  const [animatingId, setAnimatingId] = useState(null);

  useEffect(() => {
    const handleSync = () => setWishlist(getWishlist());
    window.addEventListener('wishlist-updated', handleSync);
    return () => window.removeEventListener('wishlist-updated', handleSync);
  }, []);

  const toggleWishlist = (id) => {
    setAnimatingId(id);
    setTimeout(() => setAnimatingId(null), 450);
    const updated = toggleWishlistId(id);
    setWishlist(updated);
  };

  const isWishlisted = (id) => Array.isArray(wishlist) && wishlist.includes(id);

  const [prevCategoryKey, setPrevCategoryKey] = useState(`${selectedCategory}:${searchQuery}`);
  const currentCategoryKey = `${selectedCategory}:${searchQuery}`;
  if (currentCategoryKey !== prevCategoryKey) {
    setPrevCategoryKey(currentCategoryKey);
    setLoading(true);
  }

  useEffect(() => {
    Promise.all([
      api.getProducts(selectedCategory, searchQuery),
      api.getCategories()
    ]).then(([productsData, categoriesData]) => {
      setProducts(productsData);
      setCategories(categoriesData);
      setLoading(false);
    });
  }, [selectedCategory, searchQuery]);

  const activeCategory = categories.find(c => c.slug === selectedCategory);
  let heroTitle = activeCategory ? activeCategory.name : "The Luminous Collection";
  let heroDescription = activeCategory && activeCategory.description 
    ? activeCategory.description 
    : "Inspired by the spiritual concept of 'An-Nur' (The Light). Our editorial collection wraps you in serene luxury, featuring organic silks and lightweight double-loop chiffons.";

  if (searchQuery) {
    heroTitle = `Search: "${searchQuery}"`;
    heroDescription = `Showing results for "${searchQuery}".`;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      {/* Editorial Hero Banner */}
      <div className="bg-surface-container py-20 px-8 text-center mb-16 relative overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-serif tracking-widest text-primary uppercase font-bold mb-4">
          {heroTitle}
        </h1>
        <div className="max-w-3xl mx-auto space-y-4 text-sm font-sans leading-relaxed text-outline">
          {heroDescription.split('\n\n').map((paragraph, index) => (
            <p 
              key={index} 
              className={paragraph.startsWith('•') ? 'text-primary font-medium bg-surface-container/50 p-3 rounded border-l-2 border-primary text-left text-xs md:text-sm' : ''}
            >
              {paragraph}
            </p>
          ))}
        </div>
        {searchQuery && (
          <button
            onClick={() => navigate(selectedCategory ? `/category/${selectedCategory}` : '/')}
            className="mt-6 inline-flex items-center gap-2 text-xs font-sans tracking-widest uppercase bg-primary text-white px-4 py-2 hover:bg-primary-container transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" /> Clear Search
          </button>
        )}
      </div>



      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 md:gap-8 gap-y-12">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col animate-pulse">
              <div className="aspect-[3/4] w-full bg-slate-200 mb-4 rounded-xs"></div>
              <div className="space-y-2 px-2 text-center flex flex-col items-center">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 md:gap-8 gap-y-12">
          {products.map((product) => {
            const altImage = product.images?.find(img => img.url !== product.primary_image_url)?.url;
            const hoverImage = altImage || product.primary_image_url;
            const isSameImage = !altImage;

            return (
              <div 
                key={product.id} 
                className="card__container flex flex-col group relative"
              >
                {/* Image Container Box (no outer card borders or padding) */}
                <div className="card__picture-container relative w-full aspect-[3/4] overflow-hidden bg-surface-container-low mb-4">
                  <Link to={`/product/${product.id}`} className="card card--center block w-full h-full">
                    <img 
                      src={product.primary_image_url || 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=600'} 
                      alt={product.name}
                      className="card__img w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {hoverImage && (
                      <img 
                        src={hoverImage} 
                        alt={`${product.name} alternate`}
                        className={`card__img--hover ${isSameImage ? 'scale-x-[-1]' : ''}`}
                      />
                    )}
                    
                    {/* Sold Out / Discount Badges */}
                    {product.stock <= 0 ? (
                      <div className="card__badges absolute top-4 left-4 z-10">
                        <div className="card__badges--item bg-surface-container text-outline text-[10px] font-sans tracking-widest uppercase px-3 py-1 font-bold" data-custom-badge="sold-out">
                          Sold out
                        </div>
                      </div>
                    ) : product.discount_active ? (
                      <div className="card__badges absolute top-4 left-4 z-10">
                        <div className="card__badges--item bg-primary text-white text-[10px] font-sans tracking-widest uppercase px-3 py-1 font-bold">
                          Sale
                        </div>
                      </div>
                    ) : null}
                  </Link>

                  {/* Wishlist Button Overlay */}
                  <div className="xb-wishlist-button-collection absolute top-4 right-4 z-10">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xs text-outline hover:text-primary transition-colors cursor-pointer"
                      aria-label={`Toggle wishlist for ${product.name}`}
                    >
                      <Heart 
                        className={`w-[18px] h-[18px] transition-all duration-300 ${
                          isWishlisted(product.id) ? 'fill-red-500 text-red-500' : 'text-outline hover:text-red-400'
                        } ${animatingId === product.id ? 'animate-heart-pop' : ''}`} 
                      />
                    </button>
                  </div>

                  {/* Desktop Quick-Add Button overlay (slides up/fades in on hover) */}
                  <div className="card__quick-add-container--desktop">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onAddToCart(product);
                      }}
                      disabled={product.stock <= 0}
                      className="w-full bg-white/90 backdrop-blur-xs text-on-surface font-sans text-[11px] font-bold tracking-widest py-3 uppercase border border-outline-variant hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {product.stock > 0 ? 'Add to bag' : 'Sold out'}
                    </button>
                  </div>
                </div>

                {/* Centered Name and Price underneath */}
                <Link to={`/product/${product.id}`} className="text-center px-2 block mt-1 hover:no-underline">
                  <h3 className="card__title font-serif text-sm font-semibold text-on-background group-hover:text-primary transition-colors duration-300 mb-2 leading-snug">
                    {product.name}
                  </h3>
                  <div className="card__price text-xs font-sans text-outline tracking-wider">
                    {product.discount_active ? (
                      <div className="flex justify-center items-center space-x-2">
                        <span className="line-through text-[11px] text-outline/70">
                          {formatPrice(product.original_price)}
                        </span>
                        <span className="font-bold text-primary">
                          {formatPrice(product.discounted_price)}
                        </span>
                      </div>
                    ) : (
                      <span>{formatPrice(product.original_price)}</span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
