import api from '@/lib/axios';
import { LoginCredentials, RegisterData, User } from '@/types';

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post<{ token: string; user: User }>('/auth/login', credentials);
    return response.data;
  },

  async register(data: RegisterData) {
    const response = await api.post<{ message: string; user: User }>('/auth/register', data);
    return response.data;
  },

  async me() {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};
