import React, { useState, useEffect } from 'react';
import { useOrderStore } from '../store/orderStore';

const ORDER_STATUSES = {
  placed: { label: 'Order Placed', icon: '📋', step: 1 },
  confirmed: { label: 'Confirmed', icon: '✓', step: 2 },
  preparing: { label: 'Preparing', icon: '👨‍🍳', step: 3 },
  ready: { label: 'Ready for Pickup', icon: '📦', step: 4 },
  on_the_way: { label: 'On the Way', icon: '🚚', step: 5 },
  delivered: { label: 'Delivered', icon: '✓✓', step: 6 },
};

export function OrderTrackingScreen({ orderId, onBack }) {
  const { getOrderById, trackOrder, tracking, currentOrder } = useOrderStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [remainingTime, setRemainingTime] = useState('25-35 min');

  useEffect(() => {
    const loadOrder = async () => {
      setIsLoading(true);
      try {
        // Load order details
        const order = await getOrderById(orderId);
        if (!order) {
          setError('Order not found');
          setIsLoading(false);
          return;
        }

        // Track order status
        const trackResult = await trackOrder(orderId);
        if (!trackResult.tracking) {
          setError('Failed to load tracking info');
        }
        setError('');
      } catch (err) {
        setError('Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();

    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      trackOrder(orderId);
    }, 10000);

    return () => clearInterval(interval);
  }, [orderId, getOrderById, trackOrder]);

  if (isLoading) {
    return (
      <div className="screen order-tracking-screen">
        <button onClick={onBack} className="back-btn">← Back</button>
        <div style={{ padding: '40px 16px', textAlign: 'center' }}>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !currentOrder) {
    return (
      <div className="screen order-tracking-screen">
        <button onClick={onBack} className="back-btn">← Back</button>
        <div style={{ padding: '40px 16px', textAlign: 'center' }}>
          <p className="error-text">{error || 'Order not found'}</p>
        </div>
      </div>
    );
  }

  const orderStatus = tracking?.status || currentOrder.status || 'placed';
  const currentStatusInfo = ORDER_STATUSES[orderStatus] || ORDER_STATUSES.placed;
  const completedSteps = Object.values(ORDER_STATUSES)
    .filter((s) => s.step <= currentStatusInfo.step)
    .map((s) => s.label);

  const timeline = tracking?.timeline || [];

  return (
    <div className="screen order-tracking-screen">
      <button onClick={onBack} className="back-btn">← Back</button>

      {/* Order Status */}
      <div className="order-status">
        <div className="status-icon">{currentStatusInfo.icon}</div>
        <h2>{currentStatusInfo.label}</h2>
        <p className="estimated-time">Estimated: {currentOrder.estimatedDeliveryTime || remainingTime}</p>
      </div>

      {/* Timeline */}
      <div className="order-timeline">
        {Object.values(ORDER_STATUSES).map((status) => (
          <div
            key={status.label}
            className={`timeline-step ${completedSteps.includes(status.label) ? 'completed' : ''}`}
          >
            <div className="timeline-marker">{status.step}</div>
            <div className="timeline-label">{status.label}</div>
          </div>
        ))}
      </div>

      {/* Order Details */}
      <div className="order-details">
        <h3>Order #{currentOrder.id}</h3>

        <div className="detail-section">
          <label>Restaurant</label>
          <p>{currentOrder.restaurantName || 'Loading...'}</p>
        </div>

        {currentOrder.items && currentOrder.items.length > 0 && (
          <div className="detail-section">
            <label>Items</label>
            {currentOrder.items.map((item, idx) => (
              <div key={idx} className="order-item">
                <span>{item.name || item.menuItemName}</span>
                <span className="item-qty">×{item.quantity}</span>
                <span className="item-price">₹{item.price}</span>
              </div>
            ))}
          </div>
        )}

        {currentOrder.deliveryAddress && (
          <div className="detail-section">
            <label>Delivery To</label>
            <p>{currentOrder.deliveryAddress}</p>
          </div>
        )}

        <div className="detail-section">
          <label>Total</label>
          <p className="order-total">₹{(currentOrder.totalAmount || currentOrder.totalPrice || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Contact Support */}
      <div className="support-section">
        <button className="btn btn-secondary" style={{ width: '100%' }}>
          📞 Contact Support
        </button>
      </div>
    </div>
  );
}
