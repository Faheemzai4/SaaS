export type OnlineBusinessModel =
  "ecommerce" | "saas" | "agency" | "marketplace" | "other";

export type EcommercePlatform = "shopify" | "woocommerce" | "any";

export type OnlineLeadPriority = "High" | "Medium" | "Low";

export type OnlineLeadStatus =
  | "Processing"
  | "Not Contacted"
  | "Email Sent"
  | "Interested"
  | "Meeting Booked"
  | "Closed"
  | "Needs Manual Review";

export type OnlineAnalysisStatus =
  "Pending" | "Processing" | "Completed" | "Failed" | "No Website";

export interface OnlineDiscoverInput {
  keywords: string;
  businessModel?: OnlineBusinessModel;
  industry?: string;
  country?: string;
  countryCode?: string;
  platform?: EcommercePlatform;
  page?: number;
  limit?: number;
}

export interface OnlineSocialLinks {
  facebook: string[];
  instagram: string[];
  linkedin: string[];
  x: string[];
  whatsapp: string[];
}

export interface OnlineLead {
  id: string;

  name: string;
  website_url: string;
  primary_domain: string;
  source_url: string | null;

  business_model: OnlineBusinessModel;
  industry: string | null;
  country: string | null;

  page_title: string | null;
  description: string | null;

  score: number | null;
  priority: OnlineLeadPriority | null;

  summary: string | null;
  business_opportunity: string | null;
  estimated_impact: string | null;

  issues: string[];
  emails: string[];
  phones: string[];
  social_links: OnlineSocialLinks;

  status: OnlineLeadStatus;

  email_subject: string | null;
  email_body: string | null;

  analysis_status: OnlineAnalysisStatus;
  analysis_error: string | null;

  created_at: string;
  updated_at: string;
}

export interface OnlineDiscoverResult {
  companyName: string;
  website: string;
  success: boolean;
  lead: OnlineLead | null;
  error?: string;
}

export interface OnlineDiscoverResponse {
  filters: {
    keywords: string;
    businessModel: OnlineBusinessModel | null;
    industry: string | null;
    country: string | null;
    platform: EcommercePlatform;
  };

  page: number;
  limit: number;

  discovered: number;
  successful: number;
  failed: number;

  results: OnlineDiscoverResult[];
}

export interface OnlineLeadsResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  leads: OnlineLead[];
}

export interface OnlineLeadFilters {
  page?: number;
  limit?: number;
  search?: string;
  businessModel?: OnlineBusinessModel | "";
  industry?: string;
  country?: string;
  priority?: OnlineLeadPriority | "";
  status?: OnlineLeadStatus | "";
  analysisStatus?: OnlineAnalysisStatus | "";
  date?: string;
}
