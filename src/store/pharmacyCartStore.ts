import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PharmacyCartItem = {
  storeId: string;
  storeName: string;
  productId: number;
  name: string;
  unitPrice: number;
  currency: string;
  imageUrl?: string;
  quantity: number;
};

type PharmacyCartState = {
  storeId: string | null;
  storeName: string | null;
  items: PharmacyCartItem[];

  addItem: (item: Omit<PharmacyCartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  clear: () => void;
};

export const usePharmacyCartStore = create<PharmacyCartState>()(
  persist(
    (set, get) => ({
      storeId: null,
      storeName: null,
      items: [],

      addItem: (item) => {
        const quantity = Math.max(1, Math.floor(item.quantity ?? 1));
        const currentStoreId = get().storeId;

        if (currentStoreId && currentStoreId !== item.storeId) {
          set({ storeId: item.storeId, storeName: item.storeName, items: [{ ...item, quantity }] });
          return;
        }

        const items = get().items;
        const idx = items.findIndex((i) => i.productId === item.productId);
        if (idx >= 0) {
          const next = [...items];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
          set({ items: next, storeId: item.storeId, storeName: item.storeName });
          return;
        }

        set({
          storeId: item.storeId,
          storeName: item.storeName,
          items: [...items, { ...item, quantity }],
        });
      },

      removeItem: (productId) => {
        const next = get().items.filter((i) => i.productId !== productId);
        if (next.length === 0) {
          set({ items: [], storeId: null, storeName: null });
          return;
        }
        set({ items: next });
      },

      setQuantity: (productId, quantity) => {
        const q = Math.max(1, Math.floor(quantity));
        const items = get().items;
        const idx = items.findIndex((i) => i.productId === productId);
        if (idx < 0) return;
        const next = [...items];
        next[idx] = { ...next[idx], quantity: q };
        set({ items: next });
      },

      clear: () => set({ storeId: null, storeName: null, items: [] }),
    }),
    { name: "medics_pharmacy_cart" },
  ),
);

export const selectCartCount = (s: PharmacyCartState) => s.items.reduce((sum, i) => sum + i.quantity, 0);
export const selectCartTotal = (s: PharmacyCartState) =>
  s.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

