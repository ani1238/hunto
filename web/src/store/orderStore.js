import { create } from 'zustand';
import { apiRequest } from '../api/authApi';

export const useOrderStore = create((set, get) => ({
  currentOrder: null,
  tracking: null,
  isLoading: false,
  errorMessage: '',

  createOrder: async (deliveryLocationId, cartItems) => {
    set({ isLoading: true, errorMessage: '' });
    try {
      const response = await apiRequest('/api/orders', {
        method: 'POST',
        data: { 
          deliveryLocationId: Number(deliveryLocationId),
        },
      });

      const order = response.data || response;
      set({
        currentOrder: order,
        isLoading: false,
        errorMessage: '',
      });
      return { success: true, order };
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: error.message || 'Failed to place order',
      });
      return { success: false, error: error.message || 'Failed to place order' };
    }
  },

  getOrderById: async (orderId) => {
    set({ isLoading: true, errorMessage: '' });
    try {
      const response = await apiRequest(`/api/orders/${orderId}`, {
        method: 'GET',
      });

      const order = response.data || response;
      set({
        currentOrder: order,
        isLoading: false,
      });
      return order;
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: error.message || 'Failed to load order',
      });
      return null;
    }
  },

  trackOrder: async (orderId) => {
    try {
      const response = await apiRequest(`/api/orders/${orderId}/track`, {
        method: 'GET',
      });

      const tracking = response.data || response;
      const status = tracking?.status;
      set({ tracking, errorMessage: '' });
      
      const lastStatus = get().tracking?.status;
      const shouldNotify = status && status !== lastStatus;
      
      return { tracking, shouldNotify };
    } catch (error) {
      set({ errorMessage: error.message || 'Failed to track order' });
      return { tracking: null, shouldNotify: false };
    }
  },

  clearCurrentOrder: () => set({ currentOrder: null, tracking: null }),
}));
