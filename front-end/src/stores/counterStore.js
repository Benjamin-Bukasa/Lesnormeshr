import { create } from 'zustand';

const useCounterStore = create((set) => ({
  cartItems: [],
  setCartItems: (items) => set({ cartItems: Array.isArray(items) ? items : [] }),
  addCartItem: (item) => {
    set((state) => ({
      cartItems: [...state.cartItems, item],
    }));
  },
  clearCartItems: () => set({ cartItems: [] }),
}));

export default useCounterStore;
