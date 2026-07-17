export interface Lead {
  id: string;

  title?: string;
  url: string;
  description?: string;

  businessType?: string;
  city?: string;
  state?: string;
  countryCode?: string;

  score?: number;
  priority?: "High" | "Medium" | "Low";

  summary?: string;
  businessOpportunity?: string;
  estimatedImpact?: string;

  issues?: string[];

  emails?: string[];
  phones?: string[];

  socialLinks?: {
    facebook: string[];
    instagram: string[];
    linkedin: string[];
    x: string[];
    whatsapp?: string[];
  };

  status?: string;

  emailSubject?: string;
  emailBody?: string;

  createdAt: string;
  updatedAt: string;
}

export interface DiscoverInput {
  businessType: string;
  city: string;
  state?: string;
  countryCode: string;
  limit?: number;
}
