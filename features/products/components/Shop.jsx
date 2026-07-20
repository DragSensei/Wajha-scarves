import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Star, X } from 'lucide-react';
import { api } from '@/shared/lib/api';

export default function Shop({ onAddToCart }) {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = categorySlug || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <p className="max-w-2xl mx-auto text-sm font-sans leading-relaxed text-outline whitespace-pre-line">
          {heroDescription}
        </p>
        {searchQuery && (
          <button
            onClick={() => navigate(selectedCategory ? `/category/${selectedCategory}` : '/')}
            className="mt-6 inline-flex items-center gap-2 text-xs font-sans tracking-widest uppercase bg-primary text-white px-4 py-2 hover:bg-primary-container transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" /> Clear Search
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-4 mb-12 border-b border-surface-container/60 pb-6">
        <button
          onClick={() => navigate('/')}
          className={`text-xs font-sans tracking-widest uppercase py-2 px-4 transition-all ${
            selectedCategory === '' 
              ? 'border-b-2 border-primary text-primary font-bold' 
              : 'text-outline hover:text-primary'
          }`}
        >
          All Collections
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate(`/category/${cat.slug}`)}
            className={`text-xs font-sans tracking-widest uppercase py-2 px-4 transition-all ${
              selectedCategory === cat.slug 
                ? 'border-b-2 border-primary text-primary font-bold' 
                : 'text-outline hover:text-primary'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => {
            const altImage = product.images?.find(img => img.url !== product.primary_image_url)?.url;
            const isSameImage = !altImage;
            const hoverImage = altImage || product.primary_image_url;

            return (
              <div 
                key={product.id} 
                onClick={() => navigate(`/product/${product.id}`)}
                className="card group relative flex flex-col justify-between bg-white border border-surface-container/40 p-4 transition-all hover:shadow-lg cursor-pointer"
              >
                {/* Product Image */}
                <div className="card__picture-container relative aspect-4/5 overflow-hidden mb-6 bg-surface-container/40">
                  <img 
                    src={product.primary_image_url || 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=600'} 
                    alt={product.name}
                    className="card__img w-full h-full object-cover"
                  />
                  <img 
                    src={hoverImage || product.primary_image_url || 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=600'} 
                    alt={`${product.name} alternate`}
                    className={`card__img--hover ${isSameImage ? 'invert' : ''}`}
                  />
                  {product.discount_active && (
                    <span className="absolute top-4 right-4 bg-primary text-white text-[10px] font-sans tracking-wider uppercase px-3 py-1 font-bold z-10">
                      Sale
                    </span>
                  )}
                  {/* Desktop Quick-Add Button (Slides up) */}
                  <div className="card__quick-add-container--desktop">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(product);
                      }}
                      className="w-full bg-white/95 backdrop-blur-xs text-primary hover:bg-primary hover:text-white text-xs font-sans tracking-widest uppercase py-3 transition-colors font-medium shadow-md cursor-pointer border border-primary/20"
                    >
                      Quick Add
                    </button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="text-center flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-serif tracking-wide text-on-background font-medium mb-2 hover:text-primary transition-colors">
                      <Link to={`/product/${product.id}`}>{product.name}</Link>
                    </h3>
                    
                    {/* Category Label */}
                    <div className="text-[10px] font-sans tracking-widest text-outline uppercase mb-3">
                      {product.category}
                    </div>

                    {/* Ratings */}
                    <div className="flex justify-center items-center space-x-1 mb-4 text-primary">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 text-outline" />
                      <span className="text-[10px] text-outline font-sans pl-1">(12)</span>
                    </div>
                  </div>

                  {/* Price and Action */}
                  <div>
                    <div className="mb-4">
                      {product.discount_active ? (
                        <div className="flex justify-center items-center space-x-2">
                          <span className="text-xs font-sans line-through text-outline">
                            ${product.original_price.toFixed(2)}
                          </span>
                          <span className="text-sm font-sans font-bold text-primary">
                            ${product.discounted_price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-sans font-bold text-on-background">
                          ${product.original_price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Mobile/Tablet Quick Add Button (hidden on desktop) */}
                    <div className="min-[900px]:hidden">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                        className="w-full bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase py-3 transition-colors font-medium"
                      >
                        Quick Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
