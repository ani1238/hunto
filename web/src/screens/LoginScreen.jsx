import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export function LoginScreen() {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const { otpCode, requestOtp, verifyOtp, otpSent, isLoading, errorMessage, setOtpCode } = useAuthStore();

  const handleSendOtp = async () => {
    const success = await requestOtp(phone);
    if (success) {
      setStep('otp');
    }
  };

  const handleVerifyOtp = async () => {
    const success = await verifyOtp(otpCode);
    if (success) {
      // Auto navigates due to isAuthenticated state
    }
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
                disabled={isLoading}
              />
            </div>
            <p className="help-text">We'll send you a 4-digit OTP to verify your number</p>
            {errorMessage && <p className="error-text">{errorMessage}</p>}
            <button
              className="btn btn-primary"
              onClick={handleSendOtp}
              disabled={isLoading || phone.length < 10}
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
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
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="otp-input"
              disabled={isLoading}
            />
            {errorMessage && <p className="error-text">{errorMessage}</p>}
            <button
              className="btn btn-primary"
              onClick={handleVerifyOtp}
              disabled={isLoading || otpCode.length < 4}
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setStep('phone')}
              disabled={isLoading}
            >
              Change Number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
