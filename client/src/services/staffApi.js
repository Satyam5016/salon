import { apiClient } from './apiClient.js';

export const staffApi = {
  async listPublic() {
    const { data } = await apiClient.get('/staff');
    return data;
  },

  async listAdmin() {
    const { data } = await apiClient.get('/admin/staff');
    return data;
  },

  async create(payload) {
    const { data } = await apiClient.post('/admin/staff', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await apiClient.put(`/admin/staff/${id}`, payload);
    return data;
  },

  async remove(id) {
    const { data } = await apiClient.delete(`/admin/staff/${id}`);
    return data;
  },

  async updateStatus(id, active) {
    const { data } = await apiClient.patch(`/admin/staff/${id}/status`, { active });
    return data;
  }
};
