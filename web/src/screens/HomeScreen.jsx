import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useLocationStore } from '../store/locationStore';

// Mock restaurants data
const RESTAURANTS = [
  { id: 1, name: 'Pet Provisions', cuisine: 'Premium pet food & treats', rating: 4.5, deliveryTime: 30, category: 'premium' },
  { id: 2, name: 'Pawsome Pantry', cuisine: 'Fresh & organic pet food', rating: 4.8, deliveryTime: 25, category: 'organic' },
  { id: 3, name: 'Budget Bites', cuisine: 'Affordable pet food', rating: 4.2, deliveryTime: 35, category: 'budget' },
];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🍽️' },
  { id: 'premium', label: 'Premium', icon: '⭐' },
  { id: 'organic', label: 'Organic', icon: '🌿' },
  { id: 'budget', label: 'Budget', icon: '💰' },
];

export function HomeScreen({ onSelectRestaurant, onSelectLocation }) {
  const { user, logout } = useAuthStore();
  const { getItemCount } = useCartStore();
  const { selectedLocation, fetchLocations } = useLocationStore();
  const cartCount = getItemCount();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  // Filter restaurants
  const filteredRestaurants = RESTAURANTS.filter((restaurant) => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || restaurant.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'delivery') return a.deliveryTime - b.deliveryTime;
    return 0;
  });

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

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search restaurants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>

      <div className="categories">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            className={`category-pill ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span>{category.icon}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      <div className="filters-bar">
        <button 
          className={`filter-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          ⚙️ Filters
        </button>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
          <option value="rating">Sort by Rating</option>
          <option value="delivery">Sort by Delivery Time</option>
        </select>
      </div>

      <h2>Restaurants</h2>
      <div className="restaurant-list">
        {filteredRestaurants.length === 0 ? (
          <p className="no-results">No restaurants found</p>
        ) : (
          filteredRestaurants.map((restaurant) => (
            <div key={restaurant.id} className="card">
              <div className="restaurant-header">
                <h3>{restaurant.name}</h3>
                <span className="rating-badge">★ {restaurant.rating}</span>
              </div>
              <p className="cuisine">{restaurant.cuisine}</p>
              <div className="restaurant-meta">
                <span>🚚 {restaurant.deliveryTime} min</span>
              </div>
              <button
                onClick={() => onSelectRestaurant(restaurant.id)}
                className="view-btn"
              >
                View Menu →
              </button>
            </div>
          ))
        )}
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
