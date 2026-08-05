import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, X, Tag, Package, DollarSign } from 'lucide-react';
import { api } from '@/shared/lib/api';
import Pagination from '@/shared/components/Pagination';
import { formatPrice } from '@/shared/utils/currency';

const PAGE_SIZE = 12;

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    let isMounted = true;
    api.getProducts().then((data) => {
      if (isMounted) {
        setProducts(data || []);
        setLoading(false);
      }
    }).catch((err) => {
      console.warn('Failed to load products:', err);
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const totalPages = Math.ceil(products.length / PAGE_SIZE) || 1;
  const paginatedProducts = products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const imagesToDisplay = selectedProduct ? (
    selectedProduct.images && selectedProduct.images.length > 0 
      ? selectedProduct.images 
      : selectedProduct.primary_image_url 
        ? [{ id: 'primary', url: selectedProduct.primary_image_url, is_primary: true }]
        : []
  ) : [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest">
            Product Catalog
          </h1>
          <p className="text-xs font-sans text-outline mt-1">
            Manage scarves inventory, prices, stock levels, and store items. Click any row to view full details.
          </p>
        </div>
        <Link 
          to="/admin/products/new"
          className="bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase px-4 py-2.5 flex items-center space-x-2 font-medium cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </Link>
      </div>

      {loading ? (
        <div className="bg-white border border-surface-container overflow-hidden animate-pulse shadow-xs rounded-sm">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-surface-container/50 border-b border-surface-container uppercase tracking-widest text-[10px] text-outline font-bold">
                <th className="p-4">Product Name</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Price</th>
                <th className="p-4 text-right">Stock</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-surface-container/60">
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-2/3"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-1/2"></div></td>
                  <td className="p-4 text-right"><div className="h-4 bg-slate-200 rounded w-12 ml-auto"></div></td>
                  <td className="p-4 text-right"><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-12 mx-auto"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-surface-container overflow-hidden shadow-xs rounded-sm">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-surface-container/50 border-b border-surface-container uppercase tracking-widest text-[10px] text-outline font-bold">
                <th className="p-4">Product Name</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Price</th>
                <th className="p-4 text-right">Stock</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-outline font-sans">
                    No products found. Click "Add Product" to create one.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => (
                  <tr 
                    key={p.id} 
                    onClick={() => setSelectedProduct(p)}
                    className="border-b border-surface-container/60 hover:bg-surface-container/20 transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-serif text-sm font-medium text-on-background">{p.name}</td>
                    <td className="p-4 text-outline">{p.category || 'Uncategorized'}</td>
                    <td className="p-4 text-right font-bold">{formatPrice(p.original_price ?? p.price)}</td>
                    <td className="p-4 text-right">{p.stock} units</td>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center space-x-4">
                        <Link 
                          to={`/admin/products/${p.id}/edit`}
                          className="text-primary hover:text-primary-container p-1 cursor-pointer" 
                          aria-label="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <Link 
                          to={`/admin/products/${p.id}/delete`}
                          className="text-red-600 hover:text-red-800 p-1 cursor-pointer" 
                          aria-label="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-sm shadow-xl border border-surface-container p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-outline hover:text-on-background p-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6 pr-8">
              <h2 className="text-xl font-serif font-bold text-primary uppercase tracking-wide">
                {selectedProduct.name}
              </h2>
              {selectedProduct.category && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-surface-container/60 text-outline rounded-xs flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {selectedProduct.category}
                </span>
              )}
            </div>

            {/* Images Grid */}
            <div className="mb-6">
              <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-outline mb-3">
                Product Images ({imagesToDisplay.length})
              </h3>
              {imagesToDisplay.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {imagesToDisplay.map((img, idx) => (
                    <div key={img.id || idx} className="relative aspect-square border border-surface-container rounded-xs overflow-hidden bg-slate-50 group">
                      <img 
                        src={img.url} 
                        alt={`${selectedProduct.name} ${idx + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      {img.is_primary && (
                        <span className="absolute bottom-1 left-1 bg-primary text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs shadow-xs">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 border border-dashed border-surface-container text-center text-xs text-outline rounded-xs">
                  No images uploaded for this product.
                </div>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-xs font-sans">
              <div className="bg-surface-container/20 p-3 rounded-xs flex items-center space-x-3">
                <DollarSign className="w-4 h-4 text-primary" />
                <div>
                  <span className="text-outline uppercase text-[10px] font-bold tracking-wider block">Price</span>
                  <span className="font-bold text-sm">{formatPrice(selectedProduct.original_price ?? selectedProduct.price)}</span>
                </div>
              </div>
              <div className="bg-surface-container/20 p-3 rounded-xs flex items-center space-x-3">
                <Package className="w-4 h-4 text-primary" />
                <div>
                  <span className="text-outline uppercase text-[10px] font-bold tracking-wider block">Stock Level</span>
                  <span className="font-bold text-sm">{selectedProduct.stock} units</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedProduct.description && (
              <div className="mb-6 text-xs font-sans">
                <h3 className="font-bold uppercase tracking-widest text-outline text-[10px] mb-2">Description</h3>
                <p className="text-on-background/80 leading-relaxed whitespace-pre-line bg-surface-container/10 p-3 rounded-xs">
                  {selectedProduct.description}
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-surface-container">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 text-xs font-sans uppercase tracking-widest border border-surface-container hover:bg-surface-container/30 font-medium"
              >
                Close
              </button>
              <Link 
                to={`/admin/products/${selectedProduct.id}/edit`}
                className="bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase px-4 py-2 flex items-center space-x-2 font-bold cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Product</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

