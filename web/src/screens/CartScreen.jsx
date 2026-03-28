import React, { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useLocationStore } from '../store/locationStore';

export function CartScreen({ onBack, onCheckout }) {
  const { items, getTotalPrice, updateQuantity, removeItem, clearCart } = useCartStore();
  const { selectedLocation } = useLocationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, quantity);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedLocation) {
      setError('Please select a delivery location');
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // API call will be added here
      onCheckout?.();
      clearCart();
    } catch (err) {
      setError('Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPrice = getTotalPrice();

  return (
    <div className="screen cart-screen">
      <div className="cart-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h2>Your Cart</h2>
      </div>

      {error && <p className="error-text error-message">{error}</p>}

      {items.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-icon">🛒</div>
          <p>Your cart is empty</p>
          <p className="empty-hint">Add items from restaurants to get started</p>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p className="item-price">₹{item.price}</p>
                </div>
                <div className="item-controls">
                  <button
                    className="qty-btn"
                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="qty">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    className="remove-btn"
                    onClick={() => removeItem(item.id)}
                    title="Remove"
                  >
                    🗑️
                  </button>
                </div>
                <div className="item-total">₹{(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div className="location-summary">
            <span className="location-icon">📍</span>
            <div className="location-text">
              <div className="label">Delivery To</div>
              <div className="address">{selectedLocation?.address || 'Select location'}</div>
            </div>
          </div>

          <div className="price-breakdown">
            <div className="price-row">
              <span>Subtotal</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="price-row">
              <span>Delivery</span>
              <span>₹0 (Free)</span>
            </div>
            <div className="price-row total">
              <span>Total</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button
            className="btn btn-primary place-order-btn"
            onClick={handlePlaceOrder}
            disabled={isLoading}
          >
            {isLoading ? 'Placing Order...' : `Place Order (₹${totalPrice.toFixed(2)})`}
          </button>
        </>
      )}
    </div>
  );
}
