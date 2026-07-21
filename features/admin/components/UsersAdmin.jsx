import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { api } from '@/shared/lib/api';
import Pagination from '@/shared/components/Pagination';

const PAGE_SIZE = 12;

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    api.getUsers()
      .then(res => setUsers(res.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  const paginatedUsers = users.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest">
          User Management
        </h1>
        <button 
          className="bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase px-4 py-2.5 flex items-center space-x-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Invite User</span>
        </button>
      </div>

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
                    <span className="bg-green-100 text-green-700 text-[10px] px-2.5 py-1 tracking-wider uppercase font-bold">
                      {u.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center space-x-4">
                      <button className="text-primary hover:text-primary-container" aria-label="Edit user">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800" aria-label="Delete user">
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
