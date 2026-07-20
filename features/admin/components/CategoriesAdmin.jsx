import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { api } from '@/shared/lib/api';
import Pagination from '@/shared/components/Pagination';

const PAGE_SIZE = 12;

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    api.getCategories().then((data) => {
      setCategories(data);
      setLoading(false);
    });
  }, []);

  const totalPages = Math.ceil(categories.length / PAGE_SIZE);
  const paginatedCategories = categories.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest">
          Categories tree
        </h1>
        <button 
          className="bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase px-4 py-2.5 flex items-center space-x-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
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
                <th className="p-4">Category Name</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.map((c) => (
                <tr key={c.id} className="border-b border-surface-container/60 hover:bg-surface-container/10 transition-colors">
                  <td className="p-4 font-serif text-sm font-medium text-on-background">{c.name}</td>
                  <td className="p-4 text-outline font-mono text-[11px]">{c.slug}</td>
                  <td className="p-4 text-outline max-w-xs truncate">{c.description}</td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center space-x-4">
                      <button className="text-primary hover:text-primary-container" aria-label="Edit category">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800" aria-label="Delete category">
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
