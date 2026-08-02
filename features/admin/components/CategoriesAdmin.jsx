import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, Folder, Tag } from 'lucide-react';
import { api } from '@/shared/lib/api';
import Pagination from '@/shared/components/Pagination';
import Combobox from '@/shared/components/Combobox';

const PAGE_SIZE = 10;

export default function CategoriesAdmin() {
  const [activeTab, setActiveTab] = useState('subcategories'); // 'groups' | 'subcategories'
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Group Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupFormData, setGroupFormData] = useState({ name: '', slug: '', description: '' });

  // Subcategory Modal State
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [subFormData, setSubFormData] = useState({ name: '', slug: '', description: '', group_id: '' });

  // Delete State
  const [deletingItem, setDeletingItem] = useState(null); // { type: 'group'|'sub', data: obj }
  const [deleting, setDeleting] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [groupsData, catsData] = await Promise.all([
        api.getCategoryGroups(),
        api.getCategories()
      ]);
      setCategoryGroups(groupsData || []);
      setCategories(catsData || []);
    } catch (err) {
      console.error("Error loading categories data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getCategoryGroups(),
      api.getCategories()
    ]).then(([groupsData, catsData]) => {
      if (!isMounted) return;
      setCategoryGroups(groupsData || []);
      setCategories(catsData || []);
      setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  // --- Group Handlers ---
  const handleOpenAddGroupModal = () => {
    setEditingGroup(null);
    setGroupFormData({ name: '', slug: '', description: '' });
    setErrorMsg('');
    setIsGroupModalOpen(true);
  };

  const handleOpenEditGroupModal = (group) => {
    setEditingGroup(group);
    setGroupFormData({ name: group.name, slug: group.slug || '', description: group.description || '' });
    setErrorMsg('');
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);
    try {
      if (editingGroup) {
        await api.updateCategoryGroup(editingGroup.id, groupFormData);
      } else {
        await api.createCategoryGroup(groupFormData);
      }
      setIsGroupModalOpen(false);
      await loadAllData();
    } catch (err) {
      setErrorMsg(err.message || 'Operation failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // --- Subcategory Handlers ---
  const handleOpenAddSubModal = () => {
    setEditingSub(null);
    setSubFormData({ name: '', slug: '', description: '', group_id: '' });
    setErrorMsg('');
    setIsSubModalOpen(true);
  };

  const handleOpenEditSubModal = (cat) => {
    setEditingSub(cat);
    setSubFormData({
      name: cat.name,
      slug: cat.slug || '',
      description: cat.description || '',
      group_id: cat.group_id ? String(cat.group_id) : (cat.parent_id ? String(cat.parent_id) : '')
    });
    setErrorMsg('');
    setIsSubModalOpen(true);
  };

  const handleGroupComboboxChange = async (selectedVal, isNew) => {
    if (isNew) {
      try {
        setSaving(true);
        const newGroup = await api.createCategoryGroup({ name: selectedVal });
        await loadAllData();
        setSubFormData((prev) => ({ ...prev, group_id: String(newGroup.id) }));
      } catch (err) {
        setErrorMsg(err.message || 'Failed to create parent group.');
      } finally {
        setSaving(false);
      }
    } else {
      setSubFormData((prev) => ({ ...prev, group_id: selectedVal ? String(selectedVal) : '' }));
    }
  };

  const handleSaveSubcategory = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);
    const payload = {
      name: subFormData.name,
      slug: subFormData.slug || undefined,
      description: subFormData.description,
      group_id: subFormData.group_id ? parseInt(subFormData.group_id, 10) : null
    };

    try {
      if (editingSub) {
        await api.updateCategory(editingSub.id, payload);
      } else {
        await api.createCategory(payload);
      }
      setIsSubModalOpen(false);
      await loadAllData();
    } catch (err) {
      setErrorMsg(err.message || 'Operation failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // --- Delete Handler ---
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    setErrorMsg('');
    try {
      if (deletingItem.type === 'group') {
        await api.deleteCategoryGroup(deletingItem.data.id);
      } else {
        await api.deleteCategory(deletingItem.data.id);
      }
      setDeletingItem(null);
      await loadAllData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete item.');
    } finally {
      setDeleting(false);
    }
  };

  // Pagination logic
  const currentList = activeTab === 'groups' ? categoryGroups : categories;
  const totalPages = Math.ceil(currentList.length / PAGE_SIZE) || 1;
  const paginatedList = currentList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest">
            Categories & Parent Groups
          </h1>
          <p className="text-xs font-sans text-outline mt-1">
            Organize storefront categories under parent groups (e.g., Accessories, Scarves, Modest Wear) with full CRUD control.
          </p>
        </div>
        <button 
          onClick={activeTab === 'groups' ? handleOpenAddGroupModal : handleOpenAddSubModal}
          className="bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase px-4 py-2.5 flex items-center space-x-2 font-medium cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{activeTab === 'groups' ? 'Add Parent Group' : 'Add Category'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-container mb-6 text-xs font-sans">
        <button
          onClick={() => { setActiveTab('subcategories'); setCurrentPage(1); }}
          className={`pb-3 px-4 font-semibold tracking-wider uppercase border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'subcategories' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-outline hover:text-on-background'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Real Categories ({categories.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab('groups'); setCurrentPage(1); }}
          className={`pb-3 px-4 font-semibold tracking-wider uppercase border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'groups' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-outline hover:text-on-background'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Parent Category Groups ({categoryGroups.length})</span>
        </button>
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="bg-white border border-surface-container overflow-hidden animate-pulse shadow-xs rounded-sm p-8 text-center text-outline">
          Loading catalog management data...
        </div>
      ) : activeTab === 'groups' ? (
        /* PARENT GROUPS TABLE */
        <div className="bg-white border border-surface-container overflow-hidden shadow-xs rounded-sm">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-surface-container/50 border-b border-surface-container uppercase tracking-widest text-[10px] text-outline font-bold">
                <th className="p-4">Parent Group Name</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Child Categories</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-outline font-sans">
                    No parent category groups created yet. Click "Add Parent Group" to create one.
                  </td>
                </tr>
              ) : (
                paginatedList.map((g) => (
                  <tr key={g.id} className="border-b border-surface-container/60 hover:bg-surface-container/10 transition-colors">
                    <td className="p-4 font-serif text-sm font-medium text-on-background flex items-center gap-2">
                      <Folder className="w-4 h-4 text-primary shrink-0" />
                      <span>{g.name}</span>
                    </td>
                    <td className="p-4 text-outline font-mono text-[11px]">{g.slug}</td>
                    <td className="p-4">
                      <span className="bg-surface-container text-on-background font-medium px-2 py-0.5 rounded-full text-[11px]">
                        {g.categories ? g.categories.length : 0} categories
                      </span>
                    </td>
                    <td className="p-4 text-outline max-w-md truncate">{g.description || '—'}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center space-x-4">
                        <button 
                          onClick={() => handleOpenEditGroupModal(g)}
                          className="text-primary hover:text-primary-container p-1 cursor-pointer" 
                          aria-label="Edit parent group"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setErrorMsg(''); setDeletingItem({ type: 'group', data: g }); }}
                          className="text-red-600 hover:text-red-800 p-1 cursor-pointer" 
                          aria-label="Delete parent group"
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
      ) : (
        /* REAL CATEGORIES TABLE */
        <div className="bg-white border border-surface-container overflow-hidden shadow-xs rounded-sm">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-surface-container/50 border-b border-surface-container uppercase tracking-widest text-[10px] text-outline font-bold">
                <th className="p-4">Category Name</th>
                <th className="p-4">Parent Group</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-outline font-sans">
                    No categories found. Click "Add Category" to create one.
                  </td>
                </tr>
              ) : (
                paginatedList.map((c) => (
                  <tr key={c.id} className="border-b border-surface-container/60 hover:bg-surface-container/10 transition-colors">
                    <td className="p-4 font-serif text-sm font-medium text-on-background">{c.name}</td>
                    <td className="p-4">
                      {c.group_name ? (
                        <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-xs text-[11px] font-medium inline-flex items-center gap-1">
                          <Folder className="w-3 h-3" />
                          {c.group_name}
                        </span>
                      ) : (
                        <span className="text-outline/60 italic text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 text-outline font-mono text-[11px]">{c.slug}</td>
                    <td className="p-4 text-outline max-w-md truncate">{c.description || '—'}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center space-x-4">
                        <button 
                          onClick={() => handleOpenEditSubModal(c)}
                          className="text-primary hover:text-primary-container p-1 cursor-pointer" 
                          aria-label="Edit category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setErrorMsg(''); setDeletingItem({ type: 'sub', data: c }); }}
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

      {/* --- Parent Group Add/Edit Modal --- */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-lg w-full p-6 shadow-xl border border-surface-container rounded-sm animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-surface-container">
              <h3 className="font-serif text-lg font-bold text-primary uppercase tracking-wider">
                {editingGroup ? 'Edit Parent Category Group' : 'Add New Parent Category Group'}
              </h3>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-outline hover:text-on-background p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-sans rounded-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveGroup} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-outline font-semibold uppercase tracking-wider mb-1">Group Name</label>
                <input 
                  type="text" 
                  required
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                  placeholder="e.g. Accessories, Scarves, Modest Wear"
                  className="w-full border border-surface-container p-2.5 text-on-background focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-outline font-semibold uppercase tracking-wider mb-1">Slug (URL Path)</label>
                <input 
                  type="text" 
                  value={groupFormData.slug}
                  onChange={(e) => setGroupFormData({ ...groupFormData, slug: e.target.value })}
                  placeholder="e.g. accessories (auto-generated if empty)"
                  className="w-full border border-surface-container p-2.5 font-mono text-[11px] text-on-background focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-outline font-semibold uppercase tracking-wider mb-1">Description / Banner</label>
                <textarea 
                  rows={4}
                  value={groupFormData.description}
                  onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                  placeholder="Parent group description or header details..."
                  className="w-full border border-surface-container p-2.5 text-on-background focus:outline-hidden focus:border-primary font-sans leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 text-outline hover:text-on-background font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-primary-container text-white px-6 py-2 uppercase tracking-widest font-semibold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingGroup ? 'Save Group' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Real Category Add/Edit Modal --- */}
      {isSubModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-lg w-full p-6 shadow-xl border border-surface-container rounded-sm animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-surface-container">
              <h3 className="font-serif text-lg font-bold text-primary uppercase tracking-wider">
                {editingSub ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button onClick={() => setIsSubModalOpen(false)} className="text-outline hover:text-on-background p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-sans rounded-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveSubcategory} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-outline font-semibold uppercase tracking-wider mb-1">Category Name</label>
                <input 
                  type="text" 
                  required
                  value={subFormData.name}
                  onChange={(e) => setSubFormData({ ...subFormData, name: e.target.value })}
                  placeholder="e.g. Silk Scarves, Pins & Magnets"
                  className="w-full border border-surface-container p-2.5 text-on-background focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-outline font-semibold uppercase tracking-wider mb-1">Parent Category Group</label>
                <Combobox
                  options={categoryGroups.map((g) => ({ id: g.id, name: g.name }))}
                  value={subFormData.group_id}
                  onChange={handleGroupComboboxChange}
                  placeholder="Select parent group or type to create new..."
                  allowCreate={true}
                />
              </div>

              <div>
                <label className="block text-outline font-semibold uppercase tracking-wider mb-1">Slug (URL Path)</label>
                <input 
                  type="text" 
                  value={subFormData.slug}
                  onChange={(e) => setSubFormData({ ...subFormData, slug: e.target.value })}
                  placeholder="e.g. silk-scarves (auto-generated if empty)"
                  className="w-full border border-surface-container p-2.5 font-mono text-[11px] text-on-background focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-outline font-semibold uppercase tracking-wider mb-1">Description / Story</label>
                <textarea 
                  rows={4}
                  value={subFormData.description}
                  onChange={(e) => setSubFormData({ ...subFormData, description: e.target.value })}
                  placeholder="Subcategory story or collection banner text..."
                  className="w-full border border-surface-container p-2.5 text-on-background focus:outline-hidden focus:border-primary font-sans leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-4 py-2 text-outline hover:text-on-background font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-primary-container text-white px-6 py-2 uppercase tracking-widest font-semibold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingSub ? 'Save Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation Modal --- */}
      {deletingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full p-6 shadow-xl border border-surface-container rounded-sm">
            <h3 className="font-serif text-lg font-bold text-red-600 uppercase tracking-wider mb-2">
              Delete {deletingItem.type === 'group' ? 'Parent Category Group' : 'Category'}
            </h3>
            <p className="text-xs font-sans text-on-background leading-relaxed mb-4">
              Are you sure you want to delete <strong className="font-serif">{deletingItem.data.name}</strong>? This action cannot be undone.
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
                onClick={() => { setDeletingItem(null); setErrorMsg(''); }}
                className="px-4 py-2 text-outline hover:text-on-background font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
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
