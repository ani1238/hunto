import React, { useState, useEffect } from 'react';
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
  const [currentView, setCurrentView] = useState('home');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [orderId, setOrderId] = useState(null);

  // Sync with browser history
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/' || path === '') {
        setCurrentView('home');
        setSelectedRestaurantId(null);
      } else if (path.startsWith('/menu/')) {
        const id = path.split('/')[2];
        setSelectedRestaurantId(id);
        setCurrentView('menu');
      } else if (path === '/location') {
        setCurrentView('location');
      } else if (path === '/cart') {
        setCurrentView('cart');
      } else if (path.startsWith('/order/')) {
        const id = path.split('/')[2];
        setOrderId(id);
        setCurrentView('tracking');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL when view changes
  useEffect(() => {
    let path = '/';
    if (currentView === 'menu' && selectedRestaurantId) {
      path = `/menu/${selectedRestaurantId}`;
    } else if (currentView === 'location') {
      path = '/location';
    } else if (currentView === 'cart') {
      path = '/cart';
    } else if (currentView === 'tracking' && orderId) {
      path = `/order/${orderId}`;
    }
    
    window.history.pushState(null, '', path);
  }, [currentView, selectedRestaurantId, orderId]);

  const handleSelectRestaurant = (restaurantId) => {
    setSelectedRestaurantId(restaurantId);
    setCurrentView('menu');
  };

  const handleBackToHome = () => {
    window.history.back();
  };

  const handleSelectLocation = () => {
    setCurrentView('location');
  };

  const handleLocationSelected = () => {
    window.history.back();
  };

  const handleGoToCart = () => {
    setCurrentView('cart');
  };

  const handleCheckout = (newOrderId) => {
    setOrderId(newOrderId);
    setCurrentView('tracking');
  };

  const handleBackFromTracking = () => {
    window.history.back();
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
