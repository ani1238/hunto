import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useLocationStore } from '../store/locationStore';

// Mock restaurants data
const RESTAURANTS = [
  { id: 1, name: 'Pet Provisions', cuisine: 'Premium pet food & treats', rating: 4.5, deliveryTime: 30 },
  { id: 2, name: 'Pawsome Pantry', cuisine: 'Fresh & organic pet food', rating: 4.8, deliveryTime: 25 },
];

export function HomeScreen({ onSelectRestaurant, onSelectLocation }) {
  const { user, logout } = useAuthStore();
  const { getItemCount } = useCartStore();
  const { selectedLocation, fetchLocations } = useLocationStore();
  const cartCount = getItemCount();

  useEffect(() => {
    fetchLocations();
  }, []);

  return (
    <div className="screen home-screen">
      <div className="user-greeting">
        <p>Welcome, {user?.name || 'User'} 👋</p>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="location-section">
        <div className="location-display">
          <span className="location-icon">📍</span>
          <div className="location-info">
            <div className="location-label">Delivery To</div>
            <div className="location-address">
              {selectedLocation?.address || 'Select location'}
            </div>
          </div>
        </div>
        <button className="change-location-btn" onClick={() => onSelectLocation?.()}>
          Change
        </button>
      </div>

      <h2>Popular Restaurants</h2>
      <div className="restaurant-list">
        {RESTAURANTS.map((restaurant) => (
          <div key={restaurant.id} className="card">
            <h3>{restaurant.name}</h3>
            <p>{restaurant.cuisine}</p>
            <p className="rating">★ {restaurant.rating} • {restaurant.deliveryTime} min</p>
            <button
              onClick={() => onSelectRestaurant(restaurant.id)}
              className="view-btn"
            >
              View Menu →
            </button>
          </div>
        ))}
      </div>

      {cartCount > 0 && (
        <div className="cart-summary">
          <p>{cartCount} item(s) in cart</p>
          <button className="btn btn-primary">Checkout</button>
        </div>
      )}
    </div>
  );
}
