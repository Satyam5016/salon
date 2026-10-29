import { apiClient } from './apiClient.js';

export const offersApi = {
  async listPublic() {
    const { data } = await apiClient.get('/offers');
    return data;
  },

  async listAdmin() {
    const { data } = await apiClient.get('/admin/offers');
    return data;
  },

  async create(payload) {
    const { data } = await apiClient.post('/admin/offers', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await apiClient.put(`/admin/offers/${id}`, payload);
    return data;
  },

  async remove(id) {
    const { data } = await apiClient.delete(`/admin/offers/${id}`);
    return data;
  },

  async updateStatus(id, active) {
    const { data } = await apiClient.patch(`/admin/offers/${id}/status`, { active });
    return data;
  }
};
