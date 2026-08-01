import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export default function NotificationToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNotification = (e) => {
      const { id, type, title, message } = e.detail;
      const newToast = { id, type, title, message };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove toast after 4.5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    };

    window.addEventListener('diya-notification', handleNotification);
    return () => window.removeEventListener('diya-notification', handleNotification);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 bg-white border shadow-xl flex items-start space-x-3 text-xs font-sans transition-all duration-300 transform translate-y-0 opacity-100 ${
              isError
                ? 'border-l-4 border-l-red-600 border-surface-container text-on-background'
                : isSuccess
                ? 'border-l-4 border-l-green-600 border-surface-container text-on-background'
                : 'border-l-4 border-l-amber-500 border-surface-container text-on-background'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isError && <AlertCircle className="w-5 h-5 text-red-600" />}
              {isSuccess && <CheckCircle className="w-5 h-5 text-green-600" />}
              {!isError && !isSuccess && <Info className="w-5 h-5 text-amber-500" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-serif font-bold uppercase tracking-wider text-xs text-primary mb-1">
                {toast.title}
              </h4>
              <p className="text-outline leading-relaxed text-[11px] font-sans">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-outline hover:text-on-background cursor-pointer p-0.5"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
