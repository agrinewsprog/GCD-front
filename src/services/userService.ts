import axios from '@/lib/axios';

export interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  roles: string[];
  role_ids?: number[];
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface CreateUserData {
  name: string;
  surname: string;
  email: string;
  password: string;
  role_ids: number[];
}

export interface UpdateUserData {
  name: string;
  surname: string;
  email: string;
  password?: string;
  role_ids: number[];
}

const userService = {
  async getAll(): Promise<User[]> {
    const response = await axios.get('/users');
    return response.data;
  },

  async getById(id: number): Promise<User> {
    const response = await axios.get(`/users/${id}`);
    return response.data;
  },

  async create(data: CreateUserData): Promise<void> {
    await axios.post('/users', data);
  },

  async update(id: number, data: UpdateUserData): Promise<void> {
    await axios.put(`/users/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    await axios.delete(`/users/${id}`);
  },

  async getRoles(): Promise<Role[]> {
    const response = await axios.get('/users/roles');
    return response.data;
  },
};

export default userService;
