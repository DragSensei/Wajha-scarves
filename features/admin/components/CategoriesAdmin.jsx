import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { api } from '@/shared/lib/api';
import Pagination from '@/shared/components/Pagination';

const PAGE_SIZE = 10;

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.getCategories().then((data) => {
      if (isMounted) {
        setCategories(data);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const refetchCategories = async () => {
    setLoading(true);
    const data = await api.getCategories();
    setCategories(data);
    setLoading(false);
  };

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '' });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, slug: cat.slug || '', description: cat.description || '' });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, formData);
      } else {
        await api.createCategory(formData);
      }
      setIsModalOpen(false);
      refetchCategories();
    } catch (err) {
      setErrorMsg(err.message || 'Operation failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setDeleting(true);
    setErrorMsg('');
    try {
      await api.deleteCategory(deletingCategory.id);
      setDeletingCategory(null);
      refetchCategories();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete category.');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(categories.length / PAGE_SIZE) || 1;
  const paginatedCategories = categories.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest">
            Categories Management
          </h1>
          <p className="text-xs font-sans text-outline mt-1">
            Create, update, or remove dynamic storefront categories in real-time.
          </p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase px-4 py-2.5 flex items-center space-x-2 font-medium cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-surface-container overflow-hidden animate-pulse animate-pulse shadow-xs rounded-sm">
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
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-surface-container/60">
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-1/2"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-1/3"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-2/3"></div></td>
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
                <th className="p-4">Category Name</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-outline font-sans">
                    No categories found. Click "Add Category" to create one.
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((c) => (
                  <tr key={c.id} className="border-b border-surface-container/60 hover:bg-surface-container/10 transition-colors">
                    <td className="p-4 font-serif text-sm font-medium text-on-background">{c.name}</td>
                    <td className="p-4 text-outline font-mono text-[11px]">{c.slug}</td>
                    <td className="p-4 text-outline max-w-md truncate">{c.description || '—'}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center space-x-4">
                        <button 
                          onClick={() => handleOpenEditModal(c)}
                          className="text-primary hover:text-primary-container p-1 cursor-pointer" 
                          aria-label="Edit category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setErrorMsg(''); setDeletingCategory(c); }}
                          className="text-red-600 hover:text-red-800 p-1 cursor-pointer" 
                          aria-label="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-lg w-full p-6 shadow-xl border border-surface-container rounded-sm animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-surface-container">
              <h3 className="font-serif text-lg font-bold text-primary uppercase tracking-wider">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-outline hover:text-on-background p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-sans rounded-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-outline font-semibold uppercase tracking-wider mb-1">Category Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Your Birthday Scarf"
                  className="w-full border border-surface-container p-2.5 text-on-background focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-outline font-semibold uppercase tracking-wider mb-1">Slug (URL Path)</label>
                <input 
                  type="text" 
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. your-birthday-scarf (auto-generated if empty)"
                  className="w-full border border-surface-container p-2.5 font-mono text-[11px] text-on-background focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-outline font-semibold uppercase tracking-wider mb-1">Description / Banner Text</label>
                <textarea 
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter category banner text, stories, or promotional details..."
                  className="w-full border border-surface-container p-2.5 text-on-background focus:outline-none focus:border-primary font-sans leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-outline hover:text-on-background font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-primary-container text-white px-6 py-2 uppercase tracking-widest font-semibold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full p-6 shadow-xl border border-surface-container rounded-sm">
            <h3 className="font-serif text-lg font-bold text-red-600 uppercase tracking-wider mb-2">
              Delete Category
            </h3>
            <p className="text-xs font-sans text-on-background leading-relaxed mb-4">
              Are you sure you want to delete <strong className="font-serif">{deletingCategory.name}</strong>? This action cannot be undone.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-sans rounded-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-surface-container text-xs font-sans">
              <button
                type="button"
                onClick={() => { setDeletingCategory(null); setErrorMsg(''); }}
                className="px-4 py-2 text-outline hover:text-on-background font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCategory}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 uppercase tracking-widest font-semibold cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

