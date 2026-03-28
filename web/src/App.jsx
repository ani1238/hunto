import React, { useState } from 'react';
import './App.css';

function LoginScreen({ onLogin }) {
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    // TODO: Call backend API to send OTP
    // For now, auto-advance
    setStep('otp');
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      alert('Please enter 4-digit OTP');
      return;
    }
    setLoading(true);
    // TODO: Call backend API to verify OTP
    // For now, mock login
    onLogin({ phone, isAuthenticated: true });
    setLoading(false);
  };

  return (
    <div className="screen login-screen">
      <div className="login-container">
        <h1>🐾 Hunto</h1>
        <p>Pet Food Delivery</p>

        {step === 'phone' ? (
          <div className="form-group">
            <label>Phone Number</label>
            <div className="phone-input-wrapper">
              <span className="phone-prefix">+91</span>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                maxLength="10"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
              />
            </div>
            <p className="help-text">We'll send you a 4-digit OTP to verify your number</p>
            <button
              className="btn btn-primary"
              onClick={handleSendOtp}
              disabled={loading || phone.length < 10}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div className="form-group">
            <label>Enter OTP</label>
            <p className="otp-hint">4-digit code sent to +91{phone}</p>
            <input
              type="text"
              placeholder="0000"
              maxLength="4"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="otp-input"
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 4}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setStep('phone')}
              disabled={loading}
            >
              Change Number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function HomeScreen({ user, onLogout }) {
  const [cart, setCart] = useState(0);

  return (
    <div className="screen home-screen">
      <div className="user-greeting">
        <p>Welcome, +91{user.phone} 👋</p>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>

      <h2>Popular Restaurants</h2>
      <div className="restaurant-list">
        <div className="card">
          <h3>Pet Provisions</h3>
          <p>Premium pet food & treats</p>
          <p className="rating">★ 4.5 • 30 min</p>
          <button onClick={() => setCart(cart + 1)} className="view-btn">
            View Menu →
          </button>
        </div>
        <div className="card">
          <h3>Pawsome Pantry</h3>
          <p>Fresh & organic pet food</p>
          <p className="rating">★ 4.8 • 25 min</p>
          <button onClick={() => setCart(cart + 1)} className="view-btn">
            View Menu →
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(0);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">🐾 Hunto</div>
        <button className="cart-btn">🛒 Cart ({cart})</button>
      </nav>

      {!user ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <HomeScreen user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
