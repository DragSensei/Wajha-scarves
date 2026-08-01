import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { api } from '@/shared/lib/api';
import Pagination from '@/shared/components/Pagination';

const PAGE_SIZE = 12;

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'user',
    phone: '',
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadUsers = () => {
    api.getUsers()
      .then(res => setUsers(res.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    api.getUsers()
      .then(res => { if (active) setUsers(res.users || []); })
      .catch(() => { if (active) setUsers([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedUser(null);
    setForm({
      full_name: '',
      email: '',
      password: '',
      role: 'user',
      phone: '',
      is_active: true
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setForm({
      full_name: user.full_name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'user',
      phone: user.phone || '',
      is_active: user.is_active !== false
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password && form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      if (modalMode === 'create') {
        const payload = {
          full_name: form.full_name,
          email: form.email,
          role: form.role,
          phone: form.phone
        };
        if (form.password) payload.password = form.password;
        await api.createAdminUser(payload);
        setSuccessMsg('User created successfully.');
      } else {
        const payload = {
          full_name: form.full_name,
          email: form.email,
          role: form.role,
          phone: form.phone,
          is_active: form.is_active
        };
        if (form.password) payload.password = form.password;
        await api.updateAdminUser(selectedUser.id, payload);
        setSuccessMsg('User updated successfully.');
      }

      setIsModalOpen(false);
      loadUsers();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save user details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to deactivate/delete user ${user.full_name || user.email}?`)) {
      return;
    }
    try {
      await api.deleteAdminUser(user.id);
      loadUsers();
      setSuccessMsg('User deactivated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
    }
  };

  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  const paginatedUsers = users.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest">
            User Management
          </h1>
          <p className="text-xs font-sans text-outline mt-1">
            Create new accounts, edit roles & details, or deactivate user accounts.
          </p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase px-4 py-2.5 flex items-center space-x-2 font-medium cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add / Create User</span>
        </button>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 text-xs font-sans flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-surface-container overflow-hidden animate-pulse">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-surface-container/50 border-b border-surface-container uppercase tracking-widest text-[10px] text-outline font-bold">
                <th className="p-4">User Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-surface-container/60">
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-1/2"></div></td>
                  <td className="p-4">
                    <div className="h-4 bg-slate-200 rounded w-2/3 mb-1"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  </td>
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-12 mx-auto"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-12 mx-auto"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-surface-container overflow-hidden">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-surface-container/50 border-b border-surface-container uppercase tracking-widest text-[10px] text-outline font-bold">
                <th className="p-4">User Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((u) => (
                <tr key={u.id} className="border-b border-surface-container/60 hover:bg-surface-container/10 transition-colors">
                  <td className="p-4 font-serif text-sm font-medium text-on-background">{u.full_name || u.email}</td>
                  <td className="p-4">
                    <div className="text-outline font-mono text-[11px]">{u.email}</div>
                    {u.phone && <div className="text-[10px] text-outline/80 font-sans">{u.phone}</div>}
                  </td>
                  <td className="p-4 text-outline uppercase tracking-wider text-[10px]">{u.role}</td>
                  <td className="p-4 text-center">
                    <span className={`text-[10px] px-2.5 py-1 tracking-wider uppercase font-bold ${u.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center space-x-4">
                      <button 
                        onClick={() => openEditModal(u)}
                        className="text-primary hover:text-primary-container cursor-pointer" 
                        aria-label="Edit user"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(u)}
                        className="text-red-600 hover:text-red-800 cursor-pointer" 
                        aria-label="Delete user"
                      >
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

      {/* Create / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-surface-container max-w-md w-full p-6 shadow-2xl space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-4 border-surface-container">
              <h2 className="text-lg font-serif text-primary uppercase font-bold tracking-widest">
                {modalMode === 'create' ? 'Create New User' : 'Edit User Profile'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-outline hover:text-on-background cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-sans rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-outline mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full p-2.5 border border-surface-container text-xs focus:outline-hidden"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-outline mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-2.5 border border-surface-container text-xs focus:outline-hidden font-mono"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-outline mb-1">
                  Password {modalMode === 'edit' ? '(Leave blank to keep unchanged)' : '(Optional - generated if empty)'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full p-2.5 border border-surface-container text-xs focus:outline-hidden"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-outline mb-1">User Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full p-2.5 border border-surface-container text-xs focus:outline-hidden bg-white uppercase font-semibold"
                  >
                    <option value="user">Client / Customer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-outline mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full p-2.5 border border-surface-container text-xs focus:outline-hidden"
                    placeholder="+966 5X XXX XXXX"
                  />
                </div>
              </div>

              {modalMode === 'edit' && (
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="cursor-pointer"
                  />
                  <label htmlFor="is_active" className="text-xs text-on-background cursor-pointer uppercase tracking-wider font-semibold">
                    Account Active Status
                  </label>
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t border-surface-container">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary hover:bg-primary-container text-white text-xs uppercase tracking-widest py-3 font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : modalMode === 'create' ? 'Create User' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 border border-surface-container text-xs uppercase tracking-widest py-3 hover:bg-surface-container/50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
