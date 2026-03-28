import React, { useState, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { useLocationStore } from '../store/locationStore';

export function CartScreen({ onBack, onCheckout }) {
  const { cart, addItem, removeItem, clearCart, placeOrder, loadCart } = useCartStore();
  const { persistedLocations, loadPersistedLocations, selectPersistedLocation } = useLocationStore();
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCart();
    loadPersistedLocations();
  }, []);

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
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
      const result = await placeOrder(selectedAddressId);
      
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
          <button onClick={clearCart} className="clear-btn">Clear</button>
        </div>
        <div className="empty-cart">
          <div className="empty-icon">🛒</div>
          <p>Your cart is empty</p>
          <p className="empty-hint">Add items from restaurants to get started</p>
        </div>
      </div>
    );
  }

  const subtotal = cart.subtotal || 0;
  const discountAmount = cart.discountAmount || 0;
  const deliveryFee = subtotal >= 199 ? 0 : 20;
  const taxes = Math.round(subtotal * 0.05);
  const grandTotal = subtotal - discountAmount + deliveryFee + taxes;

  return (
    <div className="screen cart-screen">
      <div className="cart-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Your Cart</h2>
        <button onClick={clearCart} className="clear-btn">Clear</button>
      </div>

      {error && <p className="error-text error-message">{error}</p>}
      {isLoading && <p className="loading-text">Processing...</p>}

      <div className="cart-items-list">
        {items.map((item) => (
          <div key={item.id} className="cart-item-card">
            <div className="cart-item-info">
              <h4 className="cart-item-name">{item.menuItemName}</h4>
              <p className="cart-item-restaurant">{item.restaurantName}</p>
              <p className="cart-item-total">₹{(item.lineTotal || 0).toFixed(2)}</p>
            </div>

            <div className="cart-quantity-control">
              <button
                className="cart-qty-btn"
                onClick={() => removeItem(item.menuItemId)}
              >
                −
              </button>
              <span className="cart-qty-text">{item.quantity}</span>
              <button
                className="cart-qty-btn"
                onClick={() => addItem({ id: item.menuItemId })}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-bill-section">
        <h3 className="bill-title">Bill Details</h3>

        <div className="bill-row">
          <span>Item Total</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="bill-row discount">
            <span>Discount</span>
            <span>−₹{discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="bill-row">
          <span>Delivery Fee</span>
          <span className={deliveryFee === 0 ? 'free' : ''}>
            {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
          </span>
        </div>

        <div className="bill-row">
          <span>Taxes & Charges</span>
          <span>₹{taxes}</span>
        </div>

        <div className="bill-divider"></div>

        <div className="bill-row total">
          <span>Grand Total</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="cart-footer">
        <div className="payment-card">
          <div className="payment-left">
            <span>💰</span>
            <div>
              <p className="payment-label">Payment Method</p>
              <p className="payment-value">Cash on Delivery</p>
            </div>
          </div>
          <div className="cod-pill">COD</div>
        </div>

        <div className="trust-signals">
          <div className="trust-row">
            <span>✓</span>
            <p>Hygienic prep partner verified</p>
          </div>
          <div className="trust-row">
            <span>🎧</span>
            <p>24x7 support for order issues</p>
          </div>
          <div className="trust-row">
            <span>📦</span>
            <p>Fresh meals with safe packaging</p>
          </div>
        </div>

        <div className="address-section">
          <h3 className="address-title">Delivery Address</h3>
          
          {persistedLocations.length === 0 ? (
            <div className="no-address">
              <p>No saved address found. Please add an address before placing order.</p>
              <button className="add-address-btn" onClick={() => {/* Navigate to profile */}}>
                + Add Address
              </button>
            </div>
          ) : (
            <div className="address-options">
              <p className="address-hint">Select one saved address for this order:</p>
              {persistedLocations.map((location) => {
                const isSelected = String(selectedAddressId) === String(location.id);
                return (
                  <button
                    key={String(location.id)}
                    className={`address-option ${isSelected ? 'selected' : ''}`}
                    onClick={async () => {
                      setSelectedAddressId(String(location.id));
                      await selectPersistedLocation(location.id);
                    }}
                  >
                    <div className={`address-radio ${isSelected ? 'selected' : ''}`} />
                    <div className="address-info">
                      <p className="address-label">{location.label}</p>
                      <p className="address-line">{location.addressLine}, {location.city}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button 
          onClick={handlePlaceOrder}
          disabled={isLoading || !selectedAddressId}
          className="place-order-btn"
        >
          {isLoading ? 'Processing...' : `Place Order • ₹${grandTotal.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
