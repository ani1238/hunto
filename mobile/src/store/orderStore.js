import { create } from 'zustand';
import { apiRequest } from '../api/apiClient';

const useOrderStore = create((set, get) => ({
  orders: [],
  currentOrder: null,
  tracking: null,
  isLoading: false,
  errorMessage: '',
  lastNotifiedStatus: null,

  loadOrders: async () => {
    set({ isLoading: true, errorMessage: '' });
    try {
      const response = await apiRequest('/api/orders');
      set({
        orders: response.data || [],
        isLoading: false,
      });
      return true;
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: error.message || 'Unable to load orders',
      });
      return false;
    }
  },

  loadOrderById: async (orderId) => {
    set({ isLoading: true, errorMessage: '' });
    try {
      const response = await apiRequest(`/api/orders/${orderId}`);
      set({ currentOrder: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: error.message || 'Unable to load order',
      });
      return null;
    }
  },

  trackOrder: async (orderId) => {
    try {
      const response = await apiRequest(`/api/orders/${orderId}/track`);
      const tracking = response.data;
      const status = tracking?.status;
      set({ tracking });
      const shouldNotify = status && status !== get().lastNotifiedStatus;
      if (shouldNotify) {
        set({ lastNotifiedStatus: status });
      }
      return { tracking, shouldNotify };
    } catch (error) {
      set({ errorMessage: error.message || 'Unable to track order' });
      return { tracking: null, shouldNotify: false };
    }
  },
}));

export default useOrderStore;
