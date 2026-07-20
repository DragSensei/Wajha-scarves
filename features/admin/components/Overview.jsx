import { useState, useEffect } from 'react';
import { ShoppingBag, DollarSign, Package } from 'lucide-react';
import { api } from '@/shared/lib/api';

export default function Overview() {
  const [stats, setStats] = useState({
    productsCount: 0,
    categoriesCount: 0,
    salesTotal: 0,
    ordersCount: 0
  });

  useEffect(() => {
    Promise.all([
      api.getProducts().catch(() => []),
      api.getCategories().catch(() => []),
      api.getAdminOrders().catch(() => ({ orders: [] }))
    ]).then(([products, categories, ordersRes]) => {
      const orders = ordersRes?.orders || [];
      const totalSales = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      setStats({
        productsCount: products.length,
        categoriesCount: categories.length,
        salesTotal: totalSales,
        ordersCount: orders.length
      });
    });
  }, []);

  const cardItems = [
    { title: 'Total Sales', value: `$${stats.salesTotal.toFixed(2)}`, icon: DollarSign, color: 'text-green-600' },
    { title: 'Orders Placed', value: stats.ordersCount, icon: ShoppingBag, color: 'text-blue-600' },
    { title: 'Products Listed', value: stats.productsCount, icon: Package, color: 'text-primary' },
    { title: 'Categories', value: stats.categoriesCount, icon: Package, color: 'text-indigo-600' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest mb-8">
        Store Overview
      </h1>

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
