import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, FolderTree, Users, Settings, Globe } from 'lucide-react';

export default function Sidebar({ isCollapsed, onToggle }) {
  const location = useLocation();

  const menuItems = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: ShoppingBag },
    { name: 'Categories', path: '/admin/categories', icon: FolderTree },
    { name: 'Users Management', path: '/admin/users', icon: Users },
    { name: 'Orders History', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className={`bg-white border-r border-surface-container/60 h-screen flex flex-col justify-between transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div>
        {/* Branding header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-surface-container/60">
          {!isCollapsed && (
            <span className="text-lg font-serif text-primary uppercase font-bold tracking-widest">Diya Admin</span>
          )}
          <button 
            onClick={onToggle}
            className="p-1 hover:bg-surface-container transition-colors ml-auto"
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation links */}
        <nav className="mt-8 space-y-2 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-4 px-4 py-3 text-xs font-sans tracking-widest uppercase transition-colors ${
                  isActive 
                    ? 'bg-primary text-white font-bold' 
                    : 'text-on-background hover:bg-surface-container/50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
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
