import { create } from 'zustand';
import { apiRequest } from '../api/authApi';
import { reverseGeocode } from '../utils/geocoding';

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
      // Reverse geocode to get address components
      const addressComponents = await reverseGeocode(latitude, longitude);

      const data = await apiRequest('/api/users/me/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({
          label,
          addressLine: addressComponents.addressLine,
          city: addressComponents.city,
          state: addressComponents.state,
          postalCode: addressComponents.postalCode,
          country: addressComponents.country,
          latitude,
          longitude,
          isCurrent: false,
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

  // Auto-detect user's current location using browser Geolocation API
  detectCurrentLocation: async () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Try to reverse geocode using Nominatim (OpenStreetMap's service, free)
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            const address = data.address?.name || 
                           data.address?.road || 
                           data.name || 
                           `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

            resolve({
              latitude,
              longitude,
              address,
              label: 'Current Location',
              isCurrent: true,
            });
          } catch (err) {
            // If reverse geocoding fails, just return coordinates
            resolve({
              latitude,
              longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              label: 'Current Location',
              isCurrent: true,
            });
          }
        },
        (error) => {
          // Silently fail if user denies permission
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  },
}));
