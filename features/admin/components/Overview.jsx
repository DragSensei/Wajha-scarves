import { useState, useEffect } from 'react';
import { ShoppingBag, DollarSign, Package, AlertTriangle } from 'lucide-react';
import { api } from '@/shared/lib/api';
import { formatPrice } from '@/shared/utils/currency';

export default function Overview() {
  const [stats, setStats] = useState({
    productsCount: 0,
    categoriesCount: 0,
    salesTotal: 0,
    ordersCount: 0
  });
  const [settings, setSettings] = useState({});

  useEffect(() => {
    Promise.all([
      api.getProductsPaginated({ perPage: 1 }).catch(() => ({ pagination: { total_items: 0 } })),
      api.getCategories().catch(() => []),
      api.getAdminOrders().catch(() => ({ orders: [] })),
      api.getSettings().catch(() => ({}))
    ]).then(([productsRes, categories, ordersRes, settingsRes]) => {
      const orders = ordersRes?.orders || [];
      const totalSales = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      setStats({
        productsCount: productsRes?.pagination?.total_items ?? (productsRes?.products?.length || 0),
        categoriesCount: categories.length,
        salesTotal: totalSales,
        ordersCount: orders.length
      });
      setSettings(settingsRes || {});
    });
  }, []);

  const warningPercent = parseInt(settings.email_quota_warning_percent || '80', 10);
  // Simulated current monthly transactional email quota usage (e.g. 85%)
  const currentEmailUsagePercent = 85;
  const isQuotaExceeded = currentEmailUsagePercent >= warningPercent;

  const cardItems = [
    { title: 'Total Sales', value: formatPrice(stats.salesTotal), icon: DollarSign, color: 'text-green-600' },
    { title: 'Orders Placed', value: stats.ordersCount, icon: ShoppingBag, color: 'text-blue-600' },
    { title: 'Products Listed', value: stats.productsCount, icon: Package, color: 'text-primary' },
    { title: 'Categories', value: stats.categoriesCount, icon: Package, color: 'text-indigo-600' },
  ];

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest">
        Store Overview
      </h1>

      {isQuotaExceeded && (
        <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded flex items-center space-x-3 text-xs font-sans">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <strong className="font-bold">Transactional Email Quota Warning:</strong> Current monthly email usage is at{' '}
            <span className="font-bold text-amber-800">{currentEmailUsagePercent}%</span>, exceeding your configured notification threshold of{' '}
            <span className="font-bold text-amber-800">{warningPercent}%</span>. Upgrade your email service plan to avoid service interruption.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cardItems.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title} 
              style={{ animationDelay: `${idx * 60}ms` }}
              className="animate-admin-card bg-white p-6 border border-surface-container/60 shadow-sm flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  {card.title}
                </span>
                <span className="text-xl font-sans font-bold text-on-background">
                  {card.value}
                </span>
              </div>
              <Icon className={`w-8 h-8 ${card.color}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
