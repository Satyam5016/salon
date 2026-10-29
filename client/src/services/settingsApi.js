import { apiClient } from './apiClient.js';

export const settingsApi = {
  async getPublic() {
    const { data } = await apiClient.get('/settings');
    return data;
  },

  async getAdmin() {
    const { data } = await apiClient.get('/admin/settings');
    return data;
  },

  async update(payload) {
    const { data } = await apiClient.put('/admin/settings', payload);
    return data;
  }
};
