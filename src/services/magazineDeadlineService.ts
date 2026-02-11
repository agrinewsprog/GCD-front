import axios from "@/lib/axios";

export interface DeadlineConfirmation {
  id: number;
  campaign_action_id: number;
  deadline_type: 'client' | 'send_to_edition' | 'edition' | 'changes' | 'book_assembly';
  confirmed_by: number;
  confirmed_by_name: string;
  confirmed_by_email: string;
  confirmed_at: string;
  link: string | null;
  reverted: boolean;
  reverted_at: string | null;
  reverted_by: number | null;
  reverted_by_name: string | null;
}

export const magazineDeadlineService = {
  // Get confirmations for a campaign action
  getConfirmations: async (campaignActionId: number): Promise<DeadlineConfirmation[]> => {
    const response = await axios.get(`/magazine-deadlines/campaign-action/${campaignActionId}`);
    return response.data;
  },

  // Confirm a deadline
  confirmDeadline: async (
    campaignActionId: number,
    deadlineType: string,
    link?: string
  ): Promise<DeadlineConfirmation[]> => {
    const response = await axios.post(
      `/magazine-deadlines/campaign-action/${campaignActionId}/confirm`,
      { deadline_type: deadlineType, link }
    );
    return response.data;
  },

  // Revert a confirmation
  revertConfirmation: async (confirmationId: number): Promise<void> => {
    await axios.post(`/magazine-deadlines/confirmations/${confirmationId}/revert`);
  },
};
