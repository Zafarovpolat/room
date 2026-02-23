// client/src/stores/usePlaylistStore.js

import { create } from 'zustand';

export const usePlaylistStore = create((set) => ({
  items: [],
  isOpen: false,

  setItems: (items) => set({ items }),
  setOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}));