import api from '@/lib/axios';
import { Medium, MediumWithChannels } from '@/types';

export const mediumService = {
  async getAll() {
    const response = await api.get<Medium[]>('/mediums');
    return response.data;
  },

  async getById(id: number) {
    const response = await api.get<MediumWithChannels>(`/mediums/${id}`);
    return response.data;
  },

  async create(data: Omit<Medium, 'id' | 'created_at' | 'updated_at'>) {
    const response = await api.post<Medium>('/mediums', data);
    return response.data;
  },

  async update(id: number, data: Partial<Omit<Medium, 'id' | 'created_at' | 'updated_at'>>) {
    const response = await api.put<Medium>(`/mediums/${id}`, data);
    return response.data;
  },

  async delete(id: number) {
    const response = await api.delete(`/mediums/${id}`);
    return response.data;
  },

  async assignChannels(mediumId: number, channelIds: number[]) {
    const response = await api.post(`/mediums/${mediumId}/channels`, { channel_ids: channelIds });
    return response.data;
  },

  async removeChannel(mediumId: number, channelId: number) {
    const response = await api.delete(`/mediums/${mediumId}/channels/${channelId}`);
    return response.data;
  },
};
