import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, ShieldCheck, Award } from 'lucide-react';
import { api } from '@/shared/lib/api';
import { formatPrice } from '@/shared/utils/currency';

export default function CheckoutPage({ cartItems, onClearCart, user }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    address: user?.address || '',
    city: user?.city || '',
    postalCode: user?.postal_code || '',
    phone: user?.phone || ''
  });
  const [loading, setLoading] = useState(false);

  // Gift Card State
  const [giftCardInput, setGiftCardInput] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState(null);
  const [giftCardLoading, setGiftCardLoading] = useState(false);
  const [giftCardError, setGiftCardError] = useState('');

  // Loyalty Voucher State
  const [activeVouchers, setActiveVouchers] = useState([]);
  const [selectedVoucherId, setSelectedVoucherId] = useState('');

  useEffect(() => {
    let active = true;
    api.getLoyaltyStatus()
      .then((res) => {
        if (active) {
          const list = res?.active_vouchers || res?.vouchers || [];
          const available = list.filter((v) => !v.redeemed);
          setActiveVouchers(available);
          if (available.length > 0) {
            setSelectedVoucherId(String(available[0].id));
          }
        }
      })
      .catch(() => { if (active) setActiveVouchers([]); });
    return () => { active = false; };
  }, []);

  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.discount_active ? item.discounted_price : item.original_price;
    return acc + price * item.quantity;
  }, 0);
  const shipping = 15.00;
  const rawTotal = subtotal + shipping;

  const giftDiscount = appliedGiftCard ? Math.min(rawTotal, appliedGiftCard.value) : 0;
  const remainingAfterGift = Math.max(0, rawTotal - giftDiscount);

  const selectedVoucher = activeVouchers.find((v) => String(v.id) === String(selectedVoucherId));
  const voucherDiscount = selectedVoucher ? Math.min(remainingAfterGift, selectedVoucher.value) : 0;

  const total = Math.max(0, remainingAfterGift - voucherDiscount);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleApplyGiftCard = async (e) => {
    e.preventDefault();
    if (!giftCardInput.trim()) return;
    setGiftCardLoading(true);
    setGiftCardError('');

    try {
      const res = await api.validateGiftCard(giftCardInput.trim());
      if (res && res.valid) {
        setAppliedGiftCard(res);
        setGiftCardError('');
      }
    } catch (err) {
      setGiftCardError(err.message || 'Invalid or expired gift card.');
      setAppliedGiftCard(null);
    } finally {
      setGiftCardLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    setLoading(true);

    const itemsSummary = cartItems.map(i => `${i.name} (x${i.quantity})`).join(', ');
    const orderItems = cartItems.map(i => ({
      product_id: i.id,
      name: i.name,
      quantity: i.quantity,
      price: i.discount_active ? i.discounted_price : i.original_price
    }));

    const orderData = {
      name: formData.name,
      email: formData.email,
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      phone: formData.phone,
      total: total,
      items: itemsSummary,
      order_items: orderItems,
      gift_card_code: appliedGiftCard ? appliedGiftCard.code : undefined,
      voucher_id: selectedVoucher ? selectedVoucher.id : undefined
    };

    try {
      const res = await api.createOrder(orderData);
      if (res.success) {
        onClearCart();
        if (res.callmebot_debug) {
          console.log('%c[CallMeBot Debug Output]:', 'background: #059669; color: white; font-weight: bold; padding: 2px 6px;', res.callmebot_debug);
          try {
            window.__LAST_CALLMEBOT_DEBUG__ = res.callmebot_debug;
          } catch (err) {
            console.debug(err);
          }
        }
        navigate(`/order-confirmation?order_id=${res.order_id}`, { state: { callmebot_debug: res.callmebot_debug } });
      }
    } catch (error) {
      alert("Failed to submit checkout: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <Link 
        to="/" 
        className="flex items-center space-x-2 text-xs font-sans tracking-widest uppercase text-outline hover:text-primary mb-12"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to shopping bag</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Shipping Form */}
        <div>
          <h2 className="text-xl font-serif text-on-background font-medium mb-8">
            Shipping Information
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b border-outline/30 pb-2">
              <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                Full Name
              </label>
              <input 
                type="text" 
                name="name" 
                required 
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name" 
                className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
              />
            </div>

            <div className="border-b border-outline/30 pb-2">
              <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                Email Address
              </label>
              <input 
                type="email" 
                name="email" 
                required 
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address" 
                className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
              />
            </div>

            <div className="border-b border-outline/30 pb-2">
              <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                Delivery Address
              </label>
              <input 
                type="text" 
                name="address" 
                required 
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address, apartment, suite" 
                className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  City
                </label>
                <input 
                  type="text" 
                  name="city" 
                  required 
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City" 
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
              </div>

              <div className="border-b border-outline/30 pb-2">
                <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                  Postal Code
                </label>
                <input 
                  type="text" 
                  name="postalCode" 
                  required 
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="ZIP / Postal Code" 
                  className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
                />
              </div>
            </div>

            <div className="border-b border-outline/30 pb-2">
              <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                Phone Number
              </label>
              <input 
                type="text" 
                name="phone" 
                required 
                value={formData.phone}
                onChange={handleChange}
                placeholder="+966 5X XXX XXXX" 
                className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
              />
            </div>

            {/* Payment Details */}
            <div className="pt-6">
              <h3 className="text-sm font-sans tracking-widest uppercase text-on-background font-bold mb-4 flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Payment Method</span>
              </h3>
              <div className="border border-surface-container p-4 bg-surface-container/20 flex justify-between items-center">
                <div className="text-xs font-sans tracking-wider text-outline uppercase font-medium">
                  Cash on Delivery (COD) / Mada Card Simulation
                </div>
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || cartItems.length === 0}
              className="w-full bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase py-4 transition-colors font-medium mt-8"
            >
              {loading ? 'Processing transaction...' : 'Place order'}
            </button>
          </form>
        </div>

        {/* Order Summary & Gift Card Application */}
        <div className="bg-surface-container/30 p-8 border border-surface-container space-y-6">
          <h2 className="text-lg font-serif text-on-background font-medium">
            Summary of Purchase
          </h2>

          <div className="space-y-4 max-h-72 overflow-y-auto pr-2 border-b border-surface-container/60 pb-4">
            {cartItems.map((item) => {
              const price = item.discount_active ? item.discounted_price : item.original_price;
              return (
                <div key={item.id} className="flex justify-between items-center text-xs font-sans">
                  <div>
                    <span className="font-medium text-on-background">{item.name}</span>
                    <span className="text-outline pl-2">x{item.quantity}</span>
                  </div>
                  <span className="font-bold text-on-background">{formatPrice(price * item.quantity)}</span>
                </div>
              );
            })}
          </div>

          {/* Gift Card Application Form */}
          <div className="space-y-2 pt-2 border-b border-surface-container/60 pb-6">
            <label className="block text-[10px] font-sans tracking-widest uppercase text-outline">
              Gift Card Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 16-character code"
                value={giftCardInput}
                onChange={(e) => setGiftCardInput(e.target.value.toUpperCase())}
                disabled={!!appliedGiftCard}
                className="flex-grow text-xs font-mono border border-outline/30 px-3 py-2 bg-white focus:outline-hidden text-on-background uppercase tracking-wider"
              />
              {appliedGiftCard ? (
                <button
                  type="button"
                  onClick={() => { setAppliedGiftCard(null); setGiftCardInput(''); }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-sans px-3 py-2 font-bold uppercase transition-colors"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyGiftCard}
                  disabled={giftCardLoading || !giftCardInput.trim()}
                  className="bg-primary hover:bg-primary-container text-white text-xs font-sans px-4 py-2 uppercase tracking-wider font-semibold transition-colors disabled:opacity-50"
                >
                  {giftCardLoading ? 'Validating...' : 'Apply'}
                </button>
              )}
            </div>

            {giftCardError && (
              <p className="text-[11px] font-sans text-red-600 font-medium">{giftCardError}</p>
            )}
            {appliedGiftCard && (
              <p className="text-[11px] font-sans text-green-700 font-medium flex items-center gap-1">
                ✓ Gift card <span className="font-mono">{appliedGiftCard.code}</span> applied ({formatPrice(appliedGiftCard.value)} discount).
              </p>
            )}
          </div>
          {/* Active Reward Vouchers Application */}
          {activeVouchers.length > 0 && (
            <div className="space-y-2 pt-2 border-b border-surface-container/60 pb-6">
              <label className="block text-[10px] font-sans tracking-widest uppercase text-outline font-bold flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-primary" />
                <span>Apply Active Reward Voucher ({activeVouchers.length})</span>
              </label>
              <select
                value={selectedVoucherId}
                onChange={(e) => setSelectedVoucherId(e.target.value)}
                className="w-full text-xs font-sans border border-outline/30 px-3 py-2 bg-white text-on-background focus:outline-hidden"
              >
                <option value="">-- Do not apply a voucher --</option>
                {activeVouchers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {formatPrice(v.value)} Voucher ({v.source.replace('_', ' ')}) — Expires {v.expires_at ? new Date(v.expires_at).toLocaleDateString() : 'Never'}
                  </option>
                ))}
              </select>
              {selectedVoucher && (
                <p className="text-[11px] font-sans text-green-700 font-medium flex items-center gap-1">
                  ✓ {formatPrice(selectedVoucher.value)} voucher applied ({formatPrice(voucherDiscount)} discount).
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between text-xs font-sans text-outline">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs font-sans text-outline">
              <span>Shipping & duties</span>
              <span>{formatPrice(shipping)}</span>
            </div>
            {giftDiscount > 0 && (
              <div className="flex justify-between text-xs font-sans text-green-700 font-bold">
                <span>Gift Card Discount</span>
                <span>-{formatPrice(giftDiscount)}</span>
              </div>
            )}
            {voucherDiscount > 0 && (
              <div className="flex justify-between text-xs font-sans text-green-700 font-bold">
                <span>Reward Voucher Discount</span>
                <span>-{formatPrice(voucherDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-sans text-on-background font-bold pt-3 border-t border-surface-container">
              <span>Total amount</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
