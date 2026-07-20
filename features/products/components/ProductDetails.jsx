import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft } from 'lucide-react';
import { api } from '@/shared/lib/api';

export default function ProductDetails({ onAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setLoading(true);
  }

  useEffect(() => {
    api.getProduct(id).then(data => {
      setProduct(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-48">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
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
        {/* Product Images (Full bleed column) */}
        <div>
          <div className="bg-surface-container/40 aspect-4/5 overflow-hidden mb-6 border border-surface-container/60">
            <img 
              src={product.primary_image_url || 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=800'} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-4">
              {product.images.map(img => (
                <div key={img.id} className="w-20 h-24 bg-surface-container/40 overflow-hidden border border-surface-container">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="flex flex-col justify-between">
          <div>
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-serif tracking-wide text-on-background font-medium mb-3">
              {product.name}
            </h1>

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
                    ${product.original_price.toFixed(2)}
                  </span>
                  <span className="text-2xl font-sans font-bold text-primary">
                    ${product.discounted_price.toFixed(2)}
                  </span>
                  <span className="bg-primary-container/20 text-primary text-[10px] font-sans tracking-wider uppercase px-3 py-1 font-bold">
                    Save 15%
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-sans font-bold text-on-background">
                  ${product.original_price.toFixed(2)}
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
