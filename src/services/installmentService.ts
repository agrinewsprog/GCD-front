import axios from "@/lib/axios";
import { CampaignInstallment } from "@/types";

export const installmentService = {
  // Get installments for a campaign
  getInstallmentsByCampaign: async (campaignId: number): Promise<CampaignInstallment[]> => {
    const response = await axios.get(`/installments/campaign/${campaignId}`);
    return response.data;
  },

  // Create installment
  createInstallment: async (campaignId: number, data: Partial<CampaignInstallment>): Promise<CampaignInstallment> => {
    const response = await axios.post(`/installments/campaign/${campaignId}`, data);
    return response.data;
  },

  // Update installment
  updateInstallment: async (id: number, data: Partial<CampaignInstallment>): Promise<CampaignInstallment> => {
    const response = await axios.put(`/installments/${id}`, data);
    return response.data;
  },

  // Delete installment
  deleteInstallment: async (id: number): Promise<void> => {
    await axios.delete(`/installments/${id}`);
  },

  // Auto-generate installments
  generateInstallments: async (campaignId: number): Promise<CampaignInstallment[]> => {
    const response = await axios.post(`/installments/campaign/${campaignId}/generate`);
    return response.data;
  }
};
