import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { api } from '@/shared/lib/api';
import Pagination from '@/shared/components/Pagination';

const PAGE_SIZE = 12;

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    api.getProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const paginatedProducts = products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest">
          Product Catalog
        </h1>
        <button 
          className="bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase px-4 py-2.5 flex items-center space-x-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="bg-white border border-surface-container overflow-hidden">
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
              {paginatedProducts.map((p) => (
                <tr key={p.id} className="border-b border-surface-container/60 hover:bg-surface-container/10 transition-colors">
                  <td className="p-4 font-serif text-sm font-medium text-on-background">{p.name}</td>
                  <td className="p-4 text-outline">{p.category}</td>
                  <td className="p-4 text-right font-bold">${p.original_price.toFixed(2)}</td>
                  <td className="p-4 text-right">{p.stock} units</td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center space-x-4">
                      <button className="text-primary hover:text-primary-container" aria-label="Edit product">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800" aria-label="Delete product">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
