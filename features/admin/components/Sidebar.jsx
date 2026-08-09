import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, FolderTree, Users, Settings, Globe, Crown, HeartHandshake, Gift, Mail } from 'lucide-react';

export default function Sidebar({ isCollapsed, onToggle }) {
  const location = useLocation();

  const sections = [
    {
      category: 'STORE',
      items: [
        { name: 'Overview', path: '/admin', icon: LayoutDashboard },
        { name: 'Products', path: '/admin/products', icon: ShoppingBag },
        { name: 'Categories', path: '/admin/categories', icon: FolderTree },
        { name: 'Orders History', path: '/admin/orders', icon: ShoppingBag },
        { name: 'Users Management', path: '/admin/users', icon: Users },
      ]
    },
    {
      category: 'ENGAGEMENT',
      items: [
        { name: 'Newsletter', path: '/admin/newsletter', icon: Mail },
        { name: 'Diya Rewards', path: '/rewards', icon: Crown },
        { name: 'Voucher Orders', path: '/admin/vouchers', icon: Gift },
        { name: 'Donations', path: '/admin/donations', icon: HeartHandshake },
        { name: 'Gift Cards', path: '/admin/gift-cards', icon: Gift },
        { name: 'Membership Tiers', path: '/admin/tiers', icon: Crown },
      ]
    },
    {
      category: 'SYSTEM',
      items: [
        { name: 'Settings', path: '/admin/settings', icon: Settings },
      ]
    }
  ];


  return (
    <aside className={`bg-white border-r border-surface-container/60 h-screen sticky top-0 shrink-0 flex flex-col justify-between transition-all duration-300 z-20 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="overflow-y-auto">
        {/* Branding header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-surface-container/60">
          {!isCollapsed && (
            <span className="text-lg font-serif text-primary uppercase font-bold tracking-widest">Diya Admin</span>
          )}
          <button 
            onClick={onToggle}
            className="p-1 hover:bg-surface-container transition-colors ml-auto cursor-pointer"
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation links by category */}
        <nav className="mt-4 space-y-4 px-3">
          {sections.map((sec) => (
            <div key={sec.category} className="space-y-1">
              {!isCollapsed && (
                <div className="text-[9px] tracking-[0.2em] uppercase text-outline/60 px-3 pt-2 pb-1 font-bold">
                  {sec.category}
                </div>
              )}
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2.5 text-[0.85rem] font-sans tracking-wider uppercase transition-colors rounded ${
                      isActive 
                        ? 'bg-primary text-white font-bold' 
                        : 'text-on-background hover:bg-surface-container/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer link to customer page */}
      <div className="p-4 border-t border-surface-container/60 space-y-2">
        <Link
          to="/"
          className="flex items-center space-x-4 px-4 py-3 text-xs font-sans tracking-widest uppercase text-primary hover:bg-surface-container/50 transition-colors"
        >
          <Globe className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Customer Site</span>}
        </Link>
      </div>
    </aside>
  );
}
