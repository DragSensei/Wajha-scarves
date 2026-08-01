import { useState, useEffect } from 'react';
import { Save, Check, Store, Gift, Share2, HeartHandshake } from 'lucide-react';
import { api } from '@/shared/lib/api';

export default function SettingsAdmin() {
  const [activeTab, setActiveTab] = useState('promotions');
  const [settings, setSettings] = useState({
    // Store & Promotions (10)
    sale_active: 'false',
    discount_active: 'false',
    discount_percent: '0',
    custom_sale_text: '',
    discount_categories: '',
    discount_product_ids: '',
    whatsapp_number: '',
    contact_number: '',
    owner_whatsapp: '',
    sale_bundle_name: '',
    // Loyalty & Points (5)
    points_per_egp: '1',
    points_to_egp_rate: '0.05',
    review_bonus_points: '50',
    social_follow_bonus_points: '25',
    points_expiry_months: '12',
    // Referrals & Vouchers (4)
    referral_voucher_amount: '100',
    referral_voucher_min_spend: '500',
    referral_min_order_amount: '300',
    voucher_expiry_months: '6',
    // Donations & System (6)
    donation_percentage: '5',
    birthday_reward_amount: '150',
    birthday_reward_min_tier: 'Silver',
    birthday_reward_lead_days: '30',
    gift_card_default_expiry_months: '12',
    email_quota_warning_percent: '80',
  });

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    Promise.all([
      api.getSettings().catch(() => ({})),
      api.getCategories().catch(() => []),
      api.getProducts().catch(() => []),
      api.getTiers().catch(() => [])
    ]).then(([resSettings, resCategories, resProducts, resTiers]) => {
      if (resSettings && typeof resSettings === 'object') {
        setSettings(prev => ({ ...prev, ...resSettings }));
      }
      setCategories(Array.isArray(resCategories) ? resCategories : []);
      setProducts(Array.isArray(resProducts) ? resProducts : []);
      setTiers(Array.isArray(resTiers) ? resTiers : []);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const selectedCategories = (settings.discount_categories || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const toggleCategory = (slug) => {
    let next;
    if (selectedCategories.includes(slug)) {
      next = selectedCategories.filter(c => c !== slug);
    } else {
      next = [...selectedCategories, slug];
    }
    setSettings(prev => ({ ...prev, discount_categories: next.join(',') }));
  };

  const selectedProductIds = (settings.discount_product_ids || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const toggleProduct = (id) => {
    const idStr = String(id);
    let next;
    if (selectedProductIds.includes(idStr)) {
      next = selectedProductIds.filter(i => i !== idStr);
    } else {
      next = [...selectedProductIds, idStr];
    }
    setSettings(prev => ({ ...prev, discount_product_ids: next.join(',') }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg('');
    try {
      const updated = await api.updateSettings(settings);
      setSettings(prev => ({ ...prev, ...updated }));
      setStatusMsg('Settings saved successfully.');
    } catch {
      setStatusMsg('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'promotions', label: 'General & Store Promotions', icon: Store },
    { id: 'loyalty', label: 'Loyalty & Points System', icon: Gift },
    { id: 'referrals', label: 'Referrals & Vouchers', icon: Share2 },
    { id: 'donations_system', label: 'Donations, Birthday & System', icon: HeartHandshake },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest">
            System & App Settings
          </h1>
          <p className="text-xs font-sans text-outline mt-1">
            Configure store promotions, customer loyalty rewards, and referral parameters.
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-surface-container mb-6 gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-xs font-sans tracking-wider uppercase font-semibold flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-outline hover:text-on-background hover:bg-surface-container/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="bg-white border border-surface-container p-6 space-y-6">
        {/* TAB 1: General & Store Promotions */}
        {activeTab === 'promotions' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-sm font-sans font-bold uppercase tracking-wider text-primary border-b pb-2 border-outline/20">
              General & Store Promotion Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Active Sale Mode
                </label>
                <select
                  name="sale_active"
                  value={settings.sale_active}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Active Discounts
                </label>
                <select
                  name="discount_active"
                  value={settings.discount_active}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>

              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Global Discount Percentage (%)
                </label>
                <input
                  type="number"
                  name="discount_percent"
                  value={settings.discount_percent}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
              </div>

              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Promotion Bundle Name
                </label>
                <input
                  type="text"
                  name="sale_bundle_name"
                  value={settings.sale_bundle_name}
                  onChange={handleChange}
                  placeholder="e.g. Summer Essentials"
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
              </div>

              <div className="border-b border-outline/30 pb-2 md:col-span-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Promotion Announcement Banner Text
                </label>
                <input
                  type="text"
                  name="custom_sale_text"
                  value={settings.custom_sale_text}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
              </div>

              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Support Whatsapp Number
                </label>
                <input
                  type="text"
                  name="whatsapp_number"
                  value={settings.whatsapp_number}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
              </div>

              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  name="contact_number"
                  value={settings.contact_number}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
              </div>

              <div className="border-b border-outline/30 pb-2 md:col-span-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Owner WhatsApp Number
                </label>
                <input
                  type="text"
                  name="owner_whatsapp"
                  value={settings.owner_whatsapp}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
              </div>
            </div>

            {/* Target Sale Categories */}
            <div className="border-b border-outline/30 pb-4 pt-2">
              <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-2">
                Target Sale Categories (Unselect all to apply to all categories)
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => {
                  const isSelected = selectedCategories.includes(cat.slug);
                  return (
                    <button
                      key={cat.id || cat.slug}
                      type="button"
                      onClick={() => toggleCategory(cat.slug)}
                      className={`px-3 py-1 text-xs font-sans rounded-full border transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface text-on-background border-outline/40 hover:border-primary'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Specific Items */}
            {products.length > 0 && (
              <div className="border-b border-outline/30 pb-4">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-2">
                  Target Specific Items (Unselect all to apply to all items in selected categories)
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2">
                  {products.map(prod => {
                    const isSelected = selectedProductIds.includes(String(prod.id));
                    return (
                      <label
                        key={prod.id}
                        className={`flex items-center justify-between p-2 text-xs font-sans border rounded cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 border-primary' : 'bg-surface border-outline/20 hover:border-outline'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProduct(prod.id)}
                            className="accent-primary cursor-pointer"
                          />
                          <span className="font-medium text-on-background">{prod.name}</span>
                        </div>
                        <span className="text-outline text-[11px]">${prod.original_price || prod.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Loyalty & Points System */}
        {activeTab === 'loyalty' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-sm font-sans font-bold uppercase tracking-wider text-primary border-b pb-2 border-outline/20">
              Loyalty Points Earning & Redemption Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Points Earned per EGP Spent
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="points_per_egp"
                  value={settings.points_per_egp}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
                <p className="text-[10px] text-outline mt-1">E.g., 1.0 means customer earns 1 point for every 1 EGP spent.</p>
              </div>

              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Points Redemption Rate (EGP per Point)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="points_to_egp_rate"
                  value={settings.points_to_egp_rate}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
                <p className="text-[10px] text-outline mt-1">E.g., 0.05 means 100 points = 5 EGP discount.</p>
              </div>

              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Review Bonus Points
                </label>
                <input
                  type="number"
                  name="review_bonus_points"
                  value={settings.review_bonus_points}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
                <p className="text-[10px] text-outline mt-1">Bonus points awarded when customer submits a verified product review.</p>
              </div>

              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Social Follow Bonus Points
                </label>
                <input
                  type="number"
                  name="social_follow_bonus_points"
                  value={settings.social_follow_bonus_points}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
                <p className="text-[10px] text-outline mt-1">Bonus points awarded for social media follow verification.</p>
              </div>

              <div className="border-b border-outline/30 pb-2 md:col-span-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Points Expiration Duration (Months)
                </label>
                <input
                  type="number"
                  name="points_expiry_months"
                  value={settings.points_expiry_months}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
                <p className="text-[10px] text-outline mt-1">Number of months before unredeemed loyalty points expire.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Referrals & Vouchers */}
        {activeTab === 'referrals' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-sm font-sans font-bold uppercase tracking-wider text-primary border-b pb-2 border-outline/20">
              Referral Program & Voucher Threshold Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Referral Voucher Discount Amount (EGP)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="referral_voucher_amount"
                  value={settings.referral_voucher_amount}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
                <p className="text-[10px] text-outline mt-1">Value of the discount voucher issued to referring customer.</p>
              </div>

              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Min Spend to Use Referral Voucher (EGP)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="referral_voucher_min_spend"
                  value={settings.referral_voucher_min_spend}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
                <p className="text-[10px] text-outline mt-1">Minimum order subtotal required to redeem a referral voucher.</p>
              </div>

              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Min Referee Order Amount to Trigger Reward (EGP)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="referral_min_order_amount"
                  value={settings.referral_min_order_amount}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
                <p className="text-[10px] text-outline mt-1">Minimum order completed by referee to issue reward voucher to referrer.</p>
              </div>

              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Voucher Expiration Window (Months)
                </label>
                <input
                  type="number"
                  name="voucher_expiry_months"
                  value={settings.voucher_expiry_months}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
                <p className="text-[10px] text-outline mt-1">Validity duration of generated referral discount vouchers.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Donations, Birthday Rewards & System */}
        {activeTab === 'donations_system' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-sm font-sans font-bold uppercase tracking-wider text-primary border-b pb-2 border-outline/20">
              Donations Earmark, Birthday Gift & System Quota Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Donation Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="donation_percentage"
                  value={settings.donation_percentage}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
                <p className="text-[10px] text-outline mt-1">Percentage of completed order revenue allocated to charitable donations.</p>
              </div>

              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Birthday Reward Voucher Amount (EGP)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="birthday_reward_amount"
                  value={settings.birthday_reward_amount}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
                <p className="text-[10px] text-outline mt-1">Discount voucher amount issued to qualifying customers on their birthday.</p>
              </div>

              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Minimum Tier for Birthday Reward
                </label>
                <select
                  name="birthday_reward_min_tier"
                  value={settings.birthday_reward_min_tier || ''}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-surface-container/20 border border-surface-container text-on-background py-1.5 px-2 focus:outline-hidden cursor-pointer"
                >
                  {tiers.length > 0 ? (
                    tiers.map((tier) => (
                      <option key={tier.id || tier.name} value={tier.name}>
                        {tier.name} (Threshold: EGP {tier.spend_threshold || 0})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Bronze">Bronze (Threshold: EGP 0)</option>
                      <option value="Silver">Silver (Threshold: EGP 2000)</option>
                      <option value="Gold">Gold (Threshold: EGP 5000)</option>
                      <option value="Platinum">Platinum (Threshold: EGP 10000)</option>
                    </>
                  )}
                </select>
                <p className="text-[10px] text-outline mt-1">Minimum membership tier required to receive birthday rewards.</p>
              </div>

              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Birthday Registration Lead Days
                </label>
                <input
                  type="number"
                  name="birthday_reward_lead_days"
                  value={settings.birthday_reward_lead_days}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
                <p className="text-[10px] text-outline mt-1">Days birthdate must be registered prior to birthday to qualify for annual gift.</p>
              </div>

              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Gift Card Default Expiry (Months)
                </label>
                <input
                  type="number"
                  name="gift_card_default_expiry_months"
                  value={settings.gift_card_default_expiry_months}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
                <p className="text-[10px] text-outline mt-1">Default validity period in months for admin-generated gift cards.</p>
              </div>

              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Email Quota Warning Threshold (%)
                </label>
                <input
                  type="number"
                  name="email_quota_warning_percent"
                  value={settings.email_quota_warning_percent}
                  onChange={handleChange}
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
                <p className="text-[10px] text-outline mt-1">Usage percentage at which an email quota alert banner appears on admin dashboard.</p>
              </div>
            </div>
          </div>
        )}

        {statusMsg && (
          <div className={`p-3 text-xs font-sans font-medium border ${statusMsg.includes('successfully') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {statusMsg}
          </div>
        )}

        <div className="pt-4 border-t border-outline/20">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-primary-container disabled:opacity-50 text-white text-xs font-sans tracking-widest uppercase px-6 py-3 flex items-center space-x-2 font-semibold cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Settings...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
