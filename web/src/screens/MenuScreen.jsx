import React, { useEffect, useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useRestaurantStore } from '../store/restaurantStore';

export function MenuScreen({ restaurantId, onBack }) {
  const { addItem } = useCartStore();
  const { getRestaurantById, errorMessage } = useRestaurantStore();
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addedItems, setAddedItems] = useState({});

  useEffect(() => {
    const loadRestaurant = async () => {
      setIsLoading(true);
      const data = await getRestaurantById(restaurantId);
      setRestaurant(data);
      setIsLoading(false);
    };
    loadRestaurant();
  }, [restaurantId]);

  if (isLoading) {
    return (
      <div className="screen menu-screen">
        <button onClick={onBack} className="back-btn">← Back</button>
        <div className="loading-container">
          <p className="loading-text">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="screen menu-screen">
        <button onClick={onBack} className="back-btn">← Back</button>
        <div className="error-container">
          <p className="error-text">{errorMessage || 'Restaurant not found'}</p>
        </div>
      </div>
    );
  }

  const menuItems = restaurant.menuItems || restaurant.menu || [];

  const handleAddItem = (item) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description,
    });
    setAddedItems((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));
  };

  return (
    <div className="screen menu-screen">
      <button onClick={onBack} className="back-btn">← Back</button>

      <div className="restaurant-header">
        <h1>{restaurant.name}</h1>
        <p>{restaurant.tagline || restaurant.cuisine || 'Pet food delivery'}</p>
        <div className="restaurant-meta">
          <span>★ {(restaurant.rating || 0).toFixed(1)}</span>
          <span>• {restaurant.deliveryTime || 30} min</span>
        </div>
      </div>

      <h2>Menu</h2>
      <div className="menu-items">
        {menuItems.length === 0 ? (
          <p className="no-results">No items available</p>
        ) : (
          menuItems.map((item) => (
            <div key={item.id} className="menu-item">
              <div className="item-info">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <p className="item-price">₹{item.price}</p>
              </div>
              <button
                className="add-btn"
                onClick={() => handleAddItem(item)}
              >
                {addedItems[item.id] ? `Added (${addedItems[item.id]})` : 'Add'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
