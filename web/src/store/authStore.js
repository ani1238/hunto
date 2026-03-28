import { create } from 'zustand';
import { apiRequest, setAuthToken, clearAuthToken } from '../api/authApi';

export const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  phoneNumber: '',
  otpCode: '',
  otpSent: false,
  isLoading: false,
  errorMessage: '',
  user: null,

  requestOtp: async (phoneNumber) => {
    set({ isLoading: true, errorMessage: '' });

    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
      set({ isLoading: false, errorMessage: 'Enter a valid 10-digit phone number.' });
      return false;
    }

    try {
      const data = await apiRequest('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ phone: phoneNumber }),
      });

      set({
        phoneNumber,
        otpSent: true,
        otpCode: '',
        isLoading: false,
        errorMessage: '',
      });

      return true;
    } catch (err) {
      set({
        isLoading: false,
        errorMessage: err.message || 'Failed to send OTP.',
      });
      return false;
    }
  },

  verifyOtp: async (code) => {
    const { phoneNumber } = get();

    if (!phoneNumber) {
      set({ errorMessage: 'Please request OTP first.' });
      return false;
    }

    if (!code || !/^\d{4}$/.test(code)) {
      set({ errorMessage: 'Enter the 4-digit OTP.' });
      return false;
    }

    set({ isLoading: true, errorMessage: '' });
    try {
      const data = await apiRequest('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ phone: phoneNumber, otp: code }),
      });

      await setAuthToken(data.token);

      set({
        isLoading: false,
        isAuthenticated: true,
        otpSent: false,
        otpCode: '',
        errorMessage: '',
        user: data.user || { phone: phoneNumber },
      });

      return true;
    } catch (err) {
      set({
        isLoading: false,
        errorMessage: err.message || 'Invalid OTP. Please try again.',
      });
      return false;
    }
  },

  logout: () => {
    clearAuthToken();
    set({
      isAuthenticated: false,
      phoneNumber: '',
      otpCode: '',
      otpSent: false,
      isLoading: false,
      errorMessage: '',
      user: null,
    });
  },

  setOtpCode: (value) => set({ otpCode: value }),
}));
