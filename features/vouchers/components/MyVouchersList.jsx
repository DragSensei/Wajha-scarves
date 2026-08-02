import { useState, useEffect } from 'react';
import { api } from '@/shared/lib/api';
import { formatPrice } from '@/shared/utils/currency';
import { Gift, Copy, Check } from 'lucide-react';

export default function MyVouchersList() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.getMyVouchers();
        if (active) setVouchers(Array.isArray(res) ? res : []);
      } catch {
        if (active) setVouchers([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return <div className="text-xs text-outline font-sans py-6 text-center">Loading your gift vouchers...</div>;
  }

  if (vouchers.length === 0) {
    return (
      <div className="text-center py-8 bg-surface/50 border border-surface-container rounded-2xl p-6 space-y-3">
        <Gift className="w-8 h-8 text-outline/50 mx-auto" />
        <p className="text-xs text-outline font-sans">You have no active or purchased gift vouchers yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-serif font-bold uppercase tracking-widest text-primary flex items-center gap-2">
        <Gift className="w-4 h-4 text-gold" />
        <span>My Digital Gift Vouchers</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vouchers.map((v) => {
          const isExpired = v.expires_at && new Date(v.expires_at) < new Date();
          return (
            <div
              key={v.id || v.code}
              className="bg-white border border-surface-container rounded-xl p-4 space-y-3 shadow-xs hover:border-gold/40 transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-sans uppercase text-outline tracking-wider block">
                    Voucher Value
                  </span>
                  <span className="text-lg font-serif font-bold text-primary">
                    {formatPrice(v.value)}
                  </span>
                </div>
                {v.is_redeemed ? (
                  <span className="px-2 py-0.5 text-[9px] font-sans font-bold uppercase rounded bg-slate-100 text-slate-600 border border-slate-200">
                    Redeemed
                  </span>
                ) : isExpired ? (
                  <span className="px-2 py-0.5 text-[9px] font-sans font-bold uppercase rounded bg-red-50 text-red-600 border border-red-200">
                    Expired
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[9px] font-sans font-bold uppercase rounded bg-green-50 text-green-700 border border-green-200">
                    Active
                  </span>
                )}
              </div>

              {v.recipient_name && (
                <p className="text-[11px] text-outline font-sans">
                  Recipient: <strong className="text-on-background">{v.recipient_name}</strong>
                </p>
              )}

              {/* Code Box */}
              <div className="flex items-center justify-between bg-surface p-2.5 rounded-lg border border-surface-container font-mono text-xs">
                <span className="font-bold text-primary tracking-wider">{v.code}</span>
                <button
                  onClick={() => copyCode(v.code)}
                  className="p-1 text-outline hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  {copiedCode === v.code ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[10px] font-sans uppercase tracking-tighter">
                    {copiedCode === v.code ? 'Copied' : 'Copy'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
