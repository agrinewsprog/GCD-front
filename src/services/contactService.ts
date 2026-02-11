import api from '@/lib/axios';
import { Contact } from '@/types';

export const contactService = {
  async getAll(companyId?: number) {
    const url = companyId ? `/contacts?company_id=${companyId}` : '/contacts';
    const response = await api.get<Contact[]>(url);
    return response.data;
  },

  async getById(id: number) {
    const response = await api.get<Contact>(`/contacts/${id}`);
    return response.data;
  },

  async create(data: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'company_name'>) {
    const response = await api.post<Contact>('/contacts', data);
    return response.data;
  },

  async update(id: number, data: Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'company_name'>>) {
    const response = await api.put<Contact>(`/contacts/${id}`, data);
    return response.data;
  },

  async delete(id: number) {
    const response = await api.delete(`/contacts/${id}`);
    return response.data;
  },
};
