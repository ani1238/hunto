import React, { useState } from 'react';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { MenuScreen } from './screens/MenuScreen';
import './App.css';

function App() {
  const { isAuthenticated } = useAuthStore();
  const { getItemCount } = useCartStore();
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'menu'
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);

  const handleSelectRestaurant = (restaurantId) => {
    setSelectedRestaurantId(restaurantId);
    setCurrentView('menu');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedRestaurantId(null);
  };

  const cartCount = getItemCount();

  return (
    <div className="app">
      {isAuthenticated && (
        <nav className="navbar">
          <div className="logo">🐾 Hunto</div>
          <button className="cart-btn">
            🛒 Cart ({cartCount})
          </button>
        </nav>
      )}

      {!isAuthenticated ? (
        <LoginScreen />
      ) : currentView === 'menu' ? (
        <MenuScreen restaurantId={selectedRestaurantId} onBack={handleBackToHome} />
      ) : (
        <HomeScreen onSelectRestaurant={handleSelectRestaurant} />
      )}
    </div>
  );
}

export default App;
