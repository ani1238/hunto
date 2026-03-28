import { create } from 'zustand';
import { apiRequest } from '../api/authApi';

export const CART_RESTAURANT_CONFLICT = 'CART_RESTAURANT_CONFLICT';

const normalizeCart = (cart = {}) => ({
  id: cart.id || null,
  userId: cart.userId || null,
  restaurantId: cart.restaurantId || null,
  restaurantName: cart.restaurantName || '',
  items: cart.items || [],
  subtotal: cart.subtotal || 0,
  discountAmount: cart.discountAmount || 0,
  appliedDiscount: cart.appliedDiscount || null,
  totalItems: cart.totalItems || 0,
  totalPrice: cart.totalPrice || 0,
});

export const useCartStore = create((set, get) => ({
  cart: normalizeCart(),
  availableDiscounts: [],
  isLoading: false,
  errorMessage: '',

  loadCart: async () => {
    set({ isLoading: true, errorMessage: '' });
    try {
      const response = await apiRequest('/api/cart');
      const cartData = response.data || response;
      set({
        cart: normalizeCart(cartData),
        isLoading: false,
      });
      return true;
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: error.message || 'Unable to load cart',
      });
      return false;
    }
  },

  addItem: async (menuItem) => {
    const cart = get().cart || {};
    const cartItems = cart.items || [];
    const targetRestaurantId = String(menuItem?.restaurantId ?? '');

    if (targetRestaurantId && cartItems.length > 0) {
      const existingRestaurantIds = new Set(
        cartItems
          .map((item) => String(item.restaurantId ?? ''))
          .filter(Boolean)
      );
      if (existingRestaurantIds.size > 0 && !existingRestaurantIds.has(targetRestaurantId)) {
        const conflictMessage = 'Cart can only contain items from one restaurant';
        set({ errorMessage: conflictMessage });
        return { error: conflictMessage, code: CART_RESTAURANT_CONFLICT };
      }
    }

    const currentQuantity = get().getItemQuantity(menuItem.id);
    return get().setItemQuantity(menuItem.id, currentQuantity + 1);
  },

  removeItem: async (menuItemId) => {
    const currentQuantity = get().getItemQuantity(menuItemId);
    if (currentQuantity <= 1) {
      return get().removeItemCompletely(menuItemId);
    }
    return get().setItemQuantity(menuItemId, currentQuantity - 1);
  },

  setItemQuantity: async (menuItemId, quantity) => {
    if (quantity <= 0) {
      return get().removeItemCompletely(menuItemId);
    }

    set({ isLoading: true, errorMessage: '' });
    try {
      const response = await apiRequest('/api/cart/items', {
        method: 'POST',
        data: {
          menuItemId: Number(menuItemId),
          quantity,
        },
      });
      const cartData = response.data || response;
      set({
        cart: normalizeCart(cartData),
        isLoading: false,
      });
      return { error: null };
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: error.message || 'Unable to update cart',
      });
      return { error: error.message || 'Unable to update cart' };
    }
  },

  removeItemCompletely: async (menuItemId) => {
    const item = get().cart.items.find((i) => String(i.menuItemId) === String(menuItemId));
    if (!item) {
      return { error: null };
    }

    set({ isLoading: true, errorMessage: '' });
    try {
      const response = await apiRequest(`/api/cart/items/${item.id}`, {
        method: 'DELETE',
      });
      const cartData = response.data || response;
      set({
        cart: normalizeCart(cartData),
        isLoading: false,
      });
      return { error: null };
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: error.message || 'Unable to remove item',
      });
      return { error: error.message || 'Unable to remove item' };
    }
  },

  clearCart: async () => {
    set({ isLoading: true, errorMessage: '' });
    try {
      const response = await apiRequest('/api/cart', { method: 'DELETE' });
      const cartData = response.data || response;
      set({
        cart: normalizeCart(cartData),
        isLoading: false,
      });
      return true;
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: error.message || 'Unable to clear cart',
      });
      return false;
    }
  },

  placeOrder: async (deliveryLocationId) => {
    set({ isLoading: true, errorMessage: '' });
    try {
      const response = await apiRequest('/api/orders', {
        method: 'POST',
        data: {
          deliveryLocationId: Number(deliveryLocationId),
        },
      });
      const orderData = response.data || response;
      set({
        cart: normalizeCart(),
        isLoading: false,
      });
      return { success: true, order: orderData };
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: error.message || 'Unable to place order',
      });
      return { success: false, error: error.message || 'Unable to place order' };
    }
  },

  loadDiscounts: async () => {
    set({ isLoading: true, errorMessage: '' });
    try {
      const response = await apiRequest('/api/cart/discounts');
      set({
        availableDiscounts: response.data || [],
        isLoading: false,
      });
      return true;
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: error.message || 'Unable to load discounts',
      });
      return false;
    }
  },

  applyDiscount: async (code) => {
    set({ isLoading: true, errorMessage: '' });
    try {
      const response = await apiRequest('/api/cart/discounts/apply', {
        method: 'POST',
        data: { code },
      });
      const cartData = response.data || response;
      set({
        cart: normalizeCart(cartData),
        isLoading: false,
      });
      await get().loadDiscounts();
      return true;
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: error.message || 'Unable to apply discount',
      });
      return false;
    }
  },

  removeDiscount: async () => {
    set({ isLoading: true, errorMessage: '' });
    try {
      const response = await apiRequest('/api/cart/discounts', {
        method: 'DELETE',
      });
      const cartData = response.data || response;
      set({
        cart: normalizeCart(cartData),
        isLoading: false,
      });
      await get().loadDiscounts();
      return true;
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: error.message || 'Unable to remove discount',
      });
      return false;
    }
  },

  getItemQuantity: (menuItemId) => {
    const item = get().cart.items.find((i) => String(i.menuItemId) === String(menuItemId));
    return item ? item.quantity : 0;
  },

  getTotalItems: () => get().cart.totalItems || 0,
  getTotalPrice: () => get().cart.totalPrice || 0,
  getSubtotal: () => get().cart.subtotal || 0,
  getDiscountAmount: () => get().cart.discountAmount || 0,
  getItemCount: () => get().cart.totalItems || 0,
}));
