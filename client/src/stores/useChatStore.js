// client/src/stores/useChatStore.js

import { create } from 'zustand';

export const useChatStore = create((set) => ({
  messages: [],
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  
  prependMessages: (olderMessages) => set((state) => ({
    messages: [...olderMessages, ...state.messages],
  })),

  addReaction: (messageId, userName, emoji) => set((state) => ({
    messages: state.messages.map(msg => {
      if (msg.id !== messageId) return msg;
      const reactions = [...(msg.reactions || [])];
      reactions.push({ userName, emoji });
      return { ...msg, reactions };
    }),
  })),

  removeReaction: (messageId, userName, emoji) => set((state) => ({
    messages: state.messages.map(msg => {
      if (msg.id !== messageId) return msg;
      const reactions = (msg.reactions || []).filter(
        r => !(r.userName === userName && r.emoji === emoji)
      );
      return { ...msg, reactions };
    }),
  })),
}));