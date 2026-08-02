import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Plus, Edit, Trash2, Users, Award, Search, X, AlertCircle, Eye } from 'lucide-react';
import { api } from '@/shared/lib/api';
import { formatRawPrice } from '@/shared/utils/currency';
import LoyaltyTierCard from '@/shared/components/LoyaltyTierCard';
import Pagination from '@/shared/components/Pagination';

const PAGE_SIZE = 12;

export default function TiersManager() {
  const navigate = useNavigate();
  const [tiers, setTiers] = useState([]);
  const [tierUsers, setTierUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [currentPageTiers, setCurrentPageTiers] = useState(1);
  const [currentPageUsers, setCurrentPageUsers] = useState(1);

  // Search & Filter state for Customer Rankings
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('ALL');
  const [showPreview, setShowPreview] = useState(true);

  // Delete modal state
  const [deletingTier, setDeletingTier] = useState(null);

  // Lock body scroll when delete modal is active
  useEffect(() => {
    if (deletingTier) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [deletingTier]);

  const refetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [resTiers, resUsers] = await Promise.all([
        api.getTiers().catch(() => []),
        api.getTierUsers().catch(() => []),
      ]);
      const sortedTiers = Array.isArray(resTiers)
        ? [...resTiers].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        : [];
      setTiers(sortedTiers);
      setTierUsers(Array.isArray(resUsers) ? resUsers : []);
    } catch {
      setErrorMsg('Failed to load membership tiers data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [resTiers, resUsers] = await Promise.all([
          api.getTiers().catch(() => []),
          api.getTierUsers().catch(() => []),
        ]);
        if (!ignore) {
          const sortedTiers = Array.isArray(resTiers)
            ? [...resTiers].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            : [];
          setTiers(sortedTiers);
          setTierUsers(Array.isArray(resUsers) ? resUsers : []);
          setLoading(false);
        }
      } catch {
        if (!ignore) {
          setErrorMsg('Failed to load membership tiers data.');
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleDelete = async (tierId) => {
    try {
      await api.deleteTier(tierId);
      setSuccessMsg('Tier deleted successfully.');
      setDeletingTier(null);
      await refetchData();
    } catch (err) {

      setErrorMsg(err.message || 'Failed to delete tier.');
      setDeletingTier(null);
    }
  };

  // Helper for tier badge color styling
  const getTierBadgeStyle = (name = '') => {
    const lower = name.toLowerCase();
    if (lower.includes('platinum')) {
      return 'bg-slate-900 text-slate-100 border-slate-700 font-semibold';
    }
    if (lower.includes('gold')) {
      return 'bg-amber-100 text-amber-900 border-amber-300 font-semibold';
    }
    if (lower.includes('silver')) {
      return 'bg-slate-200 text-slate-800 border-slate-300 font-semibold';
    }
    if (lower.includes('bronze')) {
      return 'bg-orange-100 text-orange-900 border-orange-200 font-semibold';
    }
    return 'bg-primary/10 text-primary border-primary/20 font-semibold';
  };

  // Filter customer rankings
  const filteredUsers = tierUsers.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTier =
      filterTier === 'ALL' ||
      (user.tier && user.tier.name.toUpperCase() === filterTier.toUpperCase());

    return matchesSearch && matchesTier;
  });

  const totalPagesTiers = Math.ceil(tiers.length / PAGE_SIZE) || 1;
  const paginatedTiers = tiers.slice((currentPageTiers - 1) * PAGE_SIZE, currentPageTiers * PAGE_SIZE);

  const totalPagesUsers = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;
  const paginatedUsers = filteredUsers.slice((currentPageUsers - 1) * PAGE_SIZE, currentPageUsers * PAGE_SIZE);

  return (
    <div className="p-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest flex items-center gap-2">
            <Crown className="w-6 h-6 text-primary" />
            <span>Membership Tiers Manager</span>
          </h1>
          <p className="text-xs font-sans text-outline mt-1">
            Manage membership tiers, configure lifetime completed-order spend thresholds, and review customer standings.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/tiers/new')}
          className="bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase px-5 py-3 flex items-center space-x-2 font-semibold cursor-pointer transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Tier</span>
        </button>
      </div>

      {/* Status Banners */}
      {successMsg && (
        <div className="p-4 bg-green-50 text-green-800 border border-green-200 text-xs font-sans rounded flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-800 border border-red-200 text-xs font-sans rounded flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-surface-container p-5 flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-sans tracking-widest uppercase text-outline">Total Configured Tiers</div>
            <div className="text-xl font-bold font-serif text-on-background">{tiers.length}</div>
          </div>
        </div>

        <div className="bg-white border border-surface-container p-5 flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-sans tracking-widest uppercase text-outline">Active Customer Accounts</div>
            <div className="text-xl font-bold font-serif text-on-background">{tierUsers.length}</div>
          </div>
        </div>

        <div className="bg-white border border-surface-container p-5 flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-sans tracking-widest uppercase text-outline">Highest Spend Tier</div>
            <div className="text-xl font-bold font-serif text-on-background">
              {tiers.length > 0 ? tiers[tiers.length - 1]?.name : 'None'}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION PREVIEW: Customer Loyalty Cards System Preview */}
      <div className="bg-white border border-surface-container p-6 space-y-4 rounded-lg shadow-xs">
        <div className="flex items-center justify-between border-b pb-3 border-outline/20">
          <h2 className="text-sm font-sans font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <span>Customer Loyalty Cards Design Preview</span>
          </h2>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs font-sans text-outline hover:text-primary cursor-pointer uppercase tracking-wider underline"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>

        {showPreview && (
          <div className="bg-[#faf8f5] p-6 rounded-xl border border-[#e8dfd5]">
            <LoyaltyTierCard tiers={tiers} title="LIVE CUSTOMER TIERS CARD SYSTEM PREVIEW" />
          </div>
        )}
      </div>

      {/* SECTION A: Membership Tiers CRUD Table */}
      <div className="bg-white border border-surface-container p-6 space-y-4">
        <h2 className="text-sm font-sans font-bold uppercase tracking-wider text-primary border-b pb-3 border-outline/20">
          Configured Membership Tiers Hierarchy
        </h2>

        {loading ? (
          <div className="text-xs text-outline py-8 text-center">Loading membership tiers...</div>
        ) : tiers.length === 0 ? (
          <div className="text-xs text-outline py-8 text-center">No membership tiers configured yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-surface-container bg-surface text-outline uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Sort Order</th>
                  <th className="py-3 px-4">Tier Name</th>
                  <th className="py-3 px-4">Min. Spend Threshold</th>
                  <th className="py-3 px-4 text-center">Members Count</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/60">
                {paginatedTiers.map((tier) => {
                  const count = tierUsers.filter(
                    (u) => u.tier && u.tier.id === tier.id
                  ).length;

                  return (
                    <tr key={tier.id} className="hover:bg-surface-container/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-outline">
                        #{tier.sort_order}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 text-[11px] rounded-full border ${getTierBadgeStyle(tier.name)}`}>
                          {tier.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-on-background">
                        {formatRawPrice(tier.spend_threshold)}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-primary">
                        {count} users
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => navigate(`/admin/tiers/${tier.id}/edit`)}
                          className="p-1.5 text-outline hover:text-primary hover:bg-surface-container rounded transition-colors cursor-pointer"
                          title="Edit Tier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingTier(tier)}
                          className="p-1.5 text-outline hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Delete Tier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {totalPagesTiers > 1 && (
              <Pagination
                currentPage={currentPageTiers}
                totalPages={totalPagesTiers}
                onPageChange={setCurrentPageTiers}
              />
            )}
          </div>
        )}
      </div>

      {/* SECTION B: Customer Tier Breakdown & Lifetime Ranking Table */}
      <div className="bg-white border border-surface-container p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-3 border-outline/20">
          <h2 className="text-sm font-sans font-bold uppercase tracking-wider text-primary">
            Customer Lifetime Spend & Tier Standings
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPageUsers(1);
                }}
                className="pl-9 pr-3 py-1.5 text-xs font-sans bg-surface border border-outline/30 rounded focus:outline-hidden focus:border-primary text-on-background"
              />
            </div>

            {/* Filter by Tier */}
            <select
              value={filterTier}
              onChange={(e) => {
                setFilterTier(e.target.value);
                setCurrentPageUsers(1);
              }}
              className="py-1.5 px-3 text-xs font-sans bg-surface border border-outline/30 rounded focus:outline-hidden text-on-background"
            >
              <option value="ALL">All Tiers</option>
              {tiers.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-xs text-outline py-8 text-center">
            No customer ranking data matching the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-surface-container bg-surface text-outline uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Lifetime Completed Spend</th>
                  <th className="py-3 px-4">Assigned Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/60">
                {paginatedUsers.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-surface-container/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-outline">
                      #{(currentPageUsers - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="py-3 px-4 font-medium text-on-background">
                      {user.full_name || 'Anonymous Customer'}
                    </td>
                    <td className="py-3 px-4 text-outline font-mono text-[11px]">
                      {user.email}
                    </td>
                    <td className="py-3 px-4 font-semibold text-on-background">
                      {formatRawPrice(user.lifetime_spend)}
                    </td>
                    <td className="py-3 px-4">
                      {user.tier ? (
                        <span className={`inline-block px-3 py-1 text-[11px] rounded-full border ${getTierBadgeStyle(user.tier.name)}`}>
                          {user.tier.name}
                        </span>
                      ) : (
                        <span className="text-outline italic text-[11px]">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPagesUsers > 1 && (
              <Pagination
                currentPage={currentPageUsers}
                totalPages={totalPagesUsers}
                onPageChange={setCurrentPageUsers}
              />
            )}
          </div>
        )}
      </div>


      {/* DELETE CONFIRMATION MODAL */}
      {deletingTier && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setDeletingTier(null)}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto relative bg-white border border-surface-container p-6 max-w-sm w-full rounded-xl shadow-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center space-x-3 text-red-600">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <h3 className="text-sm font-sans font-bold uppercase tracking-wider">
                  Delete Membership Tier?
                </h3>
              </div>

              <p className="text-xs font-sans text-on-background">
                Are you sure you want to delete tier <strong className="font-bold">{deletingTier.name}</strong>?
                Customers currently assigned to this tier will fall back to their next eligible threshold tier.
              </p>

              <div className="flex justify-end space-x-3 pt-2 border-t border-outline/20">
                <button
                  type="button"
                  onClick={() => setDeletingTier(null)}
                  className="px-4 py-2 text-xs font-sans uppercase tracking-wider text-outline hover:text-on-background cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deletingTier.id)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-sans tracking-widest uppercase px-5 py-2 font-semibold cursor-pointer rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
