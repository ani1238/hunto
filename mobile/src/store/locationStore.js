import { create } from 'zustand';
import * as Location from 'expo-location';
import { apiRequest } from '../api/apiClient';

const normalizeBackendLocation = (location) => ({
  id: String(location.id),
  label: location.label,
  city: location.city,
  latitude: location.latitude,
  longitude: location.longitude,
  isServiceable: true,
  isCurrent: location.isCurrent,
  addressLine: location.addressLine,
  state: location.state,
  postalCode: location.postalCode,
  country: location.country,
});

const useLocationStore = create((set, get) => ({
  currentLocation: null,
  selectedLocation: null,
  recentLocations: [],
  persistedLocations: [],
  isLoadingLocation: false,
  locationError: null,
  locationPermission: null,

  setSelectedLocation: (location) => set({ selectedLocation: location }),

  addRecentLocation: (location) => set((state) => {
    if (!location || location.id === 'current') {
      return state;
    }
    const filtered = state.recentLocations.filter((loc) => String(loc.id) !== String(location.id));
    return { recentLocations: [location, ...filtered].slice(0, 5) };
  }),

  requestLocationPermission: async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      set({ locationPermission: status });
      return status;
    } catch (error) {
      set({ locationError: error.message || 'Failed to request location permission' });
      return null;
    }
  },

  getCurrentLocation: async () => {
    set({ isLoadingLocation: true, locationError: null });
    try {
      const permission = await get().requestLocationPermission();
      if (permission !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const address = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const resolved = address?.[0] || {};
      const location = {
        id: 'current',
        label: resolved.name || resolved.street || 'Current Location',
        city: resolved.city || 'Unknown',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        isServiceable: true,
        isCurrentLocation: true,
        addressLine: resolved.street || resolved.name || 'Current Location',
        state: resolved.region || 'Unknown',
        postalCode: resolved.postalCode || '000000',
        country: resolved.country || 'India',
      };

      set({ currentLocation: location, isLoadingLocation: false, locationError: null });
      return location;
    } catch (error) {
      set({
        isLoadingLocation: false,
        locationError: error.message || 'Unable to get current location',
      });
      return null;
    }
  },

  loadPersistedLocations: async () => {
    set({ isLoadingLocation: true, locationError: null });
    try {
      const response = await apiRequest('/api/users/me/locations');
      const locations = (response.data || []).map(normalizeBackendLocation);
      const current = locations.find((loc) => loc.isCurrent) || null;
      set({
        persistedLocations: locations,
        selectedLocation: current || get().selectedLocation,
        isLoadingLocation: false,
      });
      return locations;
    } catch (error) {
      set({
        isLoadingLocation: false,
        locationError: error.message || 'Unable to load saved locations',
      });
      return [];
    }
  },

  saveLocation: async (location, setAsCurrent = true) => {
    if (!location) {
      return null;
    }
    const addressLine = String(location.addressLine || '').trim();
    if (!addressLine) {
      set({ locationError: 'Address line 1 is required to save an address' });
      return null;
    }

    set({ isLoadingLocation: true, locationError: null });
    try {
      const payload = {
        label: String(location.label || 'Saved Location').trim(),
        addressLine,
        city: location.city || 'Unknown',
        state: location.state || 'Unknown',
        postalCode: location.postalCode || '000000',
        country: location.country || 'India',
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        isCurrent: setAsCurrent,
      };

      const response = await apiRequest('/api/users/me/locations', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const saved = normalizeBackendLocation(response.data);
      const existing = get().persistedLocations.filter((loc) => String(loc.id) !== String(saved.id));
      const updated = [saved, ...existing].map((loc) => {
        if (setAsCurrent) {
          return { ...loc, isCurrent: String(loc.id) === String(saved.id) };
        }
        return loc;
      });

      set({
        persistedLocations: updated,
        selectedLocation: setAsCurrent ? saved : get().selectedLocation,
        isLoadingLocation: false,
      });
      return saved;
    } catch (error) {
      set({
        isLoadingLocation: false,
        locationError: error.message || 'Unable to save location',
      });
      return null;
    }
  },

  selectPersistedLocation: async (locationId) => {
    set({ isLoadingLocation: true, locationError: null });
    try {
      await apiRequest(`/api/users/me/locations/${locationId}/select`, { method: 'POST' });
      const locations = get().persistedLocations.map((loc) => ({
        ...loc,
        isCurrent: String(loc.id) === String(locationId),
      }));
      const selected = locations.find((loc) => loc.isCurrent) || null;
      set({
        persistedLocations: locations,
        selectedLocation: selected,
        isLoadingLocation: false,
      });
      return selected;
    } catch (error) {
      set({
        isLoadingLocation: false,
        locationError: error.message || 'Unable to select location',
      });
      return null;
    }
  },

  clearLocationError: () => set({ locationError: null }),
}));

export default useLocationStore;
