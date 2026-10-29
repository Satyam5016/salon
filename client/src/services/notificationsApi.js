import { apiClient } from './apiClient.js';

export const notificationsApi = {
  async markBrowserSent(id) {
    const { data } = await apiClient.patch(`/notifications/${id}/browser-sent`);
    return data;
  }
};
