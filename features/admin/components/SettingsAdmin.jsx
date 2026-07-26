import { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import { api } from '@/shared/lib/api';

export default function SettingsAdmin() {
  const [settings, setSettings] = useState({
    sale_active: 'true',
    discount_active: 'true',
    discount_percent: '15',
    custom_sale_text: '15% off on select collections',
    discount_categories: '',
    discount_product_ids: '',
    whatsapp_number: '+966500000000'
  });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    Promise.all([
      api.getSettings().catch(() => ({})),
      api.getCategories().catch(() => []),
      api.getProducts().catch(() => [])
    ]).then(([resSettings, resCategories, resProducts]) => {
      setSettings(prev => ({ ...prev, ...resSettings }));
      setCategories(Array.isArray(resCategories) ? resCategories : []);
      setProducts(Array.isArray(resProducts) ? resProducts : []);
    });
  }, []);

  const handleChange = (e) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value
    });
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
    setSettings({ ...settings, discount_categories: next.join(',') });
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
    setSettings({ ...settings, discount_product_ids: next.join(',') });
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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest mb-8">
        System Settings
      </h1>

      <div className="bg-white border border-surface-container p-6 max-w-xl">
        <form onSubmit={handleSave} className="space-y-6">
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
              Global Discount Percentage
            </label>
            <input
              type="number"
              name="discount_percent"
              value={settings.discount_percent}
              onChange={handleChange}
              className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
            />
          </div>

          {/* Target Sale Categories */}
          <div className="border-b border-outline/30 pb-4">
            <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-2">
              Target Sale Categories (Unselect all for All Categories)
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
                Target Specific Items (Unselect all for All Items in Categories)
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

          <div className="border-b border-outline/30 pb-2">
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

          {statusMsg && (
            <div className={`text-xs font-sans font-medium ${statusMsg.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
              {statusMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-primary-container disabled:opacity-50 text-white text-xs font-sans tracking-widest uppercase px-6 py-3.5 flex items-center space-x-2 font-medium cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

