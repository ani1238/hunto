import React, { useState } from 'react';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { MenuScreen } from './screens/MenuScreen';
import { LocationSelectorScreen } from './screens/LocationSelectorScreen';
import { CartScreen } from './screens/CartScreen';
import { OrderTrackingScreen } from './screens/OrderTrackingScreen';
import './App.css';

function App() {
  const { isAuthenticated } = useAuthStore();
  const { getItemCount } = useCartStore();
  const [currentView, setCurrentView] = useState('home'); // 'home', 'menu', 'location', 'cart', 'tracking'
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [orderId, setOrderId] = useState(null);

  const handleSelectRestaurant = (restaurantId) => {
    setSelectedRestaurantId(restaurantId);
    setCurrentView('menu');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedRestaurantId(null);
  };

  const handleSelectLocation = () => {
    setCurrentView('location');
  };

  const handleLocationSelected = () => {
    setCurrentView('home');
  };

  const handleGoToCart = () => {
    setCurrentView('cart');
  };

  const handleCheckout = (newOrderId) => {
    setOrderId(newOrderId);
    setCurrentView('tracking');
  };

  const handleBackFromTracking = () => {
    setCurrentView('home');
    setOrderId(null);
  };

  const cartCount = getItemCount();

  return (
    <div className="app">
      {isAuthenticated && (
        <nav className="navbar">
          <div className="logo">🐾 Hunto</div>
          <button className="cart-btn" onClick={handleGoToCart}>
            🛒 Cart ({cartCount})
          </button>
        </nav>
      )}

      {!isAuthenticated ? (
        <LoginScreen />
      ) : currentView === 'menu' ? (
        <MenuScreen restaurantId={selectedRestaurantId} onBack={handleBackToHome} />
      ) : currentView === 'location' ? (
        <LocationSelectorScreen onLocationSelected={handleLocationSelected} onBack={handleBackToHome} />
      ) : currentView === 'cart' ? (
        <CartScreen onBack={handleBackToHome} onCheckout={handleCheckout} />
      ) : currentView === 'tracking' ? (
        <OrderTrackingScreen orderId={orderId} onBack={handleBackFromTracking} />
      ) : (
        <HomeScreen onSelectRestaurant={handleSelectRestaurant} onSelectLocation={handleSelectLocation} />
      )}
    </div>
  );
}

export default App;
