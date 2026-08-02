import { Check, X } from 'lucide-react';
import { formatRawPrice } from '@/shared/utils/currency';

// Preset default metadata for standard tier names matching the Worood / Diya design spec
const TIER_PRESETS = {
  bronze: {
    subtitle: 'Join the House',
    welcomePoints: '—',
    earnRate: '1 Point / 1 EGP',
    birthdayReward: '—',
    productReview: '100 pts',
    earlyAccess: false,
    freeShipping: false,
    badge: null,
  },
  silver: {
    subtitleFormat: (spend) => spend > 0 ? `Starting From ${formatRawPrice(spend)}` : 'Starting From 5,000 EGP',
    welcomePoints: '4,000 pts',
    earnRate: '1 Point / 1 EGP',
    birthdayReward: '8,000 pts',
    productReview: '100 pts',
    earlyAccess: false,
    freeShipping: false,
    badge: null,
  },
  gold: {
    subtitleFormat: (spend) => spend > 0 ? `Starting From ${formatRawPrice(spend)}` : 'Starting From 25,000 EGP',
    welcomePoints: '8,000 pts',
    earnRate: '2 Points / 1 EGP',
    birthdayReward: '10,000 pts',
    productReview: '100 pts',
    earlyAccess: false,
    freeShipping: false,
    badge: null,
  },
  platinum: {
    subtitleFormat: (spend) => spend > 0 ? `Starting From ${formatRawPrice(spend)}` : 'Starting From 50,000 EGP',
    welcomePoints: '12,000 pts',
    earnRate: '2 Points / 1 EGP',
    birthdayReward: '12,000 pts',
    productReview: '100 pts',
    earlyAccess: true,
    freeShipping: false,
    badge: 'POPULAR',
  },
  diamond: {
    subtitleFormat: (spend) => spend > 0 ? `Starting From ${formatRawPrice(spend)}` : 'Starting From 80,000 EGP',
    welcomePoints: '20,000 pts',
    earnRate: '2 Points / 1 EGP',
    birthdayReward: '15,000 pts',
    productReview: '100 pts',
    earlyAccess: true,
    freeShipping: true,
    badge: 'VIP',
  },
};

function formatEarnRateMultiplier(val) {
  if (val === undefined || val === null || val === '') return '1 Point / 1 EGP';
  const str = String(val);
  const match = str.match(/(\d+(?:\.\d+)?)/);
  if (!match) return '1 Point / 1 EGP';
  const num = parseFloat(match[1]);
  return `${num} ${num === 1 ? 'Point' : 'Points'} / 1 EGP`;
}

// Fallback tier details builder for custom/unknown tier names
function getTierMeta(tier) {
  const nameKey = (tier.name || '').toLowerCase().trim();
  const preset = TIER_PRESETS[nameKey];

  let baseMeta;
  if (preset) {
    const subtitle = preset.subtitle
      ? preset.subtitle
      : preset.subtitleFormat
      ? preset.subtitleFormat(tier.spend_threshold)
      : `Starting From ${formatRawPrice(tier.spend_threshold)}`;
    baseMeta = { ...preset, subtitle };
  } else {
    // Generic fallback logic for custom tiers
    const spend = tier.spend_threshold || 0;
    baseMeta = {
      subtitle: spend === 0 ? 'Join the House' : `Starting From ${formatRawPrice(spend)}`,
      welcomePoints: spend > 0 ? `${Math.round(spend * 0.2).toLocaleString()} pts` : '—',
      earnRate: spend >= 20000 ? '2 Points / 1 EGP' : '1 Point / 1 EGP',
      birthdayReward: spend > 0 ? `${Math.round(spend * 0.25).toLocaleString()} pts` : '—',
      productReview: '100 pts',
      earlyAccess: spend >= 50000,
      freeShipping: spend >= 80000,
      badge: spend >= 80000 ? 'VIP' : spend >= 50000 ? 'POPULAR' : null,
    };
  }

  // Override with custom user-configured features if provided
  const custom = tier.features || {};
  return {
    ...baseMeta,
    welcomePoints: custom.welcome_points !== undefined ? custom.welcome_points : baseMeta.welcomePoints,
    earnRate: custom.earn_rate !== undefined ? formatEarnRateMultiplier(custom.earn_rate) : baseMeta.earnRate,
    birthdayReward: custom.birthday_reward !== undefined ? custom.birthday_reward : baseMeta.birthdayReward,
    productReview: custom.product_review !== undefined ? custom.product_review : baseMeta.productReview,
    earlyAccess: custom.early_access !== undefined ? Boolean(custom.early_access) : baseMeta.earlyAccess,
    freeShipping: custom.free_shipping !== undefined ? Boolean(custom.free_shipping) : baseMeta.freeShipping,
  };
}

