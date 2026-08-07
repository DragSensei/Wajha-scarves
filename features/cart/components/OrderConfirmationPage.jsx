import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, ShoppingBag, User } from 'lucide-react';

export default function OrderConfirmationPage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [orderId] = useState(() => {
    return queryParams.get('order_id') || Math.floor(Math.random() * 9000) + 1000;
  });

  const callmebotDebug = location.state?.callmebot_debug || window.__LAST_CALLMEBOT_DEBUG__;

  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center mt-12">
      <div className="flex justify-center mb-6">
        <CheckCircle className="w-16 h-16 text-primary animate-pulse" />
      </div>

      <h1 className="text-3xl font-serif text-primary uppercase font-bold tracking-widest mb-4">
        Thank You for Your Order
      </h1>
      
      <p className="text-sm font-sans text-outline max-w-md mx-auto mb-8 leading-relaxed">
        Your order <strong className="text-on-background font-bold font-mono">#{orderId}</strong> has been successfully placed. We have sent a confirmation email with details and tracking information.
      </p>

      {/* CallMeBot Client Debug Banner */}
      {callmebotDebug && (
        <div className="bg-amber-950/20 border border-amber-500/40 p-4 rounded-lg max-w-md mx-auto mb-8 text-left text-xs font-mono space-y-1.5">
          <div className="flex items-center justify-between font-bold border-b border-amber-500/30 pb-1.5 text-amber-400">
            <span>📲 CallMeBot WhatsApp Debug Output</span>
            <span className={callmebotDebug.success ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
              {callmebotDebug.success ? "✓ SENT" : "✗ FAILED"}
            </span>
          </div>
          <p className="text-amber-200">
            <span className="text-amber-400 font-semibold">Message/Error:</span> {callmebotDebug.message || callmebotDebug.error || 'N/A'}
          </p>
          {callmebotDebug.formatted_phone && (
            <p className="text-amber-200">
              <span className="text-amber-400 font-semibold">Target Phone:</span> {callmebotDebug.formatted_phone}
            </p>
          )}
          {callmebotDebug.url_called && (
            <p className="text-amber-200 truncate">
              <span className="text-amber-400 font-semibold">API Endpoint:</span> {callmebotDebug.url_called}
            </p>
          )}
          {callmebotDebug.response_body && (
            <p className="text-amber-200 bg-black/40 p-2 rounded text-[11px] break-words">
              <span className="text-amber-400 font-semibold">CallMeBot Server Reply:</span> {callmebotDebug.response_body}
            </p>
          )}
        </div>
      )}

      <div className="bg-surface-container/30 border border-surface-container/60 p-6 rounded-xs max-w-sm mx-auto mb-10 text-left space-y-3">
        <h3 className="text-xs font-sans tracking-widest uppercase font-bold text-primary border-b border-surface-container/60 pb-2">
          Secure Shipping
        </h3>
        <p className="text-[11px] text-outline font-sans leading-relaxed">
          Orders are prepared within 24-48 hours. Shipping takes 2-5 business days across the Gulf region.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-sm mx-auto">
        <Link 
          to="/" 
          className="w-full sm:w-auto bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase px-6 py-3.5 flex items-center justify-center space-x-2 font-medium"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>

        <Link 
          to="/profile" 
          className="w-full sm:w-auto border border-primary text-primary hover:bg-primary/5 text-xs font-sans tracking-widest uppercase px-6 py-3.5 flex items-center justify-center space-x-2 font-medium"
        >
          <User className="w-4 h-4" />
          <span>View My Account</span>
        </Link>
      </div>
    </div>
  );
}
