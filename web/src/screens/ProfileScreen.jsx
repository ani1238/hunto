import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export function ProfileScreen({ onComplete }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const { completeProfile, isLoading, errorMessage, phoneNumber } = useAuthStore();

  const handleSubmit = async () => {
    const success = await completeProfile(name, email);
    if (success) {
      onComplete?.();
    }
  };

  return (
    <div className="screen login-screen">
      <div className="login-container">
        <h1>🐾 Hunto</h1>
        <p>Complete Your Profile</p>

        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="form-input"
          />
        </div>

        <p className="help-text">Phone: +91{phoneNumber}</p>
        
        {errorMessage && <p className="error-text">{errorMessage}</p>}

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={isLoading || !name.trim() || !email.trim()}
        >
          {isLoading ? 'Saving...' : 'Continue to Home'}
        </button>
      </div>
    </div>
  );
}
