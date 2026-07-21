import { X, Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '@/shared/utils/currency';

export default function CartPage({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem }) {
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.discount_active ? item.discounted_price : item.original_price;
    return acc + price * item.quantity;
  }, 0);

  return (
    <div className={`fixed inset-0 z-50 flex justify-end ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className={`relative w-full max-w-md bg-white h-full flex flex-col justify-between z-10 border-l border-surface-container shadow-2xl transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-surface-container/60">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <span className="text-sm font-sans tracking-widest uppercase font-bold text-on-background">
              Shopping Bag ({cartItems.length})
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-surface-container transition-colors"
            aria-label="Close cart"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cartItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm font-sans text-outline mb-6">Your bag is currently empty.</p>
              <button 
                onClick={onClose}
                className="bg-primary text-white text-xs font-sans tracking-widest uppercase px-6 py-3 hover:bg-primary-container transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => {
              const price = item.discount_active ? item.discounted_price : item.original_price;
              return (
                <div key={item.id} className="flex space-x-4 border-b border-surface-container/40 pb-4">
                  <div className="w-20 h-24 bg-surface-container/40 overflow-hidden border border-surface-container flex-shrink-0">
                    <img src={item.primary_image_url} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-serif tracking-wide text-on-background font-medium mb-1">
                        {item.name}
                      </h4>
                      <p className="text-[10px] font-sans tracking-wider text-outline uppercase mb-2">
                        {formatPrice(price)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-surface-container">
                        <button 
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-1 text-xs hover:bg-surface-container"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-xs font-sans font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-1 text-xs hover:bg-surface-container"
                        >
                          +
                        </button>
                      </div>

                      <button 
                        onClick={() => onRemoveItem(item.id)}
                        className="text-outline hover:text-red-600 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-surface-container/60 bg-surface-container/10">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-sans tracking-widest uppercase text-outline">Subtotal</span>
              <span className="text-lg font-sans font-bold text-on-background">{formatPrice(subtotal)}</span>
            </div>
            
            <Link 
              to="/checkout"
              onClick={onClose}
              className="w-full block bg-primary hover:bg-primary-container text-white text-center text-xs font-sans tracking-widest uppercase py-4 transition-colors font-medium"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
