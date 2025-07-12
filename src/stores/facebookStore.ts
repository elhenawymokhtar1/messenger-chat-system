/**
 * 🏪 Facebook Store - إدارة حالة Facebook بدون Local Storage
 */

import { create } from 'zustand';

interface FacebookPage {
  id: string;
  company_id: string;
  page_id: string;
  page_name: string;
  access_token: string;
  is_active: boolean;
  webhook_verify_token?: string;
  auto_reply_enabled?: boolean;
  welcome_message?: string;
  created_at: string;
  updated_at: string;
}

interface FacebookStore {
  // State
  connectedPages: FacebookPage[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setConnectedPages: (pages: FacebookPage[]) => void;
  addPage: (page: FacebookPage) => void;
  removePage: (pageId: string) => void;
  updatePage: (pageId: string, updates: Partial<FacebookPage>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearStore: () => void;
}

export const useFacebookStore = create<FacebookStore>((set, get) => ({
  // Initial State
  connectedPages: [],
  isLoading: false,
  error: null,

  // Actions
  setConnectedPages: (pages) => set({ connectedPages: pages }),
  
  addPage: (page) => set((state) => ({
    connectedPages: [...state.connectedPages, page]
  })),
  
  removePage: (pageId) => set((state) => ({
    connectedPages: state.connectedPages.filter(page => page.id !== pageId)
  })),
  
  updatePage: (pageId, updates) => set((state) => ({
    connectedPages: state.connectedPages.map(page =>
      page.id === pageId ? { ...page, ...updates } : page
    )
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearStore: () => set({ connectedPages: [], isLoading: false, error: null })
}));
