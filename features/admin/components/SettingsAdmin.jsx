import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { api } from '@/shared/lib/api';

export default function SettingsAdmin() {
  const [settings, setSettings] = useState({
    sale_active: 'true',
    discount_active: 'true',
    discount_percent: '15',
    custom_sale_text: '15% off on select silk collections',
    whatsapp_number: '+966500000000'
  });
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    api.getSettings()
      .then(res => setSettings(prev => ({ ...prev, ...res })))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value
    });
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
            className="bg-primary hover:bg-primary-container disabled:opacity-50 text-white text-xs font-sans tracking-widest uppercase px-6 py-3.5 flex items-center space-x-2 font-medium"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
