import { useState, useEffect } from 'react';
import { api } from '@/shared/lib/api';
import { formatPrice } from '@/shared/utils/currency';
import Pagination from '@/shared/components/Pagination';
import { Gift, CheckCircle, Clock, PhoneCall, Copy, Check, Filter } from 'lucide-react';

const PAGE_SIZE = 12;

export default function AdminVouchersManager() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.getAdminVouchers();
        if (active) setVouchers(Array.isArray(data) ? data : []);
      } catch {
        if (active) setErrorMsg('Failed to load voucher orders.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleStatusChange = async (voucherId, newStatus) => {
    setUpdatingId(voucherId);
    try {
      await api.updateVoucherStatus(voucherId, newStatus);
      setVouchers((prev) =>
        prev.map((v) => (v.id === voucherId ? { ...v, status: newStatus } : v))
      );
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredVouchers = vouchers.filter((v) => {
    if (statusFilter === 'all') return true;
    return (v.status || 'pending') === statusFilter;
  });

  return (
    <div className="p-8 max-w-7xl space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest flex items-center gap-2">
            <Gift className="w-6 h-6 text-gold" />
            <span>Voucher Orders Management</span>
          </h1>
          <p className="text-xs font-sans text-outline mt-1">
            Track digital voucher purchases, monitor fulfillment status, and update buyer contact state.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-white border border-surface-container p-1 rounded-xl shadow-xs">
          <Filter className="w-3.5 h-3.5 text-outline ml-2" />
          {['all', 'pending', 'contacted', 'done'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans uppercase font-bold tracking-wider transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-outline hover:text-primary hover:bg-surface-container/30'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 text-xs font-sans rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-surface-container rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="text-xs text-outline py-12 text-center font-sans">Loading voucher orders...</div>
        ) : filteredVouchers.length === 0 ? (
          <div className="text-xs text-outline py-12 text-center font-sans">No voucher orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-surface-container bg-surface text-outline uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Value</th>
                  <th className="py-3.5 px-4">Buyer Info</th>
                  <th className="py-3.5 px-4">Recipient Info</th>
                  <th className="py-3.5 px-4">Message</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/60">
                {(() => {
                  const paginatedVouchers = filteredVouchers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
                  return paginatedVouchers.map((v) => {
                    const currentStatus = v.status || 'pending';
                    const isUpdating = updatingId === v.id;

                    return (
                      <tr key={v.id || v.code} className="hover:bg-surface-container/20 transition-colors">
                        {/* Code */}
                        <td className="py-3.5 px-4 font-mono font-bold text-primary tracking-wider">
                          <div className="flex items-center gap-2">
                            <span>{v.code}</span>
                            <button
                              onClick={() => copyCode(v.code)}
                              className="p-1 text-outline hover:text-primary transition-colors cursor-pointer"
                              title="Copy Code"
                            >
                              {copiedCode === v.code ? (
                                <Check className="w-3.5 h-3.5 text-green-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Value */}
                        <td className="py-3.5 px-4 font-serif font-bold text-on-background">
                          {formatPrice(v.value)}
                        </td>

                        {/* Buyer */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold block text-on-background">{v.buyer_email || 'Guest'}</span>
                        </td>

                        {/* Recipient */}
                        <td className="py-3.5 px-4">
                          {v.recipient_name ? (
                            <div>
                              <span className="font-semibold block text-on-background">{v.recipient_name}</span>
                              {v.recipient_email && (
                                <span className="text-[11px] text-outline block">{v.recipient_email}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-outline italic text-[11px]">Self</span>
                          )}
                        </td>

                        {/* Message */}
                        <td className="py-3.5 px-4 max-w-xs truncate text-outline italic text-[11px]">
                          {v.gift_message ? `"${v.gift_message}"` : '---'}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-outline font-mono text-[11px]">
                          {v.created_at ? new Date(v.created_at).toLocaleDateString() : '---'}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full border ${
                              currentStatus === 'pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : currentStatus === 'contacted'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-green-50 text-green-700 border-green-200'
                            }`}
                          >
                            {currentStatus === 'pending' && <Clock className="w-3 h-3" />}
                            {currentStatus === 'contacted' && <PhoneCall className="w-3 h-3" />}
                            {currentStatus === 'done' && <CheckCircle className="w-3 h-3" />}
                            <span>{currentStatus}</span>
                          </span>
                        </td>

                        {/* Status Action Buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <select
                            disabled={isUpdating}
                            value={currentStatus}
                            onChange={(e) => handleStatusChange(v.id, e.target.value)}
                            className="text-[11px] font-sans font-semibold border border-outline/30 rounded-lg px-2.5 py-1 bg-white text-on-background focus:outline-hidden focus:border-primary cursor-pointer disabled:opacity-50"
                          >
                            <option value="pending">Pending</option>
                            <option value="contacted">Contacted</option>
                            <option value="done">Done</option>
                          </select>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
            {Math.ceil(filteredVouchers.length / PAGE_SIZE) > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredVouchers.length / PAGE_SIZE)}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
