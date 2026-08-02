import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Package, Calendar, MapPin, ChevronDown, ChevronUp, Check, Crown, Copy, Edit3, Gift } from 'lucide-react';
import { api } from '@/shared/lib/api';
import Pagination from '@/shared/components/Pagination';
import { formatPrice } from '@/shared/utils/currency';

const PAGE_SIZE = 5;

export default function ProfilePage({ user, onUserUpdate, vouchersElement }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Profile editing state
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState(() => ({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  }));
  const [copiedRef, setCopiedRef] = useState(false);

  // Address editing state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState(() => ({
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    postal_code: user?.postal_code || '',
  }));
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      api.getMyOrders()
        .then((data) => {
          setOrders(data || []);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Failed to load order history.");
          setLoading(false);
        });
    }
  }, [user]);

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.updateProfile(infoForm);
      if (res && res.user) {
        if (onUserUpdate) onUserUpdate(res.user);
        setIsEditingInfo(false);
      }
    } catch (err) {
      alert("Failed to update profile info: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setSaveSuccess(false);

    try {
      const res = await api.updateProfile(addressForm);
      if (res && res.user) {
        if (onUserUpdate) onUserUpdate(res.user);
        setSaveSuccess(true);
        setIsEditingAddress(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      alert("Failed to save profile info: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCopyReferral = () => {
    if (!user?.referral_code) return;
    const url = `${window.location.origin}/register?ref=${user.referral_code}`;
    navigator.clipboard.writeText(url);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-24 mt-12 grid grid-cols-1 md:grid-cols-3 gap-12">
      {/* Profile details column */}
      <div className="space-y-6 self-start">
        {/* Quick Link to Rewards */}
        <Link
          to="/rewards"
          className="bg-primary/10 border border-primary/30 p-4 block hover:bg-primary/20 transition-colors shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-primary" />
              <span className="text-xs font-serif font-bold uppercase tracking-wider text-primary">Diya Rewards Club</span>
            </div>
            <span className="text-xs font-sans text-primary group-hover:translate-x-1 transition-transform">→</span>
          </div>
          <p className="text-[10px] font-sans text-outline mt-1">
            View your point balance, active reward vouchers & tier status.
          </p>
        </Link>

        <div className="bg-white border border-surface-container/60 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-6 border-b border-surface-container">
            <div>
              <h1 className="text-xl font-serif text-primary uppercase font-bold tracking-widest">
                My Account
              </h1>
              <p className="text-[10px] font-sans tracking-widest text-outline uppercase mt-0.5">
                Personal profile details
              </p>
            </div>
            <button
              onClick={() => setIsEditingInfo(!isEditingInfo)}
              className="text-[10px] font-sans tracking-widest uppercase text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingInfo ? 'Cancel' : 'Edit'}</span>
            </button>
          </div>

          {!isEditingInfo ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 border-b border-surface-container/30 pb-2">
                <User className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="block text-[9px] font-sans tracking-widest uppercase text-outline">Full Name</span>
                  <span className="text-xs font-sans font-medium text-on-background truncate block">{user.full_name}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 border-b border-surface-container/30 pb-2">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="block text-[9px] font-sans tracking-widest uppercase text-outline">Email Address</span>
                  <span className="text-xs font-sans font-medium text-on-background truncate block">{user.email}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 border-b border-surface-container/30 pb-2">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="block text-[9px] font-sans tracking-widest uppercase text-outline">Phone Number</span>
                  <span className="text-xs font-sans font-medium text-on-background block">{user.phone || 'Not provided'}</span>
                </div>
              </div>

              {/* Birth Date (Immutable once set) */}
              <div className="flex items-center space-x-3 border-b border-surface-container/30 pb-2">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="block text-[9px] font-sans tracking-widest uppercase text-outline flex items-center justify-between">
                    <span>Date of Birth</span>
                    {user.birth_date && (
                      <span className="text-[8px] text-amber-800 bg-amber-50 px-1.5 py-0.5 border border-amber-200 uppercase font-semibold">
                        Locked
                      </span>
                    )}
                  </span>
                  {user.birth_date ? (
                    <span className="text-xs font-sans font-medium text-on-background block">
                      {user.birth_date}
                    </span>
                  ) : (
                    <div className="mt-1 flex items-center space-x-2">
                      <input
                        type="date"
                        required
                        max={new Date().toISOString().split('T')[0]}
                        onChange={async (e) => {
                          const val = e.target.value;
                          if (val) {
                            try {
                              const res = await api.updateProfile({ birth_date: val });
                              if (res && res.user && onUserUpdate) {
                                onUserUpdate(res.user);
                              }
                            } catch (err) {
                              alert("Failed to set birthdate: " + err.message);
                            }
                          }
                        }}
                        className="text-xs font-sans p-1 border border-surface-container rounded bg-surface text-on-background"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Referral Code & Share Link */}
              <div className="flex items-start space-x-3 border-b border-surface-container/30 pb-2">
                <Gift className="w-4 h-4 text-primary shrink-0 mt-1" />
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="block text-[9px] font-sans tracking-widest uppercase text-outline">Referral Code & Link</span>
                  <div className="flex items-center justify-between gap-2 bg-surface p-2 border border-surface-container">
                    <span className="text-xs font-mono font-bold text-primary truncate">{user.referral_code || '---'}</span>
                    <button
                      type="button"
                      onClick={handleCopyReferral}
                      className="bg-primary text-white text-[9px] font-sans uppercase tracking-widest px-2.5 py-1 font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedRef ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedRef ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveInfo} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-outline mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={infoForm.full_name}
                  onChange={(e) => setInfoForm({ ...infoForm, full_name: e.target.value })}
                  className="w-full p-2 border border-surface-container text-xs focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-outline mb-1">Phone Number</label>
                <input
                  type="text"
                  value={infoForm.phone}
                  onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
                  placeholder="+966 5X XXX XXXX"
                  className="w-full p-2 border border-surface-container text-xs focus:outline-hidden"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex-1 bg-primary text-white text-[10px] uppercase tracking-widest py-2 font-medium hover:bg-primary-container transition-colors cursor-pointer"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="px-3 border border-surface-container text-[10px] uppercase tracking-widest py-2 hover:bg-surface-container/50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Shipping Address Box */}
        <div className="bg-white border border-surface-container/60 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-surface-container pb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-sans uppercase font-bold tracking-widest text-primary">
                Saved Address
              </h2>
            </div>
          </div>

          {saveSuccess && (
            <div className="flex items-center space-x-2 text-xs text-green-700 bg-green-50 p-2.5 border border-green-200">
              <Check className="w-4 h-4" />
              <span>Address saved!</span>
            </div>
          )}

          {!isEditingAddress ? (
            <div className="space-y-2 text-xs font-sans text-on-background">
              {user.address ? (
                <>
                  <p className="font-medium">{user.address}</p>
                  <p className="text-outline">{user.city}{user.postal_code ? `, ${user.postal_code}` : ''}</p>
                </>
              ) : (
                <p className="text-outline italic text-[11px]">No delivery address saved yet.</p>
              )}
              <button
                onClick={() => setIsEditingAddress(true)}
                className="mt-3 text-[10px] uppercase font-sans tracking-widest text-primary font-bold hover:underline cursor-pointer"
              >
                {user.address ? 'Edit Address' : '+ Add Saved Address'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs font-sans">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-outline mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  placeholder="123 Street Name, Apt 4"
                  className="w-full p-2 border border-surface-container text-xs focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-outline mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="Riyadh"
                    className="w-full p-2 border border-surface-container text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-outline mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={addressForm.postal_code}
                    onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                    placeholder="12345"
                    className="w-full p-2 border border-surface-container text-xs focus:outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-outline mb-1">Phone</label>
                <input
                  type="text"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  placeholder="+966 5X XXX XXXX"
                  className="w-full p-2 border border-surface-container text-xs focus:outline-hidden"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex-1 bg-primary text-white text-[10px] uppercase tracking-widest py-2 font-medium hover:bg-primary-container transition-colors cursor-pointer"
                >
                  {savingProfile ? 'Saving...' : 'Save Address'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(false)}
                  className="px-3 border border-surface-container text-[10px] uppercase tracking-widest py-2 hover:bg-surface-container/50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* My Digital Vouchers Box */}
        {vouchersElement && (
          <div className="bg-white border border-surface-container/60 p-6 shadow-sm">
            {vouchersElement}
          </div>
        )}
      </div>

      {/* Order history column */}
      <div className="md:col-span-2 space-y-6">
        <h2 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest border-b border-surface-container pb-4">
          Order History
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 text-xs font-sans p-4 border border-red-200">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-surface-container/10 border border-dashed border-surface-container/50">
            <Package className="w-12 h-12 text-outline/40 mx-auto mb-4" />
            <p className="text-xs font-sans text-outline uppercase tracking-wider">
              No orders found
            </p>
            <p className="text-[11px] font-sans text-outline/60 mt-1">
              Your purchase history is currently empty.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const totalPages = Math.ceil(orders.length / PAGE_SIZE);
              const paginatedOrders = orders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

              return (
                <>
                  {paginatedOrders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;

                    return (
                      <div 
                        key={order.id} 
                        className={`bg-white border transition-colors ${
                          isExpanded ? 'border-primary shadow-sm' : 'border-surface-container/60 hover:border-primary/50'
                        }`}
                      >
                        {/* Card Header (Click to toggle expansion) */}
                        <div 
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          className="p-5 cursor-pointer flex justify-between items-center"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-3">
                              <span className="text-xs font-sans font-bold text-on-background">Order #{order.id}</span>
                              <span className={`text-[9px] font-sans tracking-wider uppercase px-2 py-0.5 font-bold ${
                                order.status === 'completed' 
                                  ? 'bg-green-50 text-green-700 border border-green-200' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-[11px] text-outline font-sans">
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3.5 h-3.5 text-primary/70" />
                                <span>{new Date(order.order_date).toLocaleDateString()}</span>
                              </span>
                              <span className="truncate max-w-xs">{order.items_summary}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <span className="text-xs font-mono font-bold text-primary">
                              {formatPrice(order.total_amount)}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-outline" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-outline" />
                            )}
                          </div>
                        </div>

                        {/* Expanded Purchase Details */}
                        {isExpanded && (
                          <div className="border-t border-surface-container/60 p-5 bg-surface-container/10 text-xs font-sans space-y-5 animate-admin-view">
                            {/* Items breakdown */}
                            <div>
                              <h4 className="text-[10px] font-sans tracking-widest uppercase text-outline font-bold mb-3">
                                Items Purchased
                              </h4>
                              {order.items && order.items.length > 0 ? (
                                <div className="space-y-2 bg-white p-3 border border-surface-container/40">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-1 border-b border-surface-container/20 last:border-0">
                                      <div>
                                        <span className="font-medium text-on-background">{item.product_name}</span>
                                        <span className="text-outline ml-2">x{item.quantity}</span>
                                      </div>
                                      <span className="font-bold text-on-background font-mono">
                                        {formatPrice(item.price_at_order * item.quantity)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="bg-white p-3 border border-surface-container/40 text-on-background font-medium">
                                  {order.items_summary}
                                </div>
                              )}
                            </div>

                            {/* Delivery & Shipping Info */}
                            {(order.shipping_address || order.city || order.customer_name) && (
                              <div>
                                <h4 className="text-[10px] font-sans tracking-widest uppercase text-outline font-bold mb-2">
                                  Shipping Information
                                </h4>
                                <div className="bg-white p-3 border border-surface-container/40 space-y-1 text-on-background">
                                  <p className="font-semibold">{order.customer_name}</p>
                                  {order.shipping_address && <p className="text-outline">{order.shipping_address}</p>}
                                  {order.city && <p className="text-outline">{order.city}{order.postal_code ? `, ${order.postal_code}` : ''}</p>}
                                  {order.phone && <p className="text-outline">Phone: {order.phone}</p>}
                                </div>
                              </div>
                            )}

                            {/* Financial Summary */}
                            <div className="bg-white p-3 border border-surface-container/40 space-y-1.5 text-outline">
                              <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatPrice(order.total_amount - 15.00 > 0 ? order.total_amount - 15.00 : order.total_amount)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Shipping & handling</span>
                                <span>{formatPrice(order.total_amount - 15.00 > 0 ? 15.00 : 0)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-on-background text-sm pt-2 border-t border-surface-container/40">
                                <span>Total Paid</span>
                                <span className="text-primary font-mono">{formatPrice(order.total_amount)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

