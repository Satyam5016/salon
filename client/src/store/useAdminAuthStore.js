import { create } from 'zustand';

const storageKey = 'bliss_admin_profile';

function getStoredAdmin() {
  try {
    const value = sessionStorage.getItem(storageKey);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export const useAdminAuthStore = create((set) => ({
  admin: getStoredAdmin(),
  initialized: false,
  isAuthenticated: Boolean(getStoredAdmin()),
  setAdmin: (admin) => {
    if (admin) {
      sessionStorage.setItem(storageKey, JSON.stringify(admin));
    } else {
      sessionStorage.removeItem(storageKey);
    }

    set({ admin, isAuthenticated: Boolean(admin), initialized: true });
  },
  setInitialized: () => set({ initialized: true }),
  clearAdmin: () => {
    sessionStorage.removeItem(storageKey);
    set({ admin: null, isAuthenticated: false, initialized: true });
  }
}));
