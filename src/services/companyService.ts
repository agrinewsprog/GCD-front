import api from '@/lib/axios';
import { Company } from '@/types';

export const companyService = {
  async getAll() {
    const response = await api.get<Company[]>('/companies');
    return response.data;
  },

  async getById(id: number) {
    const response = await api.get<Company>(`/companies/${id}`);
    return response.data;
  },

  async create(data: Omit<Company, 'id' | 'created_at' | 'updated_at'>) {
    const response = await api.post<Company>('/companies', data);
    return response.data;
  },

  async update(id: number, data: Partial<Omit<Company, 'id' | 'created_at' | 'updated_at'>>) {
    const response = await api.put<Company>(`/companies/${id}`, data);
    return response.data;
  },

  async delete(id: number) {
    const response = await api.delete(`/companies/${id}`);
    return response.data;
  },
};
