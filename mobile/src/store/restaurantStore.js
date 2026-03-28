import { create } from 'zustand';
import { apiRequest } from '../api/apiClient';

const useRestaurantStore = create((set, get) => ({
  restaurants: [],
  isLoading: false,
  errorMessage: '',

  fetchRestaurants: async (search = '') => {
    set({ isLoading: true, errorMessage: '' });
    try {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await apiRequest(`/api/restaurants${qs}`);
      set({
        restaurants: response.data || [],
        isLoading: false,
        errorMessage: '',
      });
      return true;
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: error.message || 'Failed to load restaurants',
      });
      return false;
    }
  },

  getRestaurantById: async (restaurantId) => {
    try {
      const response = await apiRequest(`/api/restaurants/${restaurantId}`);
      return response.data;
    } catch (error) {
      set({ errorMessage: error.message || 'Failed to load restaurant' });
      return null;
    }
  },
}));

export default useRestaurantStore;
