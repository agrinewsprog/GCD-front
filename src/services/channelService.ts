import api from '@/lib/axios';
import { Channel, ChannelWithActions } from '@/types';

export const channelService = {
  async getAll() {
    const response = await api.get<Channel[]>('/channels');
    return response.data;
  },

  async getById(id: number) {
    const response = await api.get<ChannelWithActions>(`/channels/${id}`);
    return response.data;
  },

  async create(data: Omit<Channel, 'id' | 'created_at' | 'updated_at'>) {
    const response = await api.post<Channel>('/channels', data);
    return response.data;
  },

  async update(id: number, data: Partial<Omit<Channel, 'id' | 'created_at' | 'updated_at'>>) {
    const response = await api.put<Channel>(`/channels/${id}`, data);
    return response.data;
  },

  async delete(id: number) {
    const response = await api.delete(`/channels/${id}`);
    return response.data;
  },

  async assignActions(channelId: number, actionIds: number[]) {
    const response = await api.post(`/channels/${channelId}/actions`, { action_ids: actionIds });
    return response.data;
  },

  async removeAction(channelId: number, actionId: number) {
    const response = await api.delete(`/channels/${channelId}/actions/${actionId}`);
    return response.data;
  },
};
