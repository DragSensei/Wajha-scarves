import { User } from 'lucide-react';

export default function AdminNavbar({ user, onLogout }) {
  return (
    <header className="bg-white border-b border-surface-container/60 h-20 flex items-center justify-between px-8 z-10">
      <div>
        <h2 className="text-sm font-sans tracking-widest text-outline uppercase font-medium">
          Management Console
        </h2>
      </div>

      <div className="flex items-center space-x-6">
        {user && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-primary" />
              <div className="text-right">
                <div className="text-xs font-sans tracking-wider uppercase font-semibold text-on-background">
                  {user.full_name}
                </div>
                <div className="text-[10px] font-sans tracking-widest uppercase text-outline">
                  {user.role}
                </div>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="p-2 hover:bg-surface-container text-red-600 transition-colors uppercase text-xs font-sans tracking-widest"
              aria-label="Logout"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
