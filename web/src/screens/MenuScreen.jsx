import React, { useEffect, useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useRestaurantStore } from '../store/restaurantStore';

export function MenuScreen({ restaurantId, onBack }) {
  const { addItem, items, removeItem } = useCartStore();
  const { getRestaurantById, errorMessage } = useRestaurantStore();
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRestaurant = async () => {
      setIsLoading(true);
      const data = await getRestaurantById(restaurantId);
      setRestaurant(data);
      setIsLoading(false);
    };
    loadRestaurant();
  }, [restaurantId]);

  const getItemQuantity = (itemId) => {
    const item = items.find((i) => i.id === itemId);
    return item?.quantity || 0;
  };

  if (isLoading) {
    return (
      <div className="screen menu-screen">
        <button onClick={onBack} className="menu-back-btn">← Back</button>
        <div className="loading-container">
          <p className="loading-text">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="screen menu-screen">
        <button onClick={onBack} className="menu-back-btn">← Back</button>
        <div className="error-container">
          <p className="error-text">{errorMessage || 'Restaurant not found'}</p>
        </div>
      </div>
    );
  }

  const menuItems = restaurant.menuItems || restaurant.menu || [];

  const handleAddItem = async (item) => {
    try {
      await addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description,
        image: item.image,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
      });
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await removeItem(itemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  return (
    <div className="screen menu-screen">
      {/* Back Button */}
      <button onClick={onBack} className="menu-back-btn">← Back</button>

      {/* Hero Image */}
      {restaurant.image && (
        <div className="menu-hero-container">
          <img src={restaurant.image} alt={restaurant.name} className="menu-hero-image" />
        </div>
      )}

      {/* Restaurant Info Card */}
      <div className="menu-restaurant-info">
        <h1>{restaurant.name}</h1>
        <p className="restaurant-tagline">{restaurant.tagline || restaurant.cuisine || 'Pet food delivery'}</p>
        
        <div className="restaurant-stats">
          <div className="stat">
            <span className="stat-icon">★</span>
            <span className="stat-value">{(restaurant.rating || 0).toFixed(1)}</span>
            <span className="stat-label">({restaurant.reviewCount || '0'}+)</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-icon">🚚</span>
            <span className="stat-value">{restaurant.deliveryTime || 30}</span>
            <span className="stat-label">min</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-icon">₹</span>
            <span className="stat-value">{restaurant.deliveryFee || '0'}</span>
            <span className="stat-label">delivery</span>
          </div>
        </div>

        {restaurant.discount && (
          <div className="restaurant-offer">
            <span>🏷️</span>
            <span>{restaurant.discount}</span>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="menu-section">
        <h2>Menu</h2>
        <div className="menu-items-grid">
          {menuItems.length === 0 ? (
            <p className="no-results">No items available</p>
          ) : (
            menuItems.map((item) => {
              const quantity = getItemQuantity(item.id);
              return (
                <div key={item.id} className="menu-item-card">
                  {/* Item Info - Left Side */}
                  <div className="menu-item-left">
                    {item.isBestseller && <span className="bestseller-badge">🏆 Bestseller</span>}
                    <h3>{item.name}</h3>
                    <p className="item-description">{item.description}</p>
                    <p className="item-price">₹{item.price}</p>
                  </div>

                  {/* Image & Action - Right Side */}
                  <div className="menu-item-right">
                    {/* Item Image */}
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="menu-item-image-small" />
                    ) : (
                      <div className="menu-item-image-fallback-small">
                        🍽️
                      </div>
                    )}

                    {/* Add Button */}
                    {quantity === 0 ? (
                      <button
                        className="menu-add-btn-small"
                        onClick={() => handleAddItem(item)}
                      >
                        ADD
                      </button>
                    ) : (
                      <div className="menu-quantity-control-small">
                        <button
                          className="menu-qty-btn-small"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          −
                        </button>
                        <span className="menu-qty-text-small">{quantity}</span>
                        <button
                          className="menu-qty-btn-small"
                          onClick={() => handleAddItem(item)}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
