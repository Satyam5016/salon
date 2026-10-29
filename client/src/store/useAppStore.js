import { create } from 'zustand';

export const useAppStore = create((set) => ({
  apiStatus: 'Checking API health...',
  setApiStatus: (apiStatus) => set({ apiStatus })
}));
