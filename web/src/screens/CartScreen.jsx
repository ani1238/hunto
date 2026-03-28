import React, { useState, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { useLocationStore } from '../store/locationStore';

export function CartScreen({ onBack, onCheckout }) {
  const { cart, removeItem, clearCart, placeOrder, loadCart } = useCartStore();
  const { selectedLocation } = useLocationStore();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const handlePlaceOrder = async () => {
    if (!selectedLocation) {
      setError('Please select a delivery location');
      return;
    }

    if (!cart.items || cart.items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const locationId = selectedLocation.id;
      const result = await placeOrder(locationId);
      
      if (result.success && result.order?.id) {
        onCheckout?.(result.order.id);
      } else {
        setError(result.error || 'Failed to place order');
      }
    } catch (err) {
      setError('Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const items = cart.items || [];

  if (items.length === 0) {
    return (
      <div className="screen cart-screen">
        <div className="cart-header">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h2>Your Cart</h2>
        </div>
        <div className="empty-cart">
          <div className="empty-icon">🛒</div>
          <p>Your cart is empty</p>
          <p className="empty-hint">Add items from restaurants to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen cart-screen">
      <div className="cart-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Your Cart</h2>
      </div>

      {error && <p className="error-text error-message">{error}</p>}

      <div style={{ padding: '16px', textAlign: 'right' }}>
        <button 
          onClick={async () => {
            if (confirm('Clear all items from cart?')) {
              await clearCart();
            }
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            color: '#666',
            fontSize: '14px',
          }}
        >
          🗑️ Clear Cart
        </button>
      </div>

      <div className="cart-items">
        {items.map((item) => (
          <div key={item.id} className="cart-item">
            <div className="item-info">
              <h4>{item.menuItemName}</h4>
              <p className="item-price">₹{item.unitPrice}</p>
            </div>
            <div className="item-controls">
              <button onClick={() => removeItem(item.menuItemId)} className="qty-btn">−</button>
              <span className="qty">{item.quantity}</span>
              <button onClick={() => {}} className="qty-btn" disabled>+</button>
              <span className="item-total">₹{(item.unitPrice * item.quantity).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="price-breakdown">
        <div className="price-row">
          <span>Subtotal</span>
          <span>₹{(cart.subtotal || 0).toFixed(2)}</span>
        </div>
        {cart.discountAmount > 0 && (
          <div className="price-row discount">
            <span>Discount</span>
            <span>−₹{(cart.discountAmount || 0).toFixed(2)}</span>
          </div>
        )}
        <div className="price-row">
          <span>Delivery</span>
          <span>₹20</span>
        </div>
        <div className="price-row total">
          <span>Total</span>
          <span>₹{(cart.totalPrice || 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="cart-actions">
        <button 
          onClick={handlePlaceOrder}
          disabled={isLoading}
          className="btn btn-primary place-order-btn"
        >
          {isLoading ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}
