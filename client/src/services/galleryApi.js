import { apiClient } from './apiClient.js';

export const galleryApi = {
  async listPublic() {
    const { data } = await apiClient.get('/gallery');
    return data;
  },

  async listAdmin() {
    const { data } = await apiClient.get('/admin/gallery');
    return data;
  },

  async create(payload) {
    const { data } = await apiClient.post('/admin/gallery', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await apiClient.put(`/admin/gallery/${id}`, payload);
    return data;
  },

  async remove(id) {
    const { data } = await apiClient.delete(`/admin/gallery/${id}`);
    return data;
  },

  async updateStatus(id, active) {
    const { data } = await apiClient.patch(`/admin/gallery/${id}/status`, { active });
    return data;
  }
};
