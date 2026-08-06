import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Heart, ShieldCheck, Gift, Award, ChevronRight } from 'lucide-react';
import { api } from '@/shared/lib/api';
import { formatPrice } from '@/shared/utils/currency';
import { getWishlist, toggleWishlistId, hasWishlistId } from '@/shared/utils/wishlist';

export default function LandingPage() {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState(getWishlist);
  const [animatingId, setAnimatingId] = useState(null);

  useEffect(() => {
    const handleSync = () => setWishlist(getWishlist());
    window.addEventListener('wishlist-updated', handleSync);
    return () => window.removeEventListener('wishlist-updated', handleSync);
  }, []);

  useEffect(() => {
    api.getProducts()
      .then((data) => {
        setFeaturedProducts((data || []).slice(0, 4));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleWishlist = (id) => {
    setAnimatingId(id);
    setTimeout(() => setAnimatingId(null), 450);
    const updated = toggleWishlistId(id);
    setWishlist(updated);
  };

  const isWishlisted = (id) => hasWishlistId(wishlist, id);

  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-primary/20 selection:text-primary">
      {/* 1. Hero Section - Persuade Surface */}
      <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden bg-on-background text-white px-6 py-20">
        {/* Atmospheric Background Image & Gradient Overlays */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=1920" 
            alt="Diya Luxury Scarves Background" 
            className="w-full h-full object-cover object-center opacity-35 scale-105 animate-pulse transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-on-background via-on-background/70 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        </div>

        {/* Hero Content Box */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 animate-admin-view">
          {/* Subtle Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/40 bg-primary/10 backdrop-blur-md text-primary-container text-xs font-sans tracking-[0.25em] uppercase font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-primary-container" />
            <span>The Couture Scarves Atelier</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif tracking-wide font-bold leading-tight text-white drop-shadow-sm">
            Elegance Woven with <br className="hidden sm:inline" />
            <span className="italic text-primary-container font-serif">Purpose &amp; Grace</span>
          </h1>

          {/* Subheading (No silk references) */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg font-sans text-surface-container/90 font-light leading-relaxed tracking-wide">
            Discover exquisite handcrafted scarves, premium chiffons, modal drapes, and modest couture essentials designed for the modern woman of poise.
          </p>

          {/* Dual Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/shop')}
              className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-sans text-xs font-bold tracking-[0.2em] uppercase hover:bg-primary-container transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg flex items-center justify-center gap-3 cursor-pointer group"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => navigate('/our-story')}
              className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/40 text-white font-sans text-xs font-bold tracking-[0.2em] uppercase hover:bg-white hover:text-on-background transition-all duration-300 cursor-pointer"
            >
              Our Story &amp; Craft
            </button>
          </div>
        </div>
      </section>

      {/* 2. Brand Pillars / Values */}
      <section className="py-16 md:py-24 border-b border-surface-container/60 bg-surface-container/20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Pillar 1 */}
          <div className="flex flex-col items-center text-center p-8 bg-white border border-surface-container shadow-xs space-y-4 hover:border-primary/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-on-background tracking-wide">
              Artisan Craftsmanship
            </h3>
            <p className="text-xs font-sans text-outline leading-relaxed">
              Ethically sourced chiffon, modal drapes, and breathable premium jerseys woven to flawless couture perfection.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="flex flex-col items-center text-center p-8 bg-white border border-surface-container shadow-xs space-y-4 hover:border-primary/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-on-background tracking-wide">
              Effortless Modest Poise
            </h3>
            <p className="text-xs font-sans text-outline leading-relaxed">
              Designed with precision lengths and non-slip finishes so your silhouette remains comfortable and poised all day.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="flex flex-col items-center text-center p-8 bg-white border border-surface-container shadow-xs space-y-4 hover:border-primary/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <Heart className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-serif font-bold text-on-background tracking-wide">
              Giving Back With Purpose
            </h3>
            <p className="text-xs font-sans text-outline leading-relaxed">
              Every purchase funds non-profit initiatives supporting education and healthcare for women and children in need.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Curated Lookbook Showcase (Matching Collection Card Hover Effect Exactly) */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-surface-container pb-6 gap-4">
          <div>
            <span className="text-xs font-sans text-primary tracking-[0.2em] uppercase font-bold">Lookbook Spotlight</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-on-background mt-2">
              Featured Flagship Pieces
            </h2>
          </div>
          <button
            onClick={() => navigate('/shop')}
            className="inline-flex items-center gap-2 text-xs font-sans font-bold tracking-[0.15em] uppercase text-primary hover:text-primary-container transition-colors cursor-pointer group"
          >
            <span>View Full Shop Catalog</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 md:gap-8 gap-y-12">
            {featuredProducts.map((product) => {
              const altImage = product.images?.find(img => img.url !== product.primary_image_url)?.url;
              const hoverImage = altImage || product.primary_image_url;
              const isSameImage = !altImage;

              return (
                <div 
                  key={product.id} 
                  className="card__container flex flex-col group relative"
                >
                  {/* Image Container Box using identical Collection styles */}
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
                      
                      {/* Sold Out / Sale Badges */}
                      {product.stock <= 0 ? (
                        <div className="card__badges absolute top-4 left-4 z-10">
                          <div className="card__badges--item bg-surface-container text-outline text-[10px] font-sans tracking-widest uppercase px-3 py-1 font-bold">
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

                    {/* Desktop Quick-Add / Quick-View Slide-up Container */}
                    <div className="card__quick-add-container--desktop">
                      <Link
                        to={`/product/${product.id}`}
                        className="block text-center w-full bg-white/90 backdrop-blur-xs text-on-surface font-sans text-[11px] font-bold tracking-widest py-3 uppercase border border-outline-variant hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 cursor-pointer"
                      >
                        View Product
                      </Link>
                    </div>
                  </div>

                  {/* Centered Name & Price underneath */}
                  <Link to={`/product/${product.id}`} className="text-center px-2 block mt-1 hover:no-underline">
                    <h3 className="card__title font-serif text-sm font-semibold text-on-background group-hover:text-primary transition-colors duration-300 mb-2 leading-snug">
                      {product.name}
                    </h3>
                    <div className="card__price text-xs font-sans tracking-wider">
                      {product.discount_active ? (
                        <div className="flex justify-center items-center space-x-2">
                          <span className="line-through text-[11px] text-outline/70">
                            {formatPrice(product.original_price)}
                          </span>
                          <span className="font-bold text-rose-600">
                            {formatPrice(product.discounted_price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-outline">{formatPrice(product.original_price)}</span>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Diya Rewards & Gift Cards Banner */}
      <section className="bg-primary text-white py-16 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-3 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-xs font-sans tracking-widest uppercase">
              <Gift className="w-3.5 h-3.5 text-secondary-container" />
              <span>Diya Privilege Club</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold">
              Unlock Exclusive Rewards &amp; Gift Vouchers
            </h2>
            <p className="text-sm font-sans text-white/80 max-w-xl">
              Join Diya Rewards to earn points on every purchase, enjoy birthday treats, and share digital vouchers with loved ones.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/rewards"
              className="px-6 py-3 bg-white text-primary text-xs font-sans font-bold tracking-widest uppercase hover:bg-surface-container transition-colors shadow-xs"
            >
              Explore Diya Rewards
            </Link>
            <Link
              to="/vouchers"
              className="px-6 py-3 bg-transparent border border-white/50 text-white text-xs font-sans font-bold tracking-widest uppercase hover:bg-white/10 transition-colors"
            >
              Digital Vouchers
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Final CTA to Store */}
      <section className="py-24 px-6 text-center bg-surface-container/30 border-t border-surface-container">
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="text-xs font-sans text-primary tracking-[0.2em] uppercase font-bold">
            Start Shopping
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-on-background">
            Ready to Find Your Perfect Scarf?
          </h2>
          <p className="text-sm font-sans text-outline leading-relaxed max-w-xl mx-auto">
            Browse our full catalog of handcrafted scarves, inner caps, accessories, and new seasonal arrivals.
          </p>
          <div className="pt-4">
            <button
              onClick={() => navigate('/shop')}
              className="px-10 py-4 bg-on-background text-white font-sans text-xs font-bold tracking-[0.2em] uppercase hover:bg-primary transition-all duration-300 shadow-xl cursor-pointer inline-flex items-center gap-3 group"
            >
              <span>Enter Storefront</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
// ponytail: lazy component reusing existing collection styles & wishlist utils
