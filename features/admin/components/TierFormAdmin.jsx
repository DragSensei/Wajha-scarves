import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Crown, Info } from 'lucide-react';
import { api } from '@/shared/lib/api';

const DEFAULT_FEATURES = {
  welcome_points: '4,000 pts',
  earn_rate: '1 Point / 1 EGP',
  birthday_reward: '8,000 pts',
  product_review: '100 pts',
  early_access: false,
  free_shipping: false,
};

export default function TierFormAdmin({ mode = 'edit' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = mode === 'edit' || Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    spend_threshold: 0,
    sort_order: 1,
    features: { ...DEFAULT_FEATURES },
  });

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const tiers = await api.getTiers();
        if (ignore) return;
        if (isEditMode && id) {
          const target = (tiers || []).find((t) => String(t.id) === String(id));
          if (target) {
            setFormData({
              name: target.name || '',
              spend_threshold: target.spend_threshold || 0,
              sort_order: target.sort_order || 0,
              features: { ...DEFAULT_FEATURES, ...(target.features || {}) },
            });
          } else {
            setErrorMsg('Membership tier not found.');
          }
        } else {
          const nextOrder = Array.isArray(tiers) && tiers.length > 0 
            ? Math.max(...tiers.map(t => t.sort_order || 0)) + 1 
            : 1;
          setFormData(prev => ({ ...prev, sort_order: nextOrder }));
        }
      } catch (err) {
        if (!ignore) setErrorMsg(err.message || 'Failed to load tier details.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadData();
    return () => { ignore = true; };
  }, [id, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        name: formData.name.trim(),
        spend_threshold: parseFloat(formData.spend_threshold),
        sort_order: parseInt(formData.sort_order, 10),
        features: formData.features,
      };

      if (isEditMode && id) {
        await api.updateTier(id, payload);
      } else {
        await api.createTier(payload);
      }

      navigate('/admin/tiers');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save tier.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl text-xs text-outline text-center">
        Loading membership tier information...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b pb-4 border-outline/20">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/tiers"
            className="p-2 text-outline hover:text-on-background hover:bg-surface-container rounded-full transition-colors"
            title="Back to Tiers"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-serif text-primary uppercase font-bold tracking-widest flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              <span>{isEditMode ? 'Edit Membership Tier' : 'Create Membership Tier'}</span>
            </h1>
            <p className="text-xs font-sans text-outline mt-0.5">
              {isEditMode ? 'Update spend threshold and feature perks for this tier.' : 'Configure a new customer loyalty tier.'}
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-800 border border-red-200 text-xs font-sans rounded">
          {errorMsg}
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white border border-surface-container p-6 rounded-lg shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                Tier Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Platinum"
                className="w-full text-sm font-sans border border-outline/30 rounded px-3 py-2 focus:outline-hidden focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                Minimum Spend Threshold (EGP) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.spend_threshold}
                onChange={(e) => setFormData({ ...formData, spend_threshold: e.target.value })}
                className="w-full text-sm font-sans border border-outline/30 rounded px-3 py-2 focus:outline-hidden focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                Sort Order Rank *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                className="w-full text-sm font-sans border border-outline/30 rounded px-3 py-2 focus:outline-hidden focus:border-primary"
              />
            </div>
          </div>

          {/* Feature Specs Section */}
          <div className="border-t pt-6 border-outline/20 space-y-4">
            <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-primary">
              Configure Tier Features (6 Card Specs)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  1. Welcome Points
                </label>
                <input
                  type="text"
                  value={formData.features?.welcome_points || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      features: { ...formData.features, welcome_points: e.target.value },
                    })
                  }
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val && !isNaN(Number(val.replace(/,/g, '')))) {
                      const num = Number(val.replace(/,/g, ''));
                      setFormData((prev) => ({
                        ...prev,
                        features: { ...prev.features, welcome_points: `${num.toLocaleString()} pts` },
                      }));
                    }
                  }}
                  placeholder="e.g. 4,000 pts"
                  className="w-full text-xs font-sans border border-outline/30 rounded px-3 py-2 focus:border-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-sans tracking-widest uppercase text-outline">
                    2. Earn Rate Multiplier *
                  </label>
                  <div className="group relative cursor-pointer flex items-center">
                    <Info className="w-3.5 h-3.5 text-primary hover:text-primary-container transition-colors" />
                    <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block w-52 p-2.5 bg-slate-900 text-white text-[10px] font-sans rounded-md shadow-xl z-50 leading-relaxed pointer-events-none">
                      Points multiplier per 1 EGP spent. E.g. 1 = 1 Point/1 EGP, 2 = 2 Points/1 EGP.
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={
                    formData.features?.earn_rate !== undefined && formData.features?.earn_rate !== null
                      ? String(formData.features.earn_rate).match(/(\d+(?:\.\d+)?)/)?.[1] || '1'
                      : '1'
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      features: { ...prev.features, earn_rate: val },
                    }));
                  }}
                  placeholder="e.g. 1 or 2"
                  className="w-full text-xs font-sans border border-outline/30 rounded px-3 py-2 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  3. Birthday Reward
                </label>
                <input
                  type="text"
                  value={formData.features?.birthday_reward || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      features: { ...formData.features, birthday_reward: e.target.value },
                    })
                  }
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val && !isNaN(Number(val.replace(/,/g, '')))) {
                      const num = Number(val.replace(/,/g, ''));
                      setFormData((prev) => ({
                        ...prev,
                        features: { ...prev.features, birthday_reward: `${num.toLocaleString()} pts` },
                      }));
                    }
                  }}
                  placeholder="e.g. 8,000 pts"
                  className="w-full text-xs font-sans border border-outline/30 rounded px-3 py-2 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  4. Product Review
                </label>
                <input
                  type="text"
                  value={formData.features?.product_review || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      features: { ...formData.features, product_review: e.target.value },
                    })
                  }
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val && !isNaN(Number(val.replace(/,/g, '')))) {
                      const num = Number(val.replace(/,/g, ''));
                      setFormData((prev) => ({
                        ...prev,
                        features: { ...prev.features, product_review: `${num.toLocaleString()} pts` },
                      }));
                    }
                  }}
                  placeholder="e.g. 100 pts"
                  className="w-full text-xs font-sans border border-outline/30 rounded px-3 py-2 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <label className="flex items-center space-x-2 text-xs font-sans cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.features?.early_access)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      features: { ...formData.features, early_access: e.target.checked },
                    })
                  }
                  className="rounded border-outline/40 text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-on-background font-medium">5. Early Access Perks</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-sans cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.features?.free_shipping)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      features: { ...formData.features, free_shipping: e.target.checked },
                    })
                  }
                  className="rounded border-outline/40 text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-on-background font-medium">6. Free Express Shipping</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex justify-end space-x-3 border-t border-outline/20">
            <Link
              to="/admin/tiers"
              className="px-5 py-2.5 text-xs font-sans uppercase tracking-wider text-outline hover:text-on-background cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primary-container disabled:opacity-50 text-white text-xs font-sans tracking-widest uppercase px-6 py-2.5 font-semibold cursor-pointer rounded flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Tier'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
