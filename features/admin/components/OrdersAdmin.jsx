import { useState, useEffect } from 'react';
import { Check, Eye, X, User, Phone, Mail, MapPin, Calendar, Package } from 'lucide-react';
import { api } from '@/shared/lib/api';
import Pagination from '@/shared/components/Pagination';
import { formatPrice } from '@/shared/utils/currency';

const PAGE_SIZE = 12;

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    api.getAdminOrders()
      .then(res => setOrders(res.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(orders.length / PAGE_SIZE);
  const paginatedOrders = orders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleComplete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const updated = await api.completeOrder(id);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: updated.status || 'completed' } : o));
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder(prev => prev ? { ...prev, status: updated.status || 'completed' } : null);
      }
    } catch {
      alert('Failed to complete order.');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest mb-8">
        Order Logs
      </h1>

      {loading ? (
        <div className="bg-white border border-surface-container overflow-hidden animate-pulse">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-surface-container/50 border-b border-surface-container uppercase tracking-widest text-[10px] text-outline font-bold">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items Summary</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-surface-container/60">
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-8"></div></td>
                  <td className="p-4">
                    <div className="h-4 bg-slate-200 rounded w-1/2 mb-1"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  </td>
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-2/3"></div></td>
                  <td className="p-4 text-right"><div className="h-4 bg-slate-200 rounded w-12 ml-auto"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-12 mx-auto"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-12 mx-auto"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-surface-container overflow-hidden">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-surface-container/50 border-b border-surface-container uppercase tracking-widest text-[10px] text-outline font-bold">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items Summary</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((o) => (
                <tr 
                  key={o.id} 
                  onClick={() => setSelectedOrder(o)}
                  className="border-b border-surface-container/60 hover:bg-surface-container/20 transition-colors cursor-pointer"
                >
                  <td className="p-4 font-bold text-on-background">#{o.id}</td>
                  <td className="p-4">
                    <div className="font-semibold text-on-background">{o.customer_name}</div>
                    <div className="text-[10px] text-outline">{o.customer_email}</div>
                  </td>
                  <td className="p-4 text-outline max-w-xs truncate">{o.items_summary}</td>
                  <td className="p-4 text-right font-bold">{formatPrice(o.total_amount)}</td>
                  <td className="p-4 text-center">
                    <span className={`text-[10px] px-2.5 py-1 tracking-wider uppercase font-bold ${
                      o.status === 'completed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); }}
                        className="p-1.5 text-outline hover:text-primary transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {o.status === 'pending' && (
                        <button 
                          onClick={(e) => handleComplete(o.id, e)}
                          className="bg-primary hover:bg-primary-container text-white text-[10px] font-sans tracking-widest uppercase px-3 py-1 flex items-center space-x-1 font-medium"
                        >
                          <Check className="w-3 h-3" />
                          <span>Complete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-surface-container shadow-2xl p-6 relative animate-slide-in">
            <button 
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-2 text-outline hover:text-on-background transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-surface-container pb-4 mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-serif text-primary uppercase font-bold tracking-widest">
                  Order #{selectedOrder.id}
                </h2>
                <span className={`text-[10px] px-2.5 py-1 tracking-wider uppercase font-bold ${
                  selectedOrder.status === 'completed' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div className="text-xs text-outline font-sans mt-1 flex items-center space-x-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Placed on: {selectedOrder.order_date ? new Date(selectedOrder.order_date).toLocaleString() : 'N/A'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Customer Info */}
              <div className="bg-surface-container/20 p-4 border border-surface-container/60 space-y-2">
                <h3 className="text-xs font-sans tracking-widest uppercase font-bold text-primary flex items-center space-x-1.5 border-b border-surface-container pb-2 mb-2">
                  <User className="w-4 h-4" />
                  <span>Customer Info</span>
                </h3>
                <div className="text-xs font-sans space-y-1">
                  <div className="font-semibold text-on-background">{selectedOrder.customer_name}</div>
                  <div className="text-outline flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-outline/70" />
                    <span>{selectedOrder.customer_email || 'N/A'}</span>
                  </div>
                  {selectedOrder.phone && (
                    <div className="text-outline flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-outline/70" />
                      <span>{selectedOrder.phone}</span>
                    </div>
                  )}
                </div>

                {/* Account Link Info */}
                <div className="mt-3 pt-3 border-t border-surface-container/40">
                  <div className="text-[10px] font-sans tracking-widest uppercase font-bold text-outline">Account Details</div>
                  {selectedOrder.account ? (
                    <div className="text-xs font-sans mt-1 space-y-1 bg-white p-2 border border-surface-container/40">
                      <div><span className="font-semibold text-on-background">Account ID:</span> #{selectedOrder.account.id}</div>
                      <div><span className="font-semibold text-on-background">Name:</span> {selectedOrder.account.full_name}</div>
                      <div><span className="font-semibold text-on-background">Role:</span> {selectedOrder.account.role}</div>
                      <div><span className="font-semibold text-on-background">Phone:</span> {selectedOrder.account.phone || 'Not provided'}</div>
                      <div><span className="font-semibold text-on-background">Joined:</span> {selectedOrder.account.created_at ? new Date(selectedOrder.account.created_at).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  ) : (
                    <div className="text-[11px] font-sans italic text-outline/70 mt-1">
                      Guest checkout (no registered user account)
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-surface-container/20 p-4 border border-surface-container/60 space-y-2">
                <h3 className="text-xs font-sans tracking-widest uppercase font-bold text-primary flex items-center space-x-1.5 border-b border-surface-container pb-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>Shipping Address</span>
                </h3>
                <div className="text-xs font-sans text-on-background space-y-1">
                  <div>{selectedOrder.shipping_address || 'Address not provided'}</div>
                  {(selectedOrder.city || selectedOrder.postal_code) && (
                    <div className="text-outline">
                      {[selectedOrder.city, selectedOrder.postal_code].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {selectedOrder.phone && (
                    <div className="text-outline pt-2 border-t border-surface-container/40 mt-2">
                      <span className="font-semibold text-on-background">Phone:</span> {selectedOrder.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-6">
              <h3 className="text-xs font-sans tracking-widest uppercase font-bold text-primary flex items-center space-x-1.5 mb-3">
                <Package className="w-4 h-4" />
                <span>Order Items ({selectedOrder.items ? selectedOrder.items.length : 0})</span>
              </h3>
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs font-sans border border-surface-container">
                  <thead>
                    <tr className="bg-surface-container/40 border-b border-surface-container uppercase text-[10px] text-outline font-bold">
                      <th className="p-3">Product</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, index) => (
                      <tr key={item.id || index} className="border-b border-surface-container/40">
                        <td className="p-3 font-medium text-on-background">{item.product_name}</td>
                        <td className="p-3 text-center text-outline">{item.quantity}</td>
                        <td className="p-3 text-right text-outline">{formatPrice(item.price_at_order)}</td>
                        <td className="p-3 text-right font-bold text-on-background">{formatPrice(item.quantity * item.price_at_order)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-xs font-sans text-outline bg-surface-container/10 p-3 border border-surface-container/40">
                  {selectedOrder.items_summary}
                </div>
              )}
            </div>

            {/* Total & Action Footer */}
            <div className="border-t border-surface-container pt-4 flex justify-between items-center">
              <div>
                <div className="text-[10px] font-sans tracking-widest uppercase text-outline">Order Total</div>
                <div className="text-xl font-bold font-mono text-primary">{formatPrice(selectedOrder.total_amount)}</div>
              </div>
              <div className="flex space-x-3">
                {selectedOrder.status === 'pending' && (
                  <button 
                    onClick={() => handleComplete(selectedOrder.id)}
                    className="bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase px-4 py-2 flex items-center space-x-1.5 font-medium"
                  >
                    <Check className="w-4 h-4" />
                    <span>Mark as Completed</span>
                  </button>
                )}
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="bg-surface-container hover:bg-surface-container-high text-on-background text-xs font-sans tracking-widest uppercase px-4 py-2 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
