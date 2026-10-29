import { apiClient } from './apiClient.js';

export const appointmentsApi = {
  async listAdmin(params = {}) {
    const { data } = await apiClient.get('/admin/appointments', { params });
    return data;
  },

  async createAdmin(payload) {
    const { data } = await apiClient.post('/admin/appointments', payload);
    return data;
  },

  async getAdmin(id) {
    const { data } = await apiClient.get(`/admin/appointments/${id}`);
    return data;
  },

  async updateAdmin(id, payload) {
    const { data } = await apiClient.put(`/admin/appointments/${id}`, payload);
    return data;
  },

  async rescheduleAdmin(id, payload) {
    const { data } = await apiClient.patch(`/admin/appointments/${id}/reschedule`, payload);
    return data;
  },

  async cancelAdmin(id) {
    const { data } = await apiClient.patch(`/admin/appointments/${id}/cancel`);
    return data;
  },

  async create(payload) {
    const { data } = await apiClient.post('/appointments', payload);
    return data;
  },

  async track(payload) {
    const { data } = await apiClient.post('/appointments/track', payload);
    return data;
  },

  async selfCheckIn(payload) {
    const { data } = await apiClient.post('/appointments/self-check-in', payload);
    return data;
  },

  async customerCancel(id, payload) {
    const { data } = await apiClient.patch(`/appointments/${id}/cancel`, payload);
    return data;
  },

  async customerReschedule(id, payload) {
    const { data } = await apiClient.patch(`/appointments/${id}/reschedule`, payload);
    return data;
  },

  async adminCheckIn(id) {
    const { data } = await apiClient.patch(`/admin/appointments/${id}/check-in`);
    return data;
  },

  async adminStartService(id, payload = {}) {
    const { data } = await apiClient.patch(`/admin/appointments/${id}/start`, payload);
    return data;
  },

  async adminCompleteService(id) {
    const { data } = await apiClient.patch(`/admin/appointments/${id}/complete`);
    return data;
  },

  async adminMarkLate(id) {
    const { data } = await apiClient.patch(`/admin/appointments/${id}/late`);
    return data;
  },

  async adminSkip(id) {
    const { data } = await apiClient.patch(`/admin/appointments/${id}/skip`);
    return data;
  },

  async adminNoShow(id) {
    const { data } = await apiClient.patch(`/admin/appointments/${id}/no-show`);
    return data;
  },

  async createWalkIn(payload) {
    const { data } = await apiClient.post('/admin/walk-ins', payload);
    return data;
  }
};
