import { create } from 'zustand';
import { Company, Contact, Medium, Channel, Action, Campaign } from '@/types';

interface DataState {
  companies: Company[];
  contacts: Contact[];
  mediums: Medium[];
  channels: Channel[];
  actions: Action[];
  campaigns: Campaign[];
  setCompanies: (companies: Company[]) => void;
  setContacts: (contacts: Contact[]) => void;
  setMediums: (mediums: Medium[]) => void;
  setChannels: (channels: Channel[]) => void;
  setActions: (actions: Action[]) => void;
  setCampaigns: (campaigns: Campaign[]) => void;
}

export const useDataStore = create<DataState>((set) => ({
  companies: [],
  contacts: [],
  mediums: [],
  channels: [],
  actions: [],
  campaigns: [],
  setCompanies: (companies) => set({ companies }),
  setContacts: (contacts) => set({ contacts }),
  setMediums: (mediums) => set({ mediums }),
  setChannels: (channels) => set({ channels }),
  setActions: (actions) => set({ actions }),
  setCampaigns: (campaigns) => set({ campaigns }),
}));
