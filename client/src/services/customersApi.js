import { apiClient } from './apiClient.js';

export const customersApi = {
  async listAdmin(params = {}) {
    const { data } = await apiClient.get('/admin/customers', { params });
    return data;
  }
};
