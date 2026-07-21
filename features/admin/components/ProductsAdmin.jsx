import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { api } from '@/shared/lib/api';
import Pagination from '@/shared/components/Pagination';
import { formatPrice } from '@/shared/utils/currency';

const PAGE_SIZE = 12;

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest">
            Product Catalog
          </h1>
          <p className="text-xs font-sans text-outline mt-1">
            Manage scarves inventory, prices, stock levels, and store items.
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
                  <tr key={p.id} className="border-b border-surface-container/60 hover:bg-surface-container/10 transition-colors">
                    <td className="p-4 font-serif text-sm font-medium text-on-background">{p.name}</td>
                    <td className="p-4 text-outline">{p.category || 'Uncategorized'}</td>
                    <td className="p-4 text-right font-bold">{formatPrice(p.original_price ?? p.price)}</td>
                    <td className="p-4 text-right">{p.stock} units</td>
                    <td className="p-4 text-center">
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
    </div>
  );
}
