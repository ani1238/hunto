import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

function Home() {
  return (
    <div className="screen home-screen">
      <h1>🐾 Welcome to Hunto</h1>
      <p>Pet Food Delivery</p>
      <button className="btn btn-primary">Login with Google</button>
      
      <div className="restaurant-list">
        <h2>Popular Restaurants</h2>
        <div className="card">
          <h3>Pet Provisions</h3>
          <p>Premium pet food & treats</p>
          <button>View Menu →</button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <Link to="/" className="logo">🐾 Hunto</Link>
          <button className="cart-btn">🛒 Cart (0)</button>
        </nav>
        
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
