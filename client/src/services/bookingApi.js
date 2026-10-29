import { apiClient } from './apiClient.js';

export const bookingApi = {
  async availableSlots({ serviceId, staffId = 'any', date }) {
    const { data } = await apiClient.get('/booking/availability', {
      params: {
        serviceId,
        staffId,
        date
      }
    });
    return data;
  }
};
