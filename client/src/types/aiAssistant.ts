export type AiAssistantModule = "local" | "online";

export type AiLeadAction =
  | "find_leads"
  | "count_leads"
  | "delete_leads"
  | "update_status"
  | "retry_leads"
  | "discover_local"
  | "discover_online";

export interface AiActionFilters {
  module: AiAssistantModule;
  status?: string;
  priority?: string;
  analysisStatus?: string;
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasWebsite?: boolean;
}

export interface AiActionPreviewLead {
  id: string;
  name: string;
  website: string | null;
  status: string | null;
  priority: string | null;
  emailCount: number;
  phoneCount: number;
}

export interface AiActionPreviewResponse {
  actionId?: string;
  action: AiLeadAction;
  filters: AiActionFilters;
  newStatus?: string;
  matchedCount: number;
  requiresConfirmation: boolean;
  preview?: AiActionPreviewLead[];
  explanation: string;
  localDiscovery?: AiLocalDiscoveryInput;
  onlineDiscovery?: AiOnlineDiscoveryInput;

  estimatedAnalyses?: number;
}

export interface AiActionExecuteResponse {
  action: AiLeadAction;
  module: AiAssistantModule;
  affectedCount: number;
  successful?: number;
  failed?: number;
  message: string;
}

export interface AiChatConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiChatResponse {
  answer: string;
}

export type AiAssistantMessage =
  | {
      id: string;
      type: "user";
      content: string;
    }
  | {
      id: string;
      type: "assistant";
      content: string;
    }
  | {
      id: string;
      type: "action";
      instruction: string;
      preview: AiActionPreviewResponse;
      execution?: AiActionExecuteResponse;
    }
  | {
      id: string;
      type: "error";
      content: string;
    };

export interface AiLocalDiscoveryInput {
  businessType: string;
  city: string;
  state?: string;
  countryCode: string;
  limit: number;
  forceRefresh?: boolean;
}

export interface AiOnlineDiscoveryInput {
  keywords: string;

  businessModel?: "ecommerce" | "saas" | "agency" | "marketplace" | "other";

  industry?: string;
  country?: string;
  countryCode?: string;

  platform?: "shopify" | "woocommerce" | "any";

  limit: number;
  forceRefresh?: boolean;
}