export default function LoyaltyTierCard({
  tiers = [],
  currentTierName = null,
  title = 'DIYA HOUSE LOYALTY TIERS',
}) {
  // If no tiers provided, default to the standard 5 tiers spec
  const displayTiers = tiers.length > 0
    ? tiers
    : [
        { id: 'b', name: 'Bronze', spend_threshold: 0, sort_order: 1 },
        { id: 's', name: 'Silver', spend_threshold: 5000, sort_order: 2 },
        { id: 'g', name: 'Gold', spend_threshold: 25000, sort_order: 3 },
        { id: 'p', name: 'Platinum', spend_threshold: 50000, sort_order: 4 },
        { id: 'd', name: 'Diamond', spend_threshold: 80000, sort_order: 5 },
      ];

  const sortedTiers = [...displayTiers].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 py-4">
      {/* Title */}
      {title && (
        <h2 className="text-center font-serif text-2xl md:text-3xl font-bold tracking-widest text-[#4a3525] uppercase">
          {title}
        </h2>
      )}

      {/* Flex container centered for any number of tiers (even or odd) */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-5 items-stretch">
        {sortedTiers.map((tier) => {
          const meta = getTierMeta(tier);
          const isUserTier = currentTierName && currentTierName.toLowerCase() === tier.name.toLowerCase();
          const isFeatured = meta.badge !== null || isUserTier;

          return (
            <div
              key={tier.id || tier.name}
              className={`flex flex-col justify-between rounded-xl transition-all duration-200 overflow-hidden w-full sm:w-[240px] lg:w-[250px] flex-initial ${
                isUserTier
                  ? 'border-2 border-[#b88e58] shadow-md ring-2 ring-[#b88e58]/30 relative scale-[1.02] bg-white'
                  : isFeatured
                  ? 'border-2 border-[#b88e58] shadow-sm bg-white'
                  : 'border border-[#e6ded6] bg-white hover:border-[#c4b3a3]'
              }`}
            >
              {/* Header Box */}
              <div className="bg-[#f9f5ef] border-b border-[#e8e0d6] px-4 py-6 text-center min-h-[135px] flex flex-col justify-center items-center relative">
                {/* Badge if POPULAR / VIP or YOUR TIER */}
                {(isUserTier || meta.badge) && (
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2">
                    <span
                      className={`text-[9px] font-sans font-bold uppercase tracking-widest px-3 py-0.5 rounded-full border ${
                        isUserTier
                          ? 'bg-[#8c6538] text-white border-[#8c6538]'
                          : 'bg-[#f4ebd0] text-[#7a5938] border-[#cbb387]'
                      }`}
                    >
                      {isUserTier ? 'YOUR TIER' : meta.badge}
                    </span>
                  </div>
                )}

                {/* Tier Name */}
                <h3 className={`font-serif text-xl md:text-2xl text-[#3b2a1d] font-normal ${meta.badge || isUserTier ? 'mt-3' : ''}`}>
                  {tier.name}
                </h3>

                {/* Subtitle */}
                <p className="text-xs font-sans text-[#7c6c5e] mt-1 font-light">
                  {meta.subtitle}
                </p>
              </div>

              {/* Rows Comparison */}
              <div className="p-4 flex-1 flex flex-col justify-between divide-y divide-[#f0eadf] text-xs font-sans">
                {/* Welcome Points */}
                <div className="py-3.5 flex justify-between items-center min-h-[44px]">
                  <span className="text-[#6b5d52]">Welcome Points</span>
                  <span className={`font-medium ${meta.welcomePoints === '—' ? 'text-[#b0a599]' : 'text-[#2b1f16] font-semibold'}`}>
                    {meta.welcomePoints}
                  </span>
                </div>

                {/* Earn Rate */}
                <div className="py-3.5 flex justify-between items-center min-h-[44px]">
                  <span className="text-[#6b5d52]">Earn Rate</span>
                  <span className="font-semibold text-[#2b1f16]">
                    {meta.earnRate}
                  </span>
                </div>

                {/* Birthday Reward */}
                <div className="py-3.5 flex justify-between items-center min-h-[44px]">
                  <span className="text-[#6b5d52]">Birthday Reward</span>
                  <span className={`font-medium ${meta.birthdayReward === '—' ? 'text-[#b0a599]' : 'text-[#2b1f16] font-semibold'}`}>
                    {meta.birthdayReward}
                  </span>
                </div>

                {/* Product Review */}
                <div className="py-3.5 flex justify-between items-center min-h-[44px]">
                  <span className="text-[#6b5d52]">Product Review</span>
                  <span className="font-semibold text-[#2b1f16]">
                    {meta.productReview}
                  </span>
                </div>

                {/* Early Access */}
                <div className="py-3.5 flex justify-between items-center min-h-[44px]">
                  <span className="text-[#6b5d52]">Early Access</span>
                  <span>
                    {meta.earlyAccess ? (
                      <Check className="w-4 h-4 text-[#4a7c59] stroke-[2.5]" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-[#cfc7be] stroke-[1.5]" />
                    )}
                  </span>
                </div>

                {/* Free Shipping */}
                <div className="py-3.5 flex justify-between items-center min-h-[44px]">
                  <span className="text-[#6b5d52]">Free Shipping</span>
                  <span>
                    {meta.freeShipping ? (
                      <Check className="w-4 h-4 text-[#4a7c59] stroke-[2.5]" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-[#cfc7be] stroke-[1.5]" />
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
