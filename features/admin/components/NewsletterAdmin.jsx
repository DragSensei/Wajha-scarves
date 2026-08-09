import { useState, useEffect, useCallback } from 'react';
import { Mail, Send, Trash2, Search, RefreshCw, CheckSquare, Square, ChevronLeft, ChevronRight, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/shared/lib/api';
import { notify } from '@/shared/utils/notifications';

export default function NewsletterAdmin() {
  const [subscribers, setSubscribers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [perPage] = useState(12); // Strict 12-row pagination limit
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Row selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Campaign Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sendMode, setSendMode] = useState('all'); // 'all' or 'selected'
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Fetch Subscribers from API
  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAdminSubscribers(page, perPage, search);
      setSubscribers(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      // Handled by api request wrapper
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search]);

  useEffect(() => {
    let isMounted = true;
    api.getAdminSubscribers(page, perPage, search)
      .then((data) => {
        if (isMounted) {
          setSubscribers(data.items || []);
          setTotal(data.total || 0);
          setPages(data.pages || 1);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [page, perPage, search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  const handleSelectAllOnPage = () => {
    const pageIds = subscribers.map((sub) => sub.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds([...new Set([...selectedIds, ...pageIds])]);
    }
  };

  const handleToggleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSubscriber = async (id, email) => {
    if (!window.confirm(`Are you sure you want to delete ${email} from subscribers?`)) {
      return;
    }
    try {
      await api.deleteSubscriber(id);
      notify.success(`Subscriber ${email} deleted.`);
      setSelectedIds(selectedIds.filter((i) => i !== id));
      fetchSubscribers();
    } catch {
      // Handled by api wrapper
    }
  };

  const openComposeModal = (mode) => {
    setSendMode(mode);
    setSubject('');
    setContent('');
    setIsModalOpen(true);
  };

  const handleSendCampaign = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      notify.error('Please enter both subject and email content.');
      return;
    }

    setIsSending(true);
    try {
      const payload = {
        subject: subject.trim(),
        content: content.trim(),
        send_all: sendMode === 'all',
        recipient_ids: sendMode === 'selected' ? selectedIds : [],
      };

      const res = await api.sendNewsletterCampaign(payload);
      notify.success(res.message || 'Newsletter campaign successfully queued and sending!');
      setIsModalOpen(false);
      setSelectedIds([]);
    } catch {
      // Handled by api wrapper
    } finally {
      setIsSending(false);
    }
  };

  const isAllOnPageSelected =
    subscribers.length > 0 && subscribers.every((s) => selectedIds.includes(s.id));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Stats Cards */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary tracking-wide uppercase flex items-center gap-2">
            <Mail className="w-6 h-6" /> Newsletter Subscribers
          </h1>
          <p className="text-xs font-sans text-outline mt-1">
            Manage customer newsletter subscriptions and send 1-click broadcast email campaigns.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => openComposeModal('all')}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-sans tracking-widest uppercase font-bold hover:bg-primary-container transition-colors shadow-xs cursor-pointer rounded-xs"
          >
            <Send className="w-4 h-4" /> 1-Click Broadcast to All
          </button>
          {selectedIds.length > 0 && (
            <button
              onClick={() => openComposeModal('selected')}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-high text-primary border border-primary/30 text-xs font-sans tracking-widest uppercase font-bold hover:bg-surface-container transition-colors cursor-pointer rounded-xs"
            >
              <Mail className="w-4 h-4" /> Send to Selected ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 border border-surface-container/60 shadow-2xs flex items-center space-x-4">
          <div className="p-3 bg-primary/10 text-primary rounded-full">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-on-background">{total}</div>
            <div className="text-xs font-sans uppercase tracking-wider text-outline">Total Subscribers</div>
          </div>
        </div>

        <div className="bg-white p-5 border border-surface-container/60 shadow-2xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-emerald-700">
              {subscribers.filter((s) => s.is_subscribed).length}
            </div>
            <div className="text-xs font-sans uppercase tracking-wider text-outline">Active on Current Page</div>
          </div>
        </div>

        <div className="bg-white p-5 border border-surface-container/60 shadow-2xs flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-full">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-amber-700">{selectedIds.length}</div>
            <div className="text-xs font-sans uppercase tracking-wider text-outline">Selected for Campaign</div>
          </div>
        </div>
      </div>

      {/* Search & Action Bar */}
      <div className="bg-white p-4 border border-surface-container/60 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search subscriber emails..."
            className="w-full pl-9 pr-4 py-2 text-xs font-sans border border-surface-container focus:border-primary focus:outline-hidden text-on-background"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={fetchSubscribers}
            className="p-2 text-outline hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table Section with Strict 12-Row Pagination */}
      <div className="bg-white border border-surface-container/60 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container/40 border-b border-surface-container text-[10px] font-sans tracking-widest uppercase text-outline">
                <th className="p-3 w-10 text-center">
                  <button
                    onClick={handleSelectAllOnPage}
                    className="cursor-pointer text-primary hover:opacity-80"
                    title="Select All on Page"
                  >
                    {isAllOnPageSelected ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Status</th>
                <th className="p-3">Subscribed Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container/60 text-xs font-sans">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-outline">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading subscriber records...
                  </td>
                </tr>
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-outline">
                    No newsletter subscribers found.
                  </td>
                </tr>
              ) : (
                subscribers.map((sub) => {
                  const isChecked = selectedIds.includes(sub.id);
                  return (
                    <tr
                      key={sub.id}
                      className={`hover:bg-surface-container/30 transition-colors ${
                        isChecked ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleSelectRow(sub.id)}
                          className="cursor-pointer text-primary hover:opacity-80"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3 font-medium text-on-background">{sub.email}</td>
                      <td className="p-3">
                        {sub.is_subscribed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                            Unsubscribed
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-outline">
                        {sub.created_at
                          ? new Date(sub.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                          className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors rounded cursor-pointer"
                          title="Delete Subscriber"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 12-Row Pagination Footer Controls */}
        <div className="p-4 border-t border-surface-container/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-outline">
          <div>
            Showing {subscribers.length > 0 ? (page - 1) * perPage + 1 : 0} to{' '}
            {Math.min(page * perPage, total)} of {total} subscribers (12 per page)
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 border border-surface-container text-on-background hover:bg-surface-container transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-semibold text-primary">
              Page {page} of {pages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages || loading}
              className="p-1.5 border border-surface-container text-on-background hover:bg-surface-container transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Compose Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-surface-container max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-primary text-white p-4 flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm tracking-wider uppercase flex items-center gap-2">
                <Send className="w-4 h-4" /> Compose Newsletter Campaign
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendCampaign} className="p-6 space-y-4">
              <div className="bg-primary/5 p-3 border border-primary/20 text-xs font-sans text-primary flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {sendMode === 'all' ? (
                  <span>
                    Sending campaign to <strong>ALL ACTIVE SUBSCRIBERS</strong> ({total} total recipients).
                  </span>
                ) : (
                  <span>
                    Sending campaign to <strong>{selectedIds.length} SELECTED SUBSCRIBERS</strong>.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-sans tracking-widest uppercase font-bold text-on-background mb-1">
                  Email Subject Line *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. ✨ Exclusive Drop: The Royal Silk Silk Scarves Collection"
                  required
                  className="w-full p-2.5 text-xs font-sans border border-surface-container focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-sans tracking-widest uppercase font-bold text-on-background mb-1">
                  Email Campaign Message Content *
                </label>
                <textarea
                  rows="8"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter newsletter text or promotional message body here..."
                  required
                  className="w-full p-2.5 text-xs font-sans border border-surface-container focus:border-primary focus:outline-hidden leading-relaxed"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-surface-container flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-surface-container text-xs font-sans tracking-widest uppercase text-outline hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-xs font-sans tracking-widest uppercase font-bold hover:bg-primary-container transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSending ? 'Sending Campaign...' : 'Send Broadcast Email Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
