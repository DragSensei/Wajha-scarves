import { useState, useEffect } from 'react';
import { Gift, Plus, Copy, Check } from 'lucide-react';
import { api } from '@/shared/lib/api';
import { formatPrice } from '@/shared/utils/currency';

export default function GiftCardsManager() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState('');
  const [expiryMonths, setExpiryMonths] = useState('');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.getGiftCards();
        if (active) setCards(Array.isArray(res) ? res : []);
      } catch {
        if (active) setErrorMsg('Failed to load gift cards.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!value || parseFloat(value) <= 0) {
      setErrorMsg('Please enter a valid gift card value.');
      return;
    }
    setCreating(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = { value: parseFloat(value) };
      if (expiryMonths) payload.expiry_months = parseInt(expiryMonths, 10);
      const res = await api.createGiftCard(payload);
      if (res && res.gift_card) {
        setSuccessMsg(`Gift card "${res.gift_card.code}" generated successfully.`);
        setValue('');
        setExpiryMonths('');
        const updated = await api.getGiftCards();
        setCards(Array.isArray(updated) ? updated : []);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate gift card.');
    } finally {
      setCreating(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="p-8 max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest flex items-center gap-2">
          <Gift className="w-6 h-6 text-primary" />
          <span>Gift Cards Generator & Manager</span>
        </h1>
        <p className="text-xs font-sans text-outline mt-1">
          Issue 16-character promotional gift cards and monitor checkout redemption status.
        </p>
      </div>

      {/* SECTION A: Generate Gift Card Form */}
      <div className="bg-white border border-surface-container p-6 space-y-6">
        <h2 className="text-sm font-sans font-bold uppercase tracking-wider text-primary border-b pb-3 border-outline/20">
          Generate New Digital Gift Card
        </h2>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 text-xs font-sans rounded">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-green-50 text-green-700 border border-green-200 text-xs font-sans rounded">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
              Card Amount (EGP) *
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 500"
              className="w-full text-sm font-sans border border-outline/30 rounded px-3 py-2 focus:outline-hidden focus:border-primary text-on-background"
            />
          </div>

          <div>
            <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
              Validity Duration (Months, optional)
            </label>
            <input
              type="number"
              min="1"
              value={expiryMonths}
              onChange={(e) => setExpiryMonths(e.target.value)}
              placeholder="Default: configured setting"
              className="w-full text-sm font-sans border border-outline/30 rounded px-3 py-2 focus:outline-hidden focus:border-primary text-on-background"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={creating}
              className="w-full bg-primary hover:bg-primary-container disabled:opacity-50 text-white text-xs font-sans tracking-widest uppercase py-2.5 px-5 flex items-center justify-center space-x-2 font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{creating ? 'Generating Code...' : 'Generate Gift Card'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION B: Gift Card List */}
      <div className="bg-white border border-surface-container p-6 space-y-4">
        <h2 className="text-sm font-sans font-bold uppercase tracking-wider text-primary border-b pb-3 border-outline/20">
          Issued Gift Cards Directory
        </h2>

        {loading ? (
          <div className="text-xs text-outline py-6 text-center">Loading gift cards...</div>
        ) : cards.length === 0 ? (
          <div className="text-xs text-outline py-6 text-center">No gift cards generated yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-surface-container bg-surface text-outline uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Expiration Date</th>
                  <th className="py-3 px-4">Redeemed Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/60">
                {cards.map((card) => {
                  const isExpired = card.expires_at && new Date(card.expires_at) < new Date();
                  return (
                    <tr key={card.id || card.code} className="hover:bg-surface-container/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary tracking-wider">
                        {card.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-on-background">
                        {formatPrice(card.value)}
                      </td>
                      <td className="py-3 px-4">
                        {card.is_redeemed ? (
                          <span className="inline-block px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-slate-100 text-slate-700 border border-slate-300">
                            Redeemed
                          </span>
                        ) : isExpired ? (
                          <span className="inline-block px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-red-50 text-red-700 border border-red-200">
                            Expired
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-green-50 text-green-700 border border-green-200">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-outline font-mono text-[11px]">
                        {card.expires_at ? new Date(card.expires_at).toLocaleDateString() : '---'}
                      </td>
                      <td className="py-3 px-4 text-outline font-mono text-[11px]">
                        {card.redeemed_at ? new Date(card.redeemed_at).toLocaleDateString() : '---'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => copyCode(card.code)}
                          className="p-1.5 text-outline hover:text-primary hover:bg-surface-container rounded transition-colors cursor-pointer inline-flex items-center space-x-1"
                          title="Copy Code"
                        >
                          {copiedCode === card.code ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-600" />
                              <span className="text-[10px] text-green-600 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
