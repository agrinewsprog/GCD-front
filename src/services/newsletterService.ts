import axios from 'axios';

const API_URL = 'http://localhost:3000/api/newsletters';

export interface NewsletterType {
  id: number;
  medium_id: number;
  medium_name?: string;
  region: string;
  name: string;
  day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  week_of_month: '1' | '2' | '3' | '4' | '5';
  frequency: 'monthly' | 'bimonthly' | 'quarterly';
  frequency_offset: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSchedule {
  id: number;
  newsletter_type_id: number;
  newsletter_name?: string;
  medium_name?: string;
  region?: string;
  scheduled_date: string; // YYYY-MM-DD
  year: number;
  month: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

const getAuthHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

export const newsletterService = {
  // Get newsletter types with optional filters
  getTypes: async (mediumId?: number, region?: string): Promise<NewsletterType[]> => {
    const params = new URLSearchParams();
    if (mediumId) params.append('medium_id', mediumId.toString());
    if (region) params.append('region', region);
    
    const response = await axios.get(
      `${API_URL}/types?${params.toString()}`,
      getAuthHeader()
    );
    return response.data;
  },

  // Get available schedules for a newsletter type
  getSchedules: async (
    newsletterTypeId: number,
    availableOnly: boolean = true,
    year?: number
  ): Promise<NewsletterSchedule[]> => {
    const params = new URLSearchParams();
    params.append('newsletter_type_id', newsletterTypeId.toString());
    if (availableOnly) params.append('available_only', 'true');
    if (year) params.append('year', year.toString());
    
    const response = await axios.get(
      `${API_URL}/schedules?${params.toString()}`,
      getAuthHeader()
    );
    return response.data;
  },

  // Get regions for a medium
  getRegions: async (mediumId: number): Promise<string[]> => {
    const response = await axios.get(
      `${API_URL}/regions/${mediumId}`,
      getAuthHeader()
    );
    return response.data;
  },

  // Get schedule details by id
  getScheduleById: async (scheduleId: number): Promise<NewsletterSchedule> => {
    const response = await axios.get(
      `${API_URL}/schedules/${scheduleId}`,
      getAuthHeader()
    );
    return response.data;
  },

  // Admin methods
  getAllTypes: async (): Promise<NewsletterType[]> => {
    const response = await axios.get(
      `${API_URL}/admin/types`,
      getAuthHeader()
    );
    return response.data;
  },

  createType: async (data: Partial<NewsletterType>): Promise<void> => {
    await axios.post(`${API_URL}/admin/types`, data, getAuthHeader());
  },

  updateType: async (id: number, data: Partial<NewsletterType>): Promise<void> => {
    await axios.put(`${API_URL}/admin/types/${id}`, data, getAuthHeader());
  },

  deleteType: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/admin/types/${id}`, getAuthHeader());
  },

  toggleTypeStatus: async (id: number): Promise<void> => {
    await axios.patch(`${API_URL}/admin/types/${id}/toggle`, {}, getAuthHeader());
  },

  regenerateSchedules: async (year: number): Promise<void> => {
    await axios.post(`${API_URL}/admin/regenerate`, { year }, getAuthHeader());
  },
};
