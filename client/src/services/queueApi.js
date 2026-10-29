import { apiClient } from './apiClient.js';

export const queueApi = {
  async live() {
    const { data } = await apiClient.get('/admin/queue/live');
    return data;
  },

  async appointmentStatus(id) {
    const { data } = await apiClient.get(`/appointments/${id}/queue-status`);
    return data;
  }
};
