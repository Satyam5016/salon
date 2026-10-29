import { apiClient } from './apiClient.js';

export const servicesApi = {
  async listPublic() {
    const { data } = await apiClient.get('/services');
    return data;
  },

  async listAdmin() {
    const { data } = await apiClient.get('/admin/services');
    return data;
  },

  async create(payload) {
    const { data } = await apiClient.post('/admin/services', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await apiClient.put(`/admin/services/${id}`, payload);
    return data;
  },

  async remove(id) {
    const { data } = await apiClient.delete(`/admin/services/${id}`);
    return data;
  },

  async updateStatus(id, active) {
    const { data } = await apiClient.patch(`/admin/services/${id}/status`, { active });
    return data;
  }
};
