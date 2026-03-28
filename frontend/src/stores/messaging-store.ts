import { create } from 'zustand';

interface MessagingState {
  activeConversationId: string | null;
  unreadCounts: Record<string, number>;
  totalUnread: number;
  setActiveConversation: (id: string | null) => void;
  setUnreadCount: (conversationId: string, count: number) => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
  setTotalUnread: (total: number) => void;
  initUnreadCounts: (counts: Record<string, number>) => void;
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  activeConversationId: null,
  unreadCounts: {},
  totalUnread: 0,

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setUnreadCount: (conversationId, count) =>
    set((state) => {
      const newCounts = { ...state.unreadCounts, [conversationId]: count };
      return {
        unreadCounts: newCounts,
        totalUnread: Object.values(newCounts).reduce((a, b) => a + b, 0),
      };
    }),

  incrementUnread: (conversationId) =>
    set((state) => {
      // Don't increment if user is viewing this conversation
      if (state.activeConversationId === conversationId) return state;
      const current = state.unreadCounts[conversationId] || 0;
      const newCounts = { ...state.unreadCounts, [conversationId]: current + 1 };
      return {
        unreadCounts: newCounts,
        totalUnread: Object.values(newCounts).reduce((a, b) => a + b, 0),
      };
    }),

  clearUnread: (conversationId) =>
    set((state) => {
      const newCounts = { ...state.unreadCounts, [conversationId]: 0 };
      return {
        unreadCounts: newCounts,
        totalUnread: Object.values(newCounts).reduce((a, b) => a + b, 0),
      };
    }),

  setTotalUnread: (total) => set({ totalUnread: total }),

  initUnreadCounts: (counts) =>
    set({
      unreadCounts: counts,
      totalUnread: Object.values(counts).reduce((a, b) => a + b, 0),
    }),
}));
