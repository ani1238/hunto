import { create } from 'zustand';
import { apiRequest } from '../api/authApi';
import { filterByRadius } from '../utils/distance';

export const useRestaurantStore = create((set, get) => ({
  restaurants: [],
  isLoading: false,
  errorMessage: '',

  fetchRestaurants: async (search = '', latitude = null, longitude = null) => {
    set({ isLoading: true, errorMessage: '' });
    try {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await apiRequest(`/api/restaurants${qs}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      let restaurantsList = Array.isArray(response) ? response : response.data || [];
      
      // Filter by 10km radius if location is provided
      if (latitude && longitude) {
        restaurantsList = filterByRadius(restaurantsList, latitude, longitude, 10);
      }

      set({
        restaurants: restaurantsList,
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
      const response = await apiRequest(`/api/restaurants/${restaurantId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data || response;
    } catch (error) {
      set({ errorMessage: error.message || 'Failed to load restaurant' });
      return null;
    }
  },

  clearRestaurants: () => set({ restaurants: [], errorMessage: '' }),
}));
