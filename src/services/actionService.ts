import api from '@/lib/axios';
import { Action } from '@/types';

export const actionService = {
  async getAll() {
    const response = await api.get<Action[]>('/actions');
    return response.data;
  },

  async getById(id: number) {
    const response = await api.get<Action>(`/actions/${id}`);
    return response.data;
  },

  async create(data: Omit<Action, 'id' | 'created_at' | 'updated_at'>) {
    const response = await api.post<Action>('/actions', data);
    return response.data;
  },

  async update(id: number, data: Partial<Omit<Action, 'id' | 'created_at' | 'updated_at'>>) {
    const response = await api.put<Action>(`/actions/${id}`, data);
    return response.data;
  },

  async delete(id: number) {
    const response = await api.delete(`/actions/${id}`);
    return response.data;
  },
};
