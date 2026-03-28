import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

// Mock restaurants data
const RESTAURANTS = [
  { id: 1, name: 'Pet Provisions', cuisine: 'Premium pet food & treats', rating: 4.5, deliveryTime: 30 },
  { id: 2, name: 'Pawsome Pantry', cuisine: 'Fresh & organic pet food', rating: 4.8, deliveryTime: 25 },
];

export function HomeScreen({ onSelectRestaurant }) {
  const { user, logout } = useAuthStore();
  const { getItemCount } = useCartStore();
  const cartCount = getItemCount();

  return (
    <div className="screen home-screen">
      <div className="user-greeting">
        <p>Welcome, +91{user?.phone || 'User'} 👋</p>
        <button className="logout-btn" onClick={logout}>
          Logout
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
