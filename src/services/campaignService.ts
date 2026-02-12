import axios from "@/lib/axios";
import { Campaign, CampaignWithActions } from "@/types";

export const campaignService = {
  getAll: async (): Promise<Campaign[]> => {
    const response = await axios.get("/campaigns");
    return response.data;
  },

  getById: async (id: number): Promise<CampaignWithActions> => {
    const response = await axios.get(`/campaigns/${id}`);
    return response.data;
  },

  create: async (data: Partial<Campaign>): Promise<void> => {
    await axios.post("/campaigns", data);
  },

  update: async (id: number, data: Partial<Campaign>): Promise<void> => {
    await axios.put(`/campaigns/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`/campaigns/${id}`);
  },

  assignActions: async (
    id: number, 
    actions: Array<{ 
      medium_id: number; 
      channel_id: number; 
      action_id: number;
      quantity?: number;
      start_date?: string; 
      end_date?: string;
      newsletter_schedule_id?: number;
      magazine_edition_id?: number;
    }>
  ): Promise<void> => {
    await axios.post(`/campaigns/${id}/actions`, { actions });
  },

  updateActionStatus: async (
    actionId: number,
    status: string,
    notes?: string
  ): Promise<void> => {
    await axios.patch(`/campaigns/actions/${actionId}`, { status, notes });
  },

  moveActionToEdition: async (
    actionId: number,
    targetEditionId: number
  ): Promise<void> => {
    await axios.put(`/campaigns/actions/${actionId}/move`, { 
      target_edition_id: targetEditionId 
    });
  },
};
