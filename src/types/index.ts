export interface User {
  id: number;
  name: string;
  surname?: string;
  email: string;
  roles: string[];
  role_id?: number; // Deprecated, usar roles
  role_name?: string; // Deprecated, usar roles
  created_at?: string;
  updated_at?: string;
}

export interface Company {
  id: number;
  name: string;
  billing_address?: string;
  billing_postal_code?: string;
  billing_city?: string;
  billing_province?: string;
  billing_country?: string;
  tax_number?: string;
  iban?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: number;
  company_id: number;
  company_name?: string;
  name: string;
  surname: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Medium {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Action {
  id: number;
  name: string;
  magazine_content_type?: 'technical' | 'ad' | null;
  created_at: string;
  updated_at: string;
}

export interface MediumWithChannels extends Medium {
  channels: Channel[];
}

export interface ChannelWithActions extends Channel {
  actions: Action[];
}

export interface ChannelWithMediums extends Channel {
  mediums: Medium[];
}

export interface ActionWithChannels extends Action {
  channels: Channel[];
}

export interface Campaign {
  id: number;
  name: string;
  description?: string;
  company_id: number;
  company_name?: string;
  contact_id: number;
  contact_name?: string;
  contact_surname?: string;
  contract_file?: string;
  total_amount?: number;
  number_of_installments?: number;
  currency?: 'EUR' | 'USD' | 'BRL';
  billing_zone?: 'Spain' | 'Global' | 'Brazil';
  comments?: string;
  completed: boolean;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignMedium {
  id: number;
  campaign_id: number;
  medium_id: number;
  medium_name?: string;
  created_at: string;
}

export interface CampaignInstallment {
  id: number;
  campaign_id: number;
  installment_number: number;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  paid_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignAction {
  id: number;
  campaign_id: number;
  medium_id: number;
  medium_name?: string;
  channel_id: number;
  channel_name?: string;
  action_id: number;
  action_name?: string;
  quantity: number;
  start_date?: string;
  end_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignWithActions extends Campaign {
  actions: CampaignAction[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role_id: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
