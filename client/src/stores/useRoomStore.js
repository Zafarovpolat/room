// client/src/stores/useRoomStore.js

import { create } from 'zustand';

export const useRoomStore = create((set) => ({
  roomId: null,
  users: [],
  connected: false,
  
  setRoomId: (roomId) => set({ roomId }),
  setUsers: (users) => set({ users }),
  setConnected: (connected) => set({ connected }),
  
  addUser: (userName) => set((state) => ({
    users: [...state.users, userName],
  })),
  
  removeUser: (userName) => set((state) => ({
    users: state.users.filter(u => u !== userName),
  })),
}));