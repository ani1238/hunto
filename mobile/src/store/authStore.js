import { create } from 'zustand';
import { apiRequest, clearAuthToken, getAuthToken, setAuthToken } from '../api/apiClient';

const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  phoneNumber: '',
  otpCode: '',
  otpSent: false,
  otpAttempts: 0,
  otpDebugCode: null,
  isLoading: false,
  errorMessage: '',
  userProfile: {
    name: '',
    email: '',
    phone: '',
  },
  profileCompleted: false,

  requestOtp: async (phoneNumber) => {
    set({ isLoading: true, errorMessage: '' });

    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
      set({ isLoading: false, errorMessage: 'Enter a valid 10-digit phone number.' });
      return false;
    }

    const normalizedPhone = phoneNumber.trim();

    try {
      const data = await apiRequest('/api/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: normalizedPhone }),
      });

      set({
        phoneNumber: normalizedPhone,
        otpSent: true,
        otpDebugCode: data.debugOtp || null,
        otpCode: '',
        isLoading: false,
        otpAttempts: 0,
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
    const { phoneNumber, otpAttempts } = get();

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
        body: JSON.stringify({ phone: phoneNumber, otp: code }),
      });

      await setAuthToken(data.token);

      const user = data.user || {};
      const hasProfile = Boolean(user.name && user.email);

      set({
        isLoading: false,
        isAuthenticated: true,
        otpSent: false,
        otpCode: '',
        otpDebugCode: null,
        otpAttempts: 0,
        errorMessage: '',
        userProfile: {
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || phoneNumber,
        },
        profileCompleted: hasProfile,
      });

      return true;
    } catch (err) {
      set({
        isLoading: false,
        otpAttempts: otpAttempts + 1,
        errorMessage: err.message || 'Invalid OTP. Please try again.',
      });
      return false;
    }
  },

  completeProfile: async (name, email) => {
    set({ isLoading: true, errorMessage: '' });

    // Basic client-side validation
    if (!name.trim() || !email.trim()) {
      set({ isLoading: false, errorMessage: 'Name and email are required.' });
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      set({ isLoading: false, errorMessage: 'Enter a valid email address.' });
      return false;
    }

    try {
      const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: get().phoneNumber }),
      });

      if (data.token) {
        await setAuthToken(data.token);
      }

      const user = data.user || {};
      set({
        isLoading: false,
        userProfile: {
          name: user.name || name.trim(),
          email: user.email || email.trim(),
          phone: user.phone || get().phoneNumber,
        },
        profileCompleted: true,
        errorMessage: '',
      });
      return true;
    } catch (err) {
      set({ isLoading: false, errorMessage: err.message || 'Unable to register profile' });
      return false;
    }
  },

  updateProfile: async (name, email) => {
    const phone = get().phoneNumber || get().userProfile.phone;
    if (!phone) {
      set({ errorMessage: 'Phone is missing for profile update.' });
      return false;
    }
    return get().completeProfile(name, email);
  },

  hydrateAuth: async () => {
    const token = await getAuthToken();
    if (!token) {
      return;
    }

    try {
      const data = await apiRequest('/api/auth/me');
      const user = data.data || {};

      set({
        isAuthenticated: true,
        userProfile: {
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
        },
        profileCompleted: Boolean(user.name && user.email),
        errorMessage: '',
      });
    } catch (err) {
      await clearAuthToken();
      set({
        isAuthenticated: false,
        userProfile: { name: '', email: '', phone: '' },
        profileCompleted: false,
      });
    }
  },

  logout: async () => {
    await clearAuthToken();
    set({
      isAuthenticated: false,
      phoneNumber: '',
      otpCode: '',
      otpSent: false,
      otpAttempts: 0,
      otpDebugCode: null,
      isLoading: false,
      errorMessage: '',
      userProfile: { name: '', email: '', phone: '' },
      profileCompleted: false,
    });
  },

  setOtpCode: (value) => set({ otpCode: value }),
}));

export default useAuthStore;
