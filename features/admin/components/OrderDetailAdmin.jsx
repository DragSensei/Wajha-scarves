import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Check, Calendar, User, Phone, Mail, MapPin, 
  Package, Tag, CreditCard, Image as ImageIcon, Code, Clock 
} from 'lucide-react';
import { api } from '@/shared/lib/api';
import { formatPrice } from '@/shared/utils/currency';

export default function OrderDetailAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    api.getAdminOrder(id)
      .then((data) => {
        if (isMounted) {
          setOrder(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load order details.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleComplete = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      const updated = await api.completeOrder(order.id);
      setOrder((prev) => ({
        ...prev,
        status: updated.status || 'completed'
      }));
    } catch {
      alert('Failed to update order status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto font-sans animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-48 mb-6"></div>
        <div className="h-8 bg-slate-200 rounded w-64 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="h-48 bg-slate-200 rounded"></div>
          <div className="h-48 bg-slate-200 rounded"></div>
          <div className="h-48 bg-slate-200 rounded"></div>
        </div>
        <div className="h-64 bg-slate-200 rounded"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 max-w-4xl mx-auto font-sans">
        <button
          onClick={() => navigate('/admin/orders')}
          className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-outline hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded text-sm font-medium">
          {error || 'Order not found'}
        </div>
      </div>
    );
  }

  const subtotal = order.subtotal_amount || order.items?.reduce((acc, i) => acc + (i.quantity * i.price_at_order), 0) || order.total_amount;
  const discount = order.discount_amount || 0;

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans space-y-8 animate-fade-in">
      {/* Navigation & Breadcrumb */}
      <div className="flex items-center justify-between border-b border-surface-container/60 pb-4">
        <div className="flex items-center space-x-3 text-xs font-sans tracking-widest uppercase text-outline">
          <Link to="/admin/orders" className="hover:text-primary transition-colors font-semibold flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Orders History
          </Link>
          <span>/</span>
          <span className="text-on-background font-bold">Order #{order.id}</span>
        </div>
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="text-xs font-sans tracking-wider uppercase px-3 py-1.5 border border-surface-container/80 hover:bg-surface-container/40 transition-colors flex items-center space-x-1.5 text-outline cursor-pointer"
        >
          <Code className="w-3.5 h-3.5" />
          <span>{showRawJson ? 'Hide Audit Log' : 'View Audit Log'}</span>
        </button>
      </div>

      {/* Header Info */}
      <div className="bg-white border border-surface-container p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest">
              Order #{order.id}
            </h1>
            <span className={`text-[10px] px-3 py-1 tracking-wider uppercase font-bold ${
              order.status === 'completed' 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
            }`}>
              {order.status}
            </span>
          </div>
          <div className="text-xs text-outline flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-outline/70" />
              <span>Placed on: {order.order_date ? new Date(order.order_date).toLocaleString() : 'N/A'}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-outline/70" />
              <span>System Record ID: #{order.id}</span>
            </span>
          </div>
        </div>

        {order.status === 'pending' && (
          <button
            onClick={handleComplete}
            disabled={updating}
            className="bg-primary hover:bg-primary-container text-white text-xs tracking-widest uppercase font-semibold px-5 py-2.5 flex items-center space-x-2 transition-colors self-start md:self-auto cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{updating ? 'Updating...' : 'Mark as Completed'}</span>
          </button>
        )}
      </div>

      {/* Details Grid: Customer, Shipping, Voucher/Financials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Information Card */}
        <div className="bg-white border border-surface-container p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-surface-container/60 pb-3">
            <User className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-sans tracking-widest uppercase font-bold text-primary">Customer Profile</h2>
          </div>
          <div className="text-xs space-y-2">
            <div>
              <div className="text-[10px] uppercase font-bold text-outline tracking-wider">Name</div>
              <div className="font-semibold text-on-background">{order.customer_name}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-outline tracking-wider">Email</div>
              <div className="text-on-background flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-outline/70" />
                <span>{order.customer_email || 'N/A'}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-outline tracking-wider">Phone</div>
              <div className="text-on-background flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-outline/70" />
                <span>{order.phone || 'N/A'}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-surface-container/40">
              <div className="text-[10px] uppercase font-bold text-outline tracking-wider">Account Binding</div>
              {order.account ? (
                <div className="mt-1.5 bg-surface-container/20 p-2.5 border border-surface-container/60 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-on-background">User ID: #{order.account.id}</span>
                    <span className="bg-primary/10 text-primary px-1.5 py-0.5 uppercase text-[9px] font-bold">{order.account.role}</span>
                  </div>
                  <div className="text-[11px] text-outline">Joined: {order.account.created_at ? new Date(order.account.created_at).toLocaleDateString() : 'N/A'}</div>
                  {order.account.referral_code && (
                    <div className="text-[11px] text-outline">Referral Code: <span className="font-mono font-bold text-on-background">{order.account.referral_code}</span></div>
                  )}
                </div>
              ) : (
                <div className="text-[11px] italic text-outline/70 mt-1">Guest Checkout (No registered account)</div>
              )}
            </div>
          </div>
        </div>

        {/* Shipping Address Card */}
        <div className="bg-white border border-surface-container p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-surface-container/60 pb-3">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-sans tracking-widest uppercase font-bold text-primary">Shipping Address</h2>
          </div>
          <div className="text-xs space-y-2 text-on-background">
            <div>
              <div className="text-[10px] uppercase font-bold text-outline tracking-wider">Destination</div>
              <div className="font-medium mt-0.5 leading-relaxed">{order.shipping_address || 'Address not provided'}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-outline tracking-wider">City / Postal Code</div>
              <div className="text-outline mt-0.5">
                {[order.city, order.postal_code].filter(Boolean).join(', ') || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-outline tracking-wider">Delivery Contact Phone</div>
              <div className="text-outline mt-0.5">{order.phone || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Financial & Voucher Summary Card */}
        <div className="bg-white border border-surface-container p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-surface-container/60 pb-3">
            <CreditCard className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-sans tracking-widest uppercase font-bold text-primary">Voucher & Financial Summary</h2>
          </div>
          <div className="text-xs space-y-2.5">
            <div className="flex justify-between items-center text-outline">
              <span>Items Subtotal:</span>
              <span className="font-semibold text-on-background">{formatPrice(subtotal)}</span>
            </div>

            {/* Voucher / Discount row */}
            <div className="flex justify-between items-center pt-2 border-t border-surface-container/40">
              <span className="flex items-center space-x-1 font-medium text-outline">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <span>Voucher / Discount:</span>
              </span>
              <span className={`font-bold ${discount > 0 ? 'text-green-700' : 'text-outline'}`}>
                {discount > 0 ? `-${formatPrice(discount)}` : 'None applied'}
              </span>
            </div>

            {order.voucher_code && (
              <div className="bg-green-50 border border-green-200 p-2 text-[11px] font-sans text-green-800 flex items-center justify-between">
                <span className="font-bold">Code / Ref:</span>
                <span className="font-mono font-bold tracking-wider">{order.voucher_code}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-surface-container font-bold text-base text-primary">
              <span>Total Paid:</span>
              <span className="font-mono text-lg">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Purchased Items Table with Mini Pictures */}
      <div className="bg-white border border-surface-container shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-surface-container/60 pb-3">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-sans tracking-widest uppercase font-bold text-primary">
              Purchased Items ({order.items ? order.items.length : 0})
            </h2>
          </div>
        </div>

        {order.items && order.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-surface-container/40 border-b border-surface-container uppercase text-[10px] text-outline font-bold tracking-wider">
                  <th className="p-3 w-16 text-center">Picture</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={item.id || index} className="border-b border-surface-container/40 hover:bg-surface-container/20 transition-colors">
                    <td className="p-3 text-center">
                      <div className="w-12 h-12 bg-surface-container/40 border border-surface-container flex items-center justify-center overflow-hidden mx-auto">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.product_name || 'Product'} 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-outline/50" />
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-on-background">{item.product_name}</div>
                      {item.product_id && (
                        <div className="text-[10px] text-outline mt-0.5">Product ID: #{item.product_id}</div>
                      )}
                    </td>
                    <td className="p-3 text-center font-bold text-on-background">{item.quantity}</td>
                    <td className="p-3 text-right text-outline">{formatPrice(item.price_at_order)}</td>
                    <td className="p-3 text-right font-bold text-primary">{formatPrice(item.quantity * item.price_at_order)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-surface-container/20 border border-surface-container/60 text-xs text-outline italic">
            Summary: {order.items_summary}
          </div>
        )}
      </div>

      {/* Raw Audit Data Inspector */}
      {showRawJson && (
        <div className="bg-slate-900 text-slate-100 p-6 border border-slate-700 shadow-xl text-xs font-mono rounded space-y-2">
          <div className="flex justify-between items-center border-b border-slate-700 pb-2 text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">Complete Order Audit Payload</span>
            <span>JSON Payload</span>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap max-h-96">
            {JSON.stringify(order, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
