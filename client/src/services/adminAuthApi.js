import { apiClient } from './apiClient.js';

export const adminAuthApi = {
  async login(credentials) {
    const { data } = await apiClient.post('/admin/auth/login', credentials);
    return data;
  },

  async me() {
    const { data } = await apiClient.get('/admin/auth/me');
    return data;
  },

  async logout() {
    const { data } = await apiClient.post('/admin/auth/logout');
    return data;
  }
};
