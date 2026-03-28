import { create } from 'zustand';
import { apiRequest } from '../api/authApi';

export const useLocationStore = create((set, get) => ({
  selectedLocation: null,
  locations: [],
  isLoading: false,
  errorMessage: '',

  setSelectedLocation: (location) => set({ selectedLocation: location }),

  fetchLocations: async () => {
    set({ isLoading: true, errorMessage: '' });
    try {
      const data = await apiRequest('/api/users/me/locations', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const locationsList = Array.isArray(data) ? data : data.locations || [];
      const defaultLocation = locationsList.find((loc) => loc.isDefault) || locationsList[0];

      set({
        locations: locationsList,
        selectedLocation: defaultLocation || null,
        isLoading: false,
      });

      return locationsList;
    } catch (err) {
      set({
        isLoading: false,
        errorMessage: err.message || 'Failed to fetch locations.',
      });
      return [];
    }
  },

  saveLocation: async (address, latitude, longitude, label = 'Home') => {
    set({ isLoading: true, errorMessage: '' });
    try {
      const data = await apiRequest('/api/users/me/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({
          address,
          latitude,
          longitude,
          label,
        }),
      });

      const newLocation = data.location || data;
      set((state) => ({
        locations: [...state.locations, newLocation],
        selectedLocation: newLocation,
        isLoading: false,
        errorMessage: '',
      }));

      return true;
    } catch (err) {
      set({
        isLoading: false,
        errorMessage: err.message || 'Failed to save location.',
      });
      return false;
    }
  },

  selectLocation: async (locationId) => {
    set({ isLoading: true, errorMessage: '' });
    try {
      const data = await apiRequest(`/api/users/me/locations/${locationId}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const selected = data.location || data;
      set({
        selectedLocation: selected,
        isLoading: false,
        errorMessage: '',
      });

      return true;
    } catch (err) {
      set({
        isLoading: false,
        errorMessage: err.message || 'Failed to select location.',
      });
      return false;
    }
  },

  deleteLocation: async (locationId) => {
    set({ isLoading: true, errorMessage: '' });
    try {
      await apiRequest(`/api/users/me/locations/${locationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      set((state) => ({
        locations: state.locations.filter((loc) => loc.id !== locationId),
        isLoading: false,
        errorMessage: '',
      }));

      return true;
    } catch (err) {
      set({
        isLoading: false,
        errorMessage: err.message || 'Failed to delete location.',
      });
      return false;
    }
  },
}));
