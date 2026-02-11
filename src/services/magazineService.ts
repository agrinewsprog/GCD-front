import axios from "@/lib/axios";

export interface MagazineEdition {
  id: number;
  medium_id: number;
  medium_name: string;
  publication_date: string;
  status: 'draft' | 'active' | 'published';
  publication_link?: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface EditionCampaign {
  campaign_action_id: number;
  action_type_id: number;
  action_name: string;
  magazine_content_type?: 'technical' | 'ad' | null;
  campaign_id: number;
  campaign_name: string;
  company_id: number;
  company_name: string;
  user_id: number;
  user_name: string;
  user_email: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

export interface EditionWithCampaigns {
  edition: MagazineEdition;
  technical_articles: EditionCampaign[];
  ads: EditionCampaign[];
  all_campaigns: EditionCampaign[];
}

// Helper to calculate first Monday of a month
export const calculateFirstMonday = (year: number, month: number): string => {
  const firstDay = new Date(year, month - 1, 1);
  const dayOfWeek = firstDay.getDay();
  const daysToAdd = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  const firstMonday = new Date(year, month - 1, 1 + daysToAdd);
  
  const yearStr = firstMonday.getFullYear();
  const monthStr = String(firstMonday.getMonth() + 1).padStart(2, '0');
  const dayStr = String(firstMonday.getDate()).padStart(2, '0');
  
  return `${yearStr}-${monthStr}-${dayStr}`;
};

// Helper to calculate days until a date
export const daysUntil = (targetDate: string): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Helper to calculate deadline dates for magazine content
export const calculateDeadlines = (publicationDate: string) => {
  const pubDate = new Date(publicationDate);
  
  const addDays = (days: number) => {
    const date = new Date(pubDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };
  
  return {
    // Technical content deadlines
    technical: {
      clientInitialDeadline: addDays(-35),
      sendToEditionDeadline: addDays(-31),
      editionStart: addDays(-28),
      editionEnd: addDays(-24),
      clientChangesDeadline: addDays(-10), // Friday
      allChangesSent: addDays(-21),
      bookAssemblyStart: addDays(-7),
      bookAssemblyEnd: addDays(-3),
      publication: publicationDate
    },
    // Ads deadlines: same book assembly and publication as technical, but different client deadline
    ads: {
      clientDeadline: addDays(-14), // 14 days before publication
      bookAssemblyStart: addDays(-7),
      bookAssemblyEnd: addDays(-3),
      publication: publicationDate
    }
  };
};

// Get next active deadline for a campaign
export const getNextDeadline = (publicationDate: string, contentType: 'technical' | 'ad'): { name: string; date: string; daysRemaining: number } => {
  const deadlines = calculateDeadlines(publicationDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  if (contentType === 'technical') {
    const techDeadlines = [
      { name: 'Deadline cliente inicial', date: deadlines.technical.clientInitialDeadline },
      { name: 'Envío a edición', date: deadlines.technical.sendToEditionDeadline },
      { name: 'Edición completa', date: deadlines.technical.editionEnd },
      { name: 'Cambios cliente', date: deadlines.technical.clientChangesDeadline },
      { name: 'Cambios enviados', date: deadlines.technical.allChangesSent },
      { name: 'Montaje libro', date: deadlines.technical.bookAssemblyEnd },
      { name: 'Publicación', date: deadlines.technical.publication }
    ];
    
    for (const deadline of techDeadlines) {
      const deadlineDate = new Date(deadline.date);
      deadlineDate.setHours(0, 0, 0, 0);
      if (deadlineDate >= now) {
        return {
          name: deadline.name,
          date: deadline.date,
          daysRemaining: daysUntil(deadline.date)
        };
      }
    }
    
    return { name: 'Publicado', date: publicationDate, daysRemaining: 0 };
  } else {
    const adDeadlines = [
      { name: 'Deadline cliente', date: deadlines.ads.clientDeadline },
      { name: 'Montaje libro', date: deadlines.ads.bookAssemblyEnd },
      { name: 'Publicación', date: deadlines.ads.publication }
    ];
    
    for (const deadline of adDeadlines) {
      const deadlineDate = new Date(deadline.date);
      deadlineDate.setHours(0, 0, 0, 0);
      if (deadlineDate >= now) {
        return {
          name: deadline.name,
          date: deadline.date,
          daysRemaining: daysUntil(deadline.date)
        };
      }
    }
    
    return { name: 'Publicado', date: publicationDate, daysRemaining: 0 };
  }
};

export const magazineService = {
  // Get all editions
  getAll: async (): Promise<MagazineEdition[]> => {
    const response = await axios.get("/magazines");
    return response.data;
  },

  // Get editions by medium
  getByMedium: async (mediumId: number): Promise<MagazineEdition[]> => {
    const response = await axios.get(`/magazines/medium/${mediumId}`);
    return response.data;
  },

  // Get single edition
  getById: async (id: number): Promise<MagazineEdition> => {
    const response = await axios.get(`/magazines/${id}`);
    return response.data;
  },

  // Get edition with campaigns
  getWithCampaigns: async (id: number): Promise<EditionWithCampaigns> => {
    const response = await axios.get(`/magazines/${id}/campaigns`);
    return response.data;
  },

  // Create new edition
  create: async (data: {
    medium_id: number;
    year?: number;
    month?: number;
    publication_date?: string;
  }): Promise<{ message: string; id: number; publication_date: string }> => {
    const response = await axios.post("/magazines", data);
    return response.data;
  },

  // Update edition
  update: async (id: number, data: {
    publication_date?: string;
    status?: 'draft' | 'active' | 'published';
  }): Promise<{ message: string }> => {
    const response = await axios.put(`/magazines/${id}`, data);
    return response.data;
  },

  // Delete edition
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await axios.delete(`/magazines/${id}`);
    return response.data;
  },

  // Complete edition (mark as finished with publication link)
  complete: async (id: number, publication_link: string): Promise<{ message: string; publication_link: string }> => {
    const response = await axios.put(`/magazines/${id}/complete`, { publication_link });
    return response.data;
  }
};
