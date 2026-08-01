import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Award, Gift, Copy, Check, ArrowRight, RefreshCw, UserCheck, Star } from 'lucide-react';
import { api } from '@/shared/lib/api';
import { formatPrice } from '@/shared/utils/currency';

// Alternating colour palettes for tier cards (cycles by index)
const TIER_PALETTES = [
  { border: 'border-amber-300', bg: 'bg-amber-50', label: 'text-amber-800', icon: 'text-amber-600' },
  { border: 'border-primary/40', bg: 'bg-primary/5', label: 'text-primary', icon: 'text-primary' },
  { border: 'border-amber-500', bg: 'bg-amber-50', label: 'text-amber-700', icon: 'text-amber-500' },
  { border: 'border-stone-400', bg: 'bg-stone-50', label: 'text-stone-700', icon: 'text-stone-500' },
];

export default function RewardsPanel({ user }) {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(() => Boolean(user));
  const [converting, setConverting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch tiers for everyone (public endpoint)
  useEffect(() => {
    api.getLoyaltyTiers().then(setTiers);
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const [resStatus, resHistory] = await Promise.all([
          api.getLoyaltyStatus().catch(() => null),
          api.getLoyaltyHistory().catch(() => []),
        ]);
        if (active) {
          setStatus(resStatus);
          setHistory(resHistory);
        }
      } catch {
        if (active) setMsg({ type: 'error', text: 'Failed to load loyalty rewards.' });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user]);

  const handleConvertPoints = async () => {
    setConverting(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await api.convertLoyaltyPoints();
      if (res && res.voucher) {
        setMsg({
          type: 'success',
          text: `Success! Created a voucher worth ${formatPrice(res.voucher.value)}.`,
        });
        const [resStatus, resHistory] = await Promise.all([
          api.getLoyaltyStatus().catch(() => null),
          api.getLoyaltyHistory().catch(() => []),
        ]);
        setStatus(resStatus);
        setHistory(resHistory);
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Points conversion failed.' });
    } finally {
      setConverting(false);
    }
  };

  const copyReferralLink = () => {
    const refCode = status?.referral_code || user?.referral_code;
    if (!refCode) return;
    const url = `${window.location.origin}/register?ref=${refCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center text-xs font-sans text-outline">
        Loading Diya Rewards...
      </div>
    );
  }

  // Guest view for unauthenticated visitors
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-16 space-y-10">
        {/* Banner */}
        <div className="bg-primary/5 border border-primary/20 p-8 md:p-12 text-center space-y-4">
          <Crown className="w-12 h-12 text-primary mx-auto" />
          <h1 className="text-3xl font-serif text-primary uppercase font-bold tracking-widest">
            Diya Rewards Club
          </h1>
          <p className="text-xs font-sans text-outline max-w-xl mx-auto leading-relaxed">
            Unlock exclusive tier privileges, earn rewards points on every luxury purchase, and receive complimentary gift vouchers when you refer friends.
          </p>
          <div className="pt-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase py-3.5 px-8 font-bold transition-colors shadow-sm"
            >
              <UserCheck className="w-4 h-4" />
              <span>Sign In / Register to Join</span>
            </Link>
          </div>
        </div>

        {/* Tier Overview Grid — dynamic, alternating colours */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(tiers.length > 0 ? tiers : [
            { id: 'b', name: 'Bronze', spend_threshold: 0 },
            { id: 's', name: 'Silver', spend_threshold: 2000 },
            { id: 'g', name: 'Gold & Platinum', spend_threshold: 5000 },
          ]).map((tier, i) => {
            const palette = TIER_PALETTES[i % TIER_PALETTES.length];
            return (
              <div key={tier.id} className={`border ${palette.border} ${palette.bg} p-6 text-center space-y-2`}>
                <Star className={`w-5 h-5 mx-auto ${palette.icon}`} />
                <div className={`text-xs font-bold uppercase tracking-wider ${palette.label}`}>{tier.name}</div>
                <div className="text-sm font-serif font-semibold text-on-background">
                  {tier.spend_threshold === 0 ? 'Entry Level' : `${formatPrice(tier.spend_threshold)} Spend`}
                </div>
                <p className="text-[11px] font-sans text-outline">
                  {tier.spend_threshold === 0
                    ? 'Earn points on every purchase & birthday rewards.'
                    : `Unlock exclusive privileges at ${formatPrice(tier.spend_threshold)} lifetime spend.`}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const referralCode = status?.referral_code || user?.referral_code;
  const referralLink = referralCode ? `${window.location.origin}/register?ref=${referralCode}` : '';

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-8 py-12 space-y-8">
      {/* Header Banner */}
      <div className="bg-primary/5 border border-primary/20 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-widest uppercase mb-1">
            <Crown className="w-5 h-5 text-primary" />
            <span>Diya Rewards Club</span>
          </div>
          <h1 className="text-2xl font-serif text-on-background font-bold">
            Member Status: <span className="text-primary uppercase tracking-wider">{status?.membership_tier || 'Bronze'}</span>
          </h1>
          <p className="text-xs font-sans text-outline mt-1">
            Earn points on every purchase and invite friends for exclusive luxury vouchers.
          </p>
        </div>

        <div className="bg-white border border-primary/20 px-6 py-4 text-center shrink-0">
          <div className="text-[10px] font-sans tracking-widest uppercase text-outline">Points Balance</div>
          <div className="text-3xl font-serif font-bold text-primary">{status?.points_balance || 0}</div>
          <div className="text-[10px] font-sans text-outline mt-0.5">pts</div>
        </div>
      </div>

      {/* Tier Progression — dynamic, alternating colours */}
      {tiers.length > 0 && (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${tiers.length}, minmax(0, 1fr))` }}>
          {tiers.map((tier, i) => {
            const palette = TIER_PALETTES[i % TIER_PALETTES.length];
            const isCurrentTier = (status?.membership_tier || 'Bronze').toLowerCase() === tier.name.toLowerCase();
            return (
              <div
                key={tier.id}
                className={`border ${palette.border} ${palette.bg} px-4 py-3 text-center relative ${
                  isCurrentTier ? 'ring-2 ring-primary ring-offset-1' : ''
                }`}
              >
                {isCurrentTier && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-widest bg-primary text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                    You Are Here
                  </span>
                )}
                <div className={`text-[10px] font-bold uppercase tracking-wider ${palette.label}`}>{tier.name}</div>
                <div className="text-[11px] font-sans text-outline mt-0.5">
                  {tier.spend_threshold === 0 ? 'From 0' : `${formatPrice(tier.spend_threshold)}+`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {msg.text && (
        <div className={`p-4 text-xs font-sans border ${msg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {msg.text}
        </div>
      )}

      {/* Grid: Conversion & Referral */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Points Conversion Card */}
        <div className="bg-white border border-surface-container p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
              <RefreshCw className="w-4 h-4" />
              <span>Convert Points to Voucher</span>
            </div>
            <p className="text-xs font-sans text-outline leading-relaxed">
              Convert your accrued points directly into store vouchers applicable at checkout.
            </p>
          </div>

          <div className="pt-4 border-t border-surface-container/60">
            <button
              onClick={handleConvertPoints}
              disabled={converting || !status?.points_balance}
              className="w-full bg-primary hover:bg-primary-container disabled:opacity-40 text-white text-xs font-sans tracking-widest uppercase py-3 px-4 flex items-center justify-center space-x-2 font-bold cursor-pointer transition-colors"
            >
              <span>{converting ? 'Converting...' : 'Convert Points'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Referral Link Card */}
        <div className="bg-white border border-surface-container p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
              <Gift className="w-4 h-4" />
              <span>Referral Program</span>
            </div>
            <p className="text-xs font-sans text-outline leading-relaxed">
              Share your link with friends. When they complete their first order, you both earn a reward voucher!
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-surface-container/60">
            <label className="block text-[10px] font-sans tracking-widest uppercase text-outline">
              Your Referral Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-grow text-[11px] font-mono border border-outline/30 px-3 py-2 bg-surface text-outline overflow-hidden text-ellipsis cursor-text"
              />
              <button
                onClick={copyReferralLink}
                className="bg-primary hover:bg-primary-container text-white text-xs font-sans px-3 py-2 font-bold uppercase transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Vouchers List */}
      <div className="bg-white border border-surface-container p-6 space-y-4">
        <h2 className="text-sm font-sans font-bold uppercase tracking-wider text-primary border-b pb-3 border-outline/20 flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          <span>Active Reward Vouchers ({status?.active_vouchers?.length || 0})</span>
        </h2>

        {!status?.active_vouchers || status.active_vouchers.length === 0 ? (
          <div className="text-xs text-outline py-4 text-center">No active vouchers available.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {status.active_vouchers.map((v) => (
              <div key={v.id} className="border border-primary/20 bg-primary/5 p-4 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div className="text-xl font-bold font-serif text-primary">
                      {formatPrice(v.value)}
                    </div>
                    <span className="text-[9px] uppercase font-bold tracking-widest bg-primary text-white px-2 py-0.5 rounded">
                      Active Voucher
                    </span>
                  </div>
                  <div className="text-[11px] font-sans text-outline mt-1">
                    Source: <span className="font-semibold text-on-background">{v.source.replace('_', ' ')}</span>
                  </div>
                  <div className="text-[10px] font-mono text-outline">
                    Expires: {v.expires_at ? new Date(v.expires_at).toLocaleDateString() : 'Never'}
                  </div>
                </div>
                <div className="pt-2 border-t border-primary/10 flex justify-between items-center">
                  <span className="text-[10px] font-sans text-green-700 font-medium">✓ Ready for Checkout</span>
                  <Link
                    to="/checkout"
                    className="text-[10px] font-sans uppercase font-bold tracking-wider text-primary hover:text-primary-container flex items-center gap-1"
                  >
                    <span>Use at Checkout</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Points History Table */}
      <div className="bg-white border border-surface-container p-6 space-y-4">
        <h2 className="text-sm font-sans font-bold uppercase tracking-wider text-primary border-b pb-3 border-outline/20">
          Points Activity Ledger
        </h2>

        {history.length === 0 ? (
          <div className="text-xs text-outline py-4 text-center">No points transactions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-surface-container bg-surface text-outline uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Points</th>
                  <th className="py-3 px-4">Expiration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/60">
                {history.map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-container/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-outline">
                      {entry.earned_at ? new Date(entry.earned_at).toLocaleDateString() : '---'}
                    </td>
                    <td className="py-3 px-4 font-medium text-on-background uppercase tracking-wider text-[11px]">
                      {entry.source}
                    </td>
                    <td className={`py-3 px-4 font-bold font-mono ${entry.amount > 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {entry.amount > 0 ? `+${entry.amount}` : entry.amount} pts
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-outline">
                      {entry.expires_at ? new Date(entry.expires_at).toLocaleDateString() : '---'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
