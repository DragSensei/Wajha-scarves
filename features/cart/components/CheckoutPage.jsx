import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react';
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

  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.discount_active ? item.discounted_price : item.original_price;
    return acc + price * item.quantity;
  }, 0);
  const shipping = 15.00;
  const total = subtotal + shipping;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      order_items: orderItems
    };

    try {
      const res = await api.createOrder(orderData);
      if (res.success) {
        onClearCart();
        navigate(`/order-confirmation?order_id=${res.order_id}`);
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

        {/* Order Summary */}
        <div className="bg-surface-container/30 p-8 border border-surface-container">
          <h2 className="text-lg font-serif text-on-background font-medium mb-6">
            Summary of Purchase
          </h2>

          <div className="space-y-4 max-h-96 overflow-y-auto mb-6 pr-2">
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

          <div className="border-t border-surface-container/60 pt-6 space-y-3">
            <div className="flex justify-between text-xs font-sans text-outline">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs font-sans text-outline">
              <span>Shipping & duties</span>
              <span>{formatPrice(shipping)}</span>
            </div>
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
