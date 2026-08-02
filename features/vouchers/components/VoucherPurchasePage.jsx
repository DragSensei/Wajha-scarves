import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/shared/lib/api';
import { formatPrice } from '@/shared/utils/currency';
import VoucherCardPreview from './VoucherCardPreview';
import { Gift, Check, Copy, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

const DENOMINATIONS = [100, 200, 500, 1000, 2000];

export default function VoucherPurchasePage({ user }) {
  const navigate = useNavigate();
  const [selectedValue, setSelectedValue] = useState(500);
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [buyerName, setBuyerName] = useState(user?.full_name || '');
  const [buyerEmail, setBuyerEmail] = useState(user?.email || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdVoucher, setCreatedVoucher] = useState(null);
  const [copied, setCopied] = useState(false);

  const handlePurchase = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      value: selectedValue,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      recipient_name: isGift ? recipientName : (buyerName || 'Self'),
      recipient_email: isGift ? recipientEmail : buyerEmail,
      gift_message: isGift ? giftMessage : ''
    };

    try {
      const res = await api.buyVoucher(payload);
      if (res && res.voucher) {
        setCreatedVoucher(res.voucher);
      }
    } catch (err) {
      setError(err.message || 'Failed to purchase voucher. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-surface/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-serif font-bold uppercase tracking-widest">
            <Gift className="w-4 h-4" />
            <span>Digital Gift Vouchers</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-primary tracking-tight">
            Give the Gift of Elegance
          </h1>
          <p className="text-sm font-sans text-outline leading-relaxed">
            Select a voucher amount redeemable on all Diya luxury scarves and accessories. Send directly to someone special or treat yourself.
          </p>
        </div>

        {/* Main Grid: Form + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Customizer & Purchase Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-surface-container rounded-2xl p-6 sm:p-8 space-y-8 shadow-xs">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 border border-red-200 text-xs font-sans rounded-xl">
                {error}
              </div>
            )}

            {/* 1. Denomination Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-serif font-bold uppercase tracking-widest text-primary">
                1. Select Voucher Value (EGP)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {DENOMINATIONS.map((val) => {
                  const isSelected = selectedValue === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSelectedValue(val)}
                      className={`py-3 px-2 rounded-xl text-center transition-all cursor-pointer border text-xs font-sans font-bold ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-md scale-[1.02]'
                          : 'bg-surface hover:bg-surface-container/50 border-surface-container text-on-background'
                      }`}
                    >
                      <span className="block text-sm font-serif">{val}</span>
                      <span className="text-[10px] opacity-80 uppercase tracking-tighter">EGP</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Recipient Option */}
            <div className="space-y-3 border-t border-surface-container pt-6">
              <label className="block text-xs font-serif font-bold uppercase tracking-widest text-primary">
                2. Who is this voucher for?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-sans cursor-pointer">
                  <input
                    type="radio"
                    name="voucher_target"
                    checked={!isGift}
                    onChange={() => setIsGift(false)}
                    className="accent-primary"
                  />
                  <span className="font-semibold text-on-background">For Myself</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-sans cursor-pointer">
                  <input
                    type="radio"
                    name="voucher_target"
                    checked={isGift}
                    onChange={() => setIsGift(true)}
                    className="accent-primary"
                  />
                  <span className="font-semibold text-on-background">Send as a Gift</span>
                </label>
              </div>
            </div>

            {/* 3. Form Fields */}
            <form onSubmit={handlePurchase} className="space-y-4 border-t border-surface-container pt-6">
              {isGift && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                        Recipient Name *
                      </label>
                      <input
                        type="text"
                        required={isGift}
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="e.g. Sarah Ahmed"
                        className="w-full text-xs font-sans border border-outline/30 rounded-lg px-3 py-2.5 focus:outline-hidden focus:border-primary text-on-background"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                        Recipient Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="sarah@example.com"
                        className="w-full text-xs font-sans border border-outline/30 rounded-lg px-3 py-2.5 focus:outline-hidden focus:border-primary text-on-background"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                      Personalized Message (Optional)
                    </label>
                    <textarea
                      rows={3}
                      maxLength={180}
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="Wishing you elegance and warmth on your special day..."
                      className="w-full text-xs font-sans border border-outline/30 rounded-lg px-3 py-2.5 focus:outline-hidden focus:border-primary text-on-background resize-none"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full text-xs font-sans border border-outline/30 rounded-lg px-3 py-2.5 focus:outline-hidden focus:border-primary text-on-background"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
                    Your Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full text-xs font-sans border border-outline/30 rounded-lg px-3 py-2.5 focus:outline-hidden focus:border-primary text-on-background"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-container disabled:opacity-50 text-white font-sans text-xs uppercase tracking-widest font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md"
                >
                  <Gift className="w-4 h-4" />
                  <span>{loading ? 'Issuing Digital Voucher...' : `Purchase ${formatPrice(selectedValue)} Voucher`}</span>
                </button>
              </div>
            </form>

            <div className="flex items-center gap-2 text-[11px] text-outline font-sans pt-2 border-t border-surface-container">
              <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
              <span>Instant digital generation. Valid for 12 months on all shop items.</span>
            </div>
          </div>

          {/* Right Column: Live Card Preview (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-serif font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span>Live Digital Voucher Preview</span>
                </h3>
              </div>

              <VoucherCardPreview
                value={selectedValue}
                recipientName={isGift ? recipientName : buyerName}
                giftMessage={isGift ? giftMessage : ''}
                senderName={isGift ? buyerName : ''}
              />

              <div className="bg-white border border-surface-container rounded-2xl p-5 space-y-3 text-xs font-sans text-outline">
                <h4 className="font-serif font-bold text-primary text-xs uppercase tracking-wider">
                  How it works:
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-[11px]">
                  <li>Select your desired denomination (100, 200, 500, 1000, 2000 EGP).</li>
                  <li>Click purchase to immediately generate your unique voucher code.</li>
                  <li>Enter the voucher code at checkout to deduct the full amount from your order total!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {createdVoucher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 sm:p-8 space-y-6 text-center border border-gold/30 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 border border-green-200 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-serif font-bold text-primary">
                Voucher Created Successfully!
              </h3>
              <p className="text-xs text-outline font-sans">
                Your digital voucher code for <strong className="text-primary">{formatPrice(createdVoucher.value)}</strong> is ready.
              </p>
            </div>

            {/* Generated Voucher Code Box */}
            <div className="bg-surface p-4 rounded-xl border border-surface-container space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-outline font-sans block">
                Your Voucher Code
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-lg font-mono font-bold tracking-widest text-primary">
                  {createdVoucher.code}
                </span>
                <button
                  onClick={() => copyCode(createdVoucher.code)}
                  className="p-2 text-outline hover:text-primary hover:bg-white rounded-lg transition-colors cursor-pointer"
                  title="Copy Code"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copied && <span className="text-[10px] text-green-600 font-bold block">Copied to clipboard!</span>}
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-primary hover:bg-primary-container text-white text-xs font-sans uppercase tracking-widest font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <span>Shop Now with Voucher</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCreatedVoucher(null)}
                className="w-full bg-surface hover:bg-surface-container/60 text-outline text-xs font-sans uppercase tracking-widest font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Buy Another Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
