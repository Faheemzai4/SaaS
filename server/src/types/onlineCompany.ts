export type OnlineBusinessModel =
  | "ecommerce"
  | "saas"
  | "agency"
  | "marketplace"
  | "other";

export type EcommercePlatform = "shopify" | "woocommerce" | "any";

export interface OnlineDiscoverInput {
  keywords: string;
  businessModel?: OnlineBusinessModel;
  industry?: string;
  country?: string;
  countryCode?: string;
  platform?: EcommercePlatform;
  page?: number;
  limit?: number;
  forceRefresh?: boolean;
}

export interface OnlineCompanySearchResult {
  name: string;
  websiteUrl: string;
  title: string;
  description: string;
  sourceUrl: string;

  businessModel?: OnlineBusinessModel;
}

export interface OnlineCompanyCandidate {
  index: number;
  name: string;
  websiteUrl: string;
  title: string;
  description: string;
  sourceUrl: string;
}

export interface OnlineCompanyClassification {
  index: number;
  isOnlineBusiness: boolean;
  businessModel:
    | "ecommerce"
    | "saas"
    | "agency"
    | "marketplace"
    | "other"
    | "unknown";
  confidence: number;
  reason: string;
}

export interface OnlineCompanyClassificationResponse {
  results: OnlineCompanyClassification[];
}
