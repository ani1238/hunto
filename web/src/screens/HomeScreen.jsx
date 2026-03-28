import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useLocationStore } from '../store/locationStore';
import { useRestaurantStore } from '../store/restaurantStore';

export function HomeScreen({ onSelectRestaurant, onSelectLocation }) {
  const { user, logout } = useAuthStore();
  const { getItemCount } = useCartStore();
  const { selectedLocation, locations, fetchLocations, detectCurrentLocation, saveLocation, setSelectedLocation } = useLocationStore();
  const { restaurants, isLoading, errorMessage, fetchRestaurants } = useRestaurantStore();
  const cartCount = getItemCount();

  useEffect(() => {
    const initializeApp = async () => {
      // Fetch saved locations first
      const locations = await fetchLocations();
      
      // Try to auto-detect current location
      const currentLocation = await detectCurrentLocation();
      let selectedLoc = null;

      if (currentLocation) {
        // Check if this location is already saved
        const isSaved = locations.some(
          (loc) =>
            Math.abs(loc.latitude - currentLocation.latitude) < 0.01 &&
            Math.abs(loc.longitude - currentLocation.longitude) < 0.01
        );

        // If not saved, save it as current location
        if (!isSaved) {
          await saveLocation(
            currentLocation.address,
            currentLocation.latitude,
            currentLocation.longitude,
            currentLocation.label
          );
        }
        selectedLoc = currentLocation;
      } else if (locations.length > 0) {
        // Fallback to first saved location
        selectedLoc = locations[0];
        setSelectedLocation(selectedLoc);
      }

      // Fetch restaurants with location filter (only after we have a location)
      if (selectedLoc) {
        fetchRestaurants('', selectedLoc.latitude, selectedLoc.longitude);
      } else {
        fetchRestaurants('');
      }
    };

    initializeApp();
  }, []);

  // Refetch restaurants when selected location changes
  useEffect(() => {
    if (selectedLocation) {
      fetchRestaurants('', selectedLocation.latitude, selectedLocation.longitude);
    }
  }, [selectedLocation?.id]);

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
              {selectedLocation?.addressLine || selectedLocation?.address || 'Select location'}
            </div>
            {selectedLocation?.label && (
              <div className="location-sublabel" style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                {selectedLocation.label}
              </div>
            )}
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
          disabled
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>

      <h2>Restaurants</h2>
      {errorMessage && <p className="error-text error-message">{errorMessage}</p>}
      {isLoading && <p className="loading-text">Loading restaurants...</p>}
      <div className="restaurant-list">
        {restaurants.length === 0 && !isLoading ? (
          <p className="no-results">No restaurants available</p>
        ) : (
          restaurants.map((restaurant) => (
            <div key={restaurant.id} className="card">
              <div className="restaurant-header">
                <h3>{restaurant.name}</h3>
                <span className="rating-badge">★ {(restaurant.rating || 0).toFixed(1)}</span>
              </div>
              <p className="cuisine">{restaurant.tagline || 'Pet food delivery'}</p>
              <div className="restaurant-meta">
                <span>🚚 {restaurant.deliveryTime || 30} min</span>
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
