import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, Heart } from 'lucide-react';
import { api } from '@/shared/lib/api';
import { formatPrice } from '@/shared/utils/currency';
import { getWishlist, toggleWishlistId } from '@/shared/utils/wishlist';
import ProductImageGallery from './ProductImageGallery';

export default function ProductDetails({ onAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);

  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setLoading(true);
  }

  useEffect(() => {
    api.getProduct(id).then(data => {
      setProduct(data);
      setLoading(false);
      if (data) {
        setIsWishlisted(getWishlist().includes(data.id));
      }
    });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 animate-pulse">
        {/* Back navigation skeleton */}
        <div className="h-4 bg-slate-200 rounded w-24 mb-12"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Images column skeleton */}
          <div>
            <div className="bg-slate-200 aspect-4/5 w-full mb-6 rounded-sm"></div>
            <div className="flex gap-4">
              <div className="w-20 h-24 bg-slate-200 rounded-sm"></div>
              <div className="w-20 h-24 bg-slate-200 rounded-sm"></div>
              <div className="w-20 h-24 bg-slate-200 rounded-sm"></div>
            </div>
          </div>

          {/* Info column skeleton */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="h-8 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-8 bg-slate-200 rounded w-1/4 mt-8"></div>
              <div className="h-20 bg-slate-200 rounded w-full mt-6"></div>
            </div>
            <div className="h-12 bg-slate-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h2 className="text-2xl font-serif text-primary mb-4">Product Not Found</h2>
        <Link to="/" className="text-sm font-sans tracking-widest uppercase border-b border-primary text-primary">
          Back to Shop
        </Link>
      </div>
    );
  }


  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      {/* Back navigation */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center space-x-2 text-xs font-sans tracking-widest uppercase text-outline hover:text-primary mb-12"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to collection</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Product Images */}
        <ProductImageGallery 
          images={product.images} 
          primaryImageUrl={product.primary_image_url} 
          productName={product.name} 
        />

        {/* Product Information */}
        <div className="flex flex-col justify-between">
          <div>
            {/* Title & Wishlist Button */}
            <div className="flex items-center justify-between gap-4 mb-3">
              <h1 className="text-3xl md:text-4xl font-serif tracking-wide text-on-background font-medium">
                {product.name}
              </h1>
              <button
                type="button"
                onClick={() => {
                  setIsHeartAnimating(true);
                  setTimeout(() => setIsHeartAnimating(false), 450);
                  const updated = toggleWishlistId(product.id);
                  setIsWishlisted(updated.includes(product.id));
                }}
                className="p-3.5 rounded-full bg-surface-container/30 hover:bg-surface-container/60 transition-colors cursor-pointer border border-surface-container/60 shrink-0"
                aria-label="Toggle Wishlist"
              >
                <Heart className={`w-5 h-5 transition-all duration-300 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-outline hover:text-red-400'} ${isHeartAnimating ? 'animate-heart-pop' : ''}`} />
              </button>
            </div>

            {/* Category */}
            <div className="text-xs font-sans tracking-widest text-outline uppercase mb-6">
              Collection: {product.category}
            </div>

            {/* Ratings */}
            <div className="flex items-center space-x-2 mb-8 text-primary">
              <div className="flex">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 text-outline" />
              </div>
              <span className="text-xs text-outline font-sans">(12 customer reviews)</span>
            </div>

            {/* Price */}
            <div className="mb-8">
              {product.discount_active ? (
                <div className="flex items-center space-x-4">
                  <span className="text-base font-sans line-through text-outline">
                    {formatPrice(product.original_price)}
                  </span>
                  <span className="text-2xl font-sans font-bold text-primary">
                    {formatPrice(product.discounted_price)}
                  </span>
                  <span className="bg-primary-container/20 text-primary text-[10px] font-sans tracking-wider uppercase px-3 py-1 font-bold">
                    Save 15%
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-sans font-bold text-on-background">
                  {formatPrice(product.original_price)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm font-sans leading-relaxed text-outline mb-10">
              {product.description}
            </p>

            {/* Inventory status */}
            <div className="mb-8 flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs font-sans tracking-wider uppercase text-outline">
                {product.stock > 0 ? `${product.stock} items in stock` : 'Out of stock'}
              </span>
            </div>

            {/* Add to Cart button */}
            <button
              onClick={() => onAddToCart(product)}
              disabled={product.stock <= 0}
              className={`w-full bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase py-4 transition-colors font-medium ${
                product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {product.stock > 0 ? 'Add to bag' : 'Sold out'}
            </button>
          </div>

          {/* Details Tabs / Accordion */}
          <div className="mt-12 border-t border-surface-container pt-8">
            <div className="flex space-x-8 mb-6 border-b border-surface-container/60 pb-3">
              <button 
                onClick={() => setActiveTab('details')}
                className={`text-xs font-sans tracking-widest uppercase pb-2 transition-all ${
                  activeTab === 'details' ? 'border-b-2 border-primary text-primary font-bold' : 'text-outline'
                }`}
              >
                Details
              </button>
              <button 
                onClick={() => setActiveTab('care')}
                className={`text-xs font-sans tracking-widest uppercase pb-2 transition-all ${
                  activeTab === 'care' ? 'border-b-2 border-primary text-primary font-bold' : 'text-outline'
                }`}
              >
                Care Instructions
              </button>
            </div>

            {activeTab === 'details' ? (
              <div className="text-xs font-sans text-outline leading-relaxed space-y-2">
                <p>• Premium fabric weight designed for all-season breathability.</p>
                <p>• Rectangular wrap dimensions: 180cm x 75cm.</p>
                <p>• Hand-finished stitching borders ensuring maximum longevity.</p>
              </div>
            ) : (
              <div className="text-xs font-sans text-outline leading-relaxed space-y-2">
                <p>• Hand wash gently in lukewarm water using a pH-neutral silk wash.</p>
                <p>• Do not wring or twist. Roll in a towel to absorb excess moisture.</p>
                <p>• Dry flat away from direct sunlight.</p>
                <p>• Iron on low heat settings on the reverse side while slightly damp.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
