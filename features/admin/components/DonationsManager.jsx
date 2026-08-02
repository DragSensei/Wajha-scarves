import { useState, useEffect } from 'react';
import { HeartHandshake, CheckCircle, Clock, AlertTriangle, Save, DollarSign } from 'lucide-react';
import { api } from '@/shared/lib/api';
import { formatPrice } from '@/shared/utils/currency';
import Pagination from '@/shared/components/Pagination';

const PAGE_SIZE = 12;

export default function DonationsManager() {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('pending');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [resSummary, resHistory] = await Promise.all([
          api.getDonationSummary().catch(() => null),
          api.getDonationHistory().catch(() => []),
        ]);
        if (active) {
          setSummary(resSummary);
          setHistory(resHistory);
          if (resSummary) {
            setStatus(resSummary.status || 'pending');
            setNote(resSummary.note || '');
          }
        }
      } catch {
        console.warn('Failed to load donations data.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!summary) return;
    setSaving(true);
    setStatusMsg('');

    try {
      await api.updateDonationStatus({
        period: summary.period,
        status,
        note,
      });
      setStatusMsg('Donation status updated successfully.');
      const [resSummary, resHistory] = await Promise.all([
        api.getDonationSummary().catch(() => null),
        api.getDonationHistory().catch(() => []),
      ]);
      setSummary(resSummary);
      setHistory(resHistory);
    } catch (err) {
      setStatusMsg(err.message || 'Failed to update donation status.');
    } finally {
      setSaving(false);
    }
  };

  // Check if current period has ended and is still pending
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const currentPeriodStr = `${now.getFullYear()}-Q${currentQuarter}`;
  const isPeriodEndedAndPending =
    summary &&
    summary.period !== currentPeriodStr &&
    summary.status === 'pending';

  return (
    <div className="p-8 max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest flex items-center gap-2">
          <HeartHandshake className="w-6 h-6 text-primary" />
          <span>Charitable Donations Manager</span>
        </h1>
        <p className="text-xs font-sans text-outline mt-1">
          Track revenue percentage earmarked for charitable causes and manage accounting payout periods.
        </p>
      </div>

      {/* Warning Alert Banner */}
      {isPeriodEndedAndPending && (
        <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded flex items-center space-x-3 text-xs font-sans animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <strong className="font-bold">Pending Donation Action Required:</strong> Period{' '}
            <span className="font-mono font-semibold">{summary.period}</span> has closed, but donation status is still marked as pending payout.
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-surface-container p-5 flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-sans tracking-widest uppercase text-outline">Current Accrued Earmark</div>
            <div className="text-xl font-bold font-serif text-primary">
              {summary ? formatPrice(summary.accrued_amount) : '---'}
            </div>
          </div>
        </div>

        <div className="bg-white border border-surface-container p-5 flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-sans tracking-widest uppercase text-outline">Configured Earmark %</div>
            <div className="text-xl font-bold font-serif text-on-background">
              {summary ? `${summary.donation_percentage}%` : '---'}
            </div>
          </div>
        </div>

        <div className="bg-white border border-surface-container p-5 flex items-center space-x-4">
          <div className={`p-3 rounded-full ${summary?.status === 'donated' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {summary?.status === 'donated' ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
          </div>
          <div>
            <div className="text-[10px] font-sans tracking-widest uppercase text-outline">Current Period Status</div>
            <div className="text-lg font-bold font-sans uppercase tracking-wider text-on-background">
              {summary ? summary.status : '---'}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION A: Current Period Status Toggle Form */}
      <div className="bg-white border border-surface-container p-6 space-y-6">
        <h2 className="text-sm font-sans font-bold uppercase tracking-wider text-primary border-b pb-3 border-outline/20">
          Current Period Payout Status ({summary?.period || '---'})
        </h2>

        {loading ? (
          <div className="text-xs text-outline py-6 text-center">Loading donation summary...</div>
        ) : summary ? (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Accounting Period
                </label>
                <input
                  type="text"
                  disabled
                  value={summary.period}
                  className="w-full text-sm font-sans font-mono bg-surface text-outline py-1 cursor-not-allowed"
                />
              </div>

              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Payout Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1 cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="donated">Donated (Paid)</option>
                </select>
              </div>

              <div className="border-b border-outline/30 pb-2 md:col-span-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Payout Note / Reference Details
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Enter wire transfer ID, charity receipt reference, or payout details..."
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
              </div>
            </div>

            {statusMsg && (
              <div className={`p-3 text-xs font-sans font-medium border ${statusMsg.includes('successfully') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {statusMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-primary hover:bg-primary-container disabled:opacity-50 text-white text-xs font-sans tracking-widest uppercase px-6 py-3 flex items-center space-x-2 font-semibold cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Donation Status'}</span>
            </button>
          </form>
        ) : null}
      </div>

      {/* SECTION B: Historical Donation Records */}
      <div className="bg-white border border-surface-container p-6 space-y-4">
        <h2 className="text-sm font-sans font-bold uppercase tracking-wider text-primary border-b pb-3 border-outline/20">
          Historical Donation Payout Ledger
        </h2>

        {history.length === 0 ? (
          <div className="text-xs text-outline py-6 text-center">No historical donation records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-surface-container bg-surface text-outline uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Donated Date</th>
                  <th className="py-3 px-4">Note / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/60">
                {(() => {
                  const paginatedHistory = history.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
                  return paginatedHistory.map((record) => (
                    <tr key={record.id || record.period} className="hover:bg-surface-container/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-on-background">
                        {record.period}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded ${
                          record.status === 'donated'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-outline font-mono text-[11px]">
                        {record.donated_at ? new Date(record.donated_at).toLocaleDateString() : '---'}
                      </td>
                      <td className="py-3 px-4 text-on-background">
                        {record.note || <span className="text-outline italic">No note attached</span>}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
            {Math.ceil(history.length / PAGE_SIZE) > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(history.length / PAGE_SIZE)}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
