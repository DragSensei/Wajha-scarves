import { formatPrice } from '@/shared/utils/currency';
import { Sparkles, Gift } from 'lucide-react';

export default function VoucherCardPreview({ value = 500, recipientName = '', giftMessage = '', senderName = '' }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-primary-container/80 to-slate-950 p-6 text-white shadow-2xl border border-gold/30 min-h-[220px] flex flex-col justify-between transition-all duration-300">
      {/* Subtle background luxury pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Top Bar: Brand & Gift Icon */}
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <span className="text-[10px] tracking-[0.3em] font-serif uppercase text-gold font-bold block">
            Diya Scarves & Accessories
          </span>
          <h3 className="text-lg font-serif font-bold tracking-wider uppercase text-white mt-0.5">
            Digital Gift Voucher
          </h3>
        </div>
        <div className="p-2.5 rounded-xl bg-gold/10 border border-gold/30 text-gold flex items-center justify-center backdrop-blur-xs">
          <Gift className="w-5 h-5" />
        </div>
      </div>

      {/* Center: Recipient Name & Custom Message */}
      <div className="relative z-10 my-4 space-y-1.5">
        {recipientName ? (
          <div>
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-sans block">For</span>
            <p className="text-sm font-serif font-semibold text-gold tracking-wide">{recipientName}</p>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Select denomination and recipient details...</p>
        )}

        {giftMessage && (
          <p className="text-[11px] font-sans text-slate-200/90 italic line-clamp-2 bg-white/5 p-2 rounded border border-white/10 mt-1">
            "{giftMessage}"
          </p>
        )}

        {senderName && recipientName && (
          <span className="text-[10px] text-slate-400 font-sans block pt-0.5">
            With love from <strong className="text-white">{senderName}</strong>
          </span>
        )}
      </div>

      {/* Bottom Bar: Denomination Value & Badge */}
      <div className="relative z-10 flex justify-between items-end border-t border-white/10 pt-3">
        <div>
          <span className="text-[9px] uppercase tracking-widest text-slate-400 block font-sans">
            Voucher Value
          </span>
          <span className="text-2xl font-serif font-bold text-gold tracking-tight">
            {formatPrice(value)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-sans tracking-widest uppercase bg-gold/20 text-gold font-semibold px-3 py-1 rounded-full border border-gold/40">
          <Sparkles className="w-3 h-3" />
          <span>Store Credit</span>
        </div>
      </div>
    </div>
  );
}
