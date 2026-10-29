import { apiClient } from './apiClient.js';

export const healthApi = {
  async check() {
    const { data } = await apiClient.get('/health');
    return data;
  }
};
