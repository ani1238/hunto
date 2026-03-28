import { create } from 'zustand';
import { apiRequest } from '../api/authApi';

export const useCartStore = create((set, get) => ({
  items: [],
  restaurantId: null,
  isLoading: false,
  errorMessage: '',

  addItem: async (item) => {
    set({ isLoading: true, errorMessage: '' });
    try {
      const response = await apiRequest('/api/cart/items', {
        method: 'POST',
        data: {
          menuItemId: Number(item.id),
          quantity: get().getItemQuantity(item.id) + 1,
        },
      });

      const backendCart = response.data || response;
      set({
        items: backendCart.items || [],
        restaurantId: backendCart.restaurantId,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: error.message || 'Failed to add item',
      });
    }
  },

  removeItem: async (itemId) => {
    const currentQuantity = get().getItemQuantity(itemId);
    if (currentQuantity <= 1) {
      return get().removeItemCompletely(itemId);
    }
    return get().updateQuantity(itemId, currentQuantity - 1);
  },

  removeItemCompletely: async (itemId) => {
    set({ isLoading: true, errorMessage: '' });
    try {
      const response = await apiRequest('/api/cart/items', {
        method: 'POST',
        data: {
          menuItemId: Number(itemId),
          quantity: 0,
        },
      });

      const backendCart = response.data || response;
      set({
        items: backendCart.items || [],
        restaurantId: backendCart.restaurantId,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: error.message || 'Failed to remove item',
      });
    }
  },

  updateQuantity: async (itemId, quantity) => {
    if (quantity <= 0) {
      return get().removeItemCompletely(itemId);
    }

    set({ isLoading: true, errorMessage: '' });
    try {
      const response = await apiRequest('/api/cart/items', {
        method: 'POST',
        data: {
          menuItemId: Number(itemId),
          quantity,
        },
      });

      const backendCart = response.data || response;
      set({
        items: backendCart.items || [],
        restaurantId: backendCart.restaurantId,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: error.message || 'Failed to update quantity',
      });
    }
  },

  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getTotalPrice: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getItemQuantity: (itemId) => {
    const item = get().items.find((i) => i.id === itemId);
    return item?.quantity || 0;
  },

  clear: async () => {
    set({ isLoading: true, errorMessage: '' });
    try {
      await apiRequest('/api/cart/clear', {
        method: 'POST',
      });
      set({ items: [], restaurantId: null, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: error.message || 'Failed to clear cart',
      });
    }
  },

  clearCart: async () => {
    return get().clear();
  },

  setRestaurant: (restaurantId) => {
    set({ restaurantId });
  },
}));
