// client/src/stores/useUserStore.js

import { create } from 'zustand';

export const useUserStore = create((set) => ({
  userName: localStorage.getItem('syncroom_name') || '',
  
  setUserName: (name) => {
    localStorage.setItem('syncroom_name', name);
    set({ userName: name });
  },
}));