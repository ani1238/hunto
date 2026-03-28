import { create } from 'zustand';
import { apiRequest } from '../api/authApi';

const normalizeCartItems = (items = []) => {
  return items.map((item) => ({
    id: Number(item.menuItemId || item.id),
    menuItemId: Number(item.menuItemId || item.id),
    name: item.menuItemName,
    price: item.unitPrice,
    quantity: item.quantity,
    restaurantId: Number(item.restaurantId),
    restaurantName: item.restaurantName,
    lineTotal: item.lineTotal,
  }));
};

export const useCartStore = create((set, get) => ({
  items: [],
  restaurantId: null,
  isLoading: false,
  errorMessage: '',

  addItem: async (item) => {
    set({ isLoading: true, errorMessage: '' });
    try {
      console.log('[CartStore] Adding item:', item.id);
      const response = await apiRequest('/api/cart/items', {
        method: 'POST',
        data: {
          menuItemId: Number(item.id),
          quantity: get().getItemQuantity(item.id) + 1,
        },
      });

      console.log('[CartStore] API Response:', response);
      const backendCart = response.data || response;
      console.log('[CartStore] Backend cart items:', backendCart.items);
      
      const normalized = normalizeCartItems(backendCart.items || []);
      console.log('[CartStore] Normalized items:', normalized);
      
      set({
        items: normalized,
        restaurantId: backendCart.restaurantId,
        isLoading: false,
      });
      console.log('[CartStore] State updated, new items:', get().items);
    } catch (error) {
      console.error('[CartStore] Add item error:', error);
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
        items: normalizeCartItems(backendCart.items || []),
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
        items: normalizeCartItems(backendCart.items || []),
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
    const allItems = get().items;
    console.log(`[CartStore] getItemQuantity(${itemId}) - searching in items:`, allItems.map(i => ({ id: i.id, menuItemId: i.menuItemId })));
    const item = allItems.find((i) => i.id === itemId);
    console.log(`[CartStore] Found item:`, item, 'Quantity:', item?.quantity || 0);
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
