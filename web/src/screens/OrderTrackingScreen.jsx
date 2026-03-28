import React, { useState, useEffect } from 'react';

const ORDER_STATUSES = {
  placed: { label: 'Order Placed', icon: '📋', step: 1 },
  confirmed: { label: 'Confirmed', icon: '✓', step: 2 },
  preparing: { label: 'Preparing', icon: '👨‍🍳', step: 3 },
  ready: { label: 'Ready for Pickup', icon: '📦', step: 4 },
  on_the_way: { label: 'On the Way', icon: '🚚', step: 5 },
  delivered: { label: 'Delivered', icon: '✓✓', step: 6 },
};

export function OrderTrackingScreen({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrder = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`);
        // const data = await response.json();
        // setOrder(data.data);
        
        // Mock data for now
        setOrder({
          id: orderId,
          status: 'preparing',
          restaurantName: 'Pawsome Kitchen',
          totalAmount: 447.00,
          items: [
            { name: 'Chicken & Rice Bowl', quantity: 1, price: 149 },
            { name: 'Mutton Power Bowl', quantity: 2, price: 179 },
          ],
          deliveryAddress: '123 Main St, Apt 4B',
          estimatedTime: '25-35 min',
          timeline: [
            { status: 'placed', timestamp: new Date(Date.now() - 600000) },
            { status: 'confirmed', timestamp: new Date(Date.now() - 540000) },
            { status: 'preparing', timestamp: new Date(Date.now() - 300000) },
          ],
        });
        setError('');
      } catch (err) {
        setError('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
    // Poll for updates every 10 seconds
    const interval = setInterval(loadOrder, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

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

  if (error || !order) {
    return (
      <div className="screen order-tracking-screen">
        <button onClick={onBack} className="back-btn">← Back</button>
        <div style={{ padding: '40px 16px', textAlign: 'center' }}>
          <p className="error-text">{error || 'Order not found'}</p>
        </div>
      </div>
    );
  }

  const currentStatusInfo = ORDER_STATUSES[order.status] || ORDER_STATUSES.placed;
  const completedSteps = Object.values(ORDER_STATUSES)
    .filter((s) => s.step <= currentStatusInfo.step)
    .map((s) => s.label);

  return (
    <div className="screen order-tracking-screen">
      <button onClick={onBack} className="back-btn">← Back</button>

      {/* Order Status */}
      <div className="order-status">
        <div className="status-icon">{currentStatusInfo.icon}</div>
        <h2>{currentStatusInfo.label}</h2>
        <p className="estimated-time">Estimated: {order.estimatedTime}</p>
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
        <h3>Order #{order.id}</h3>

        <div className="detail-section">
          <label>Restaurant</label>
          <p>{order.restaurantName}</p>
        </div>

        <div className="detail-section">
          <label>Items</label>
          {order.items.map((item, idx) => (
            <div key={idx} className="order-item">
              <span>{item.name}</span>
              <span className="item-qty">×{item.quantity}</span>
              <span className="item-price">₹{item.price}</span>
            </div>
          ))}
        </div>

        <div className="detail-section">
          <label>Delivery To</label>
          <p>{order.deliveryAddress}</p>
        </div>

        <div className="detail-section">
          <label>Total</label>
          <p className="order-total">₹{order.totalAmount.toFixed(2)}</p>
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
