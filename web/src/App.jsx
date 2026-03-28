import React, { useState } from 'react';
import './App.css';

function App() {
  const [cart, setCart] = useState(0);

  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">🐾 Hunto</div>
        <button className="cart-btn">🛒 Cart ({cart})</button>
      </nav>
      
      <div className="screen home-screen">
        <h1>🐾 Welcome to Hunto</h1>
        <p>Pet Food Delivery</p>
        <button className="btn btn-primary">Login with Google</button>
        
        <div className="restaurant-list">
          <h2>Popular Restaurants</h2>
          <div className="card">
            <h3>Pet Provisions</h3>
            <p>Premium pet food & treats</p>
            <button onClick={() => setCart(cart + 1)}>View Menu →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
