import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  restaurantId: null,

  addItem: (item) => {
    const { items } = get();
    const existing = items.find((i) => i.id === item.id);

    if (existing) {
      set({
        items: items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({
        items: [...items, { ...item, quantity: 1 }],
      });
    }
  },

  removeItem: (itemId) => {
    set({
      items: get().items.filter((i) => i.id !== itemId),
    });
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      set({
        items: get().items.filter((i) => i.id !== itemId),
      });
    } else {
      set({
        items: get().items.map((i) =>
          i.id === itemId ? { ...i, quantity } : i
        ),
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

  clear: () => {
    set({ items: [], restaurantId: null });
  },

  clearCart: () => {
    set({ items: [], restaurantId: null });
  },

  setRestaurant: (restaurantId) => {
    set({ restaurantId });
  },
}));
