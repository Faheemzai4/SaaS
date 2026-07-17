import { apiClient, getApiErrorMessage } from "../apiClient";

import type {
  OnlineDiscoverInput,
  OnlineDiscoverResponse,
  OnlineLead,
  OnlineLeadFilters,
  OnlineLeadsResponse,
  OnlineLeadStatus,
} from "../../types/onlineLead";

import type { OnlineStats } from "../../types/onlineStats";

interface OnlineBulkStatusResponse {
  message: string;
  updatedCount: number;
  leads: OnlineLead[];
}

export interface OnlineBulkRetryResult {
  id: string;
  success: boolean;
  lead: OnlineLead | null;
  error?: string;
}

interface OnlineBulkRetryResponse {
  message: string;
  total: number;
  successful: number;
  failed: number;
  results: OnlineBulkRetryResult[];
}

interface OnlineBulkDeleteResponse {
  message: string;
  deletedCount: number;
  deletedIds: string[];
}

export async function bulkUpdateOnlineLeadStatus(
  ids: string[],
  status: OnlineLeadStatus,
): Promise<OnlineLead[]> {
  try {
    const response = await apiClient.patch<OnlineBulkStatusResponse>(
      "/online/leads/bulk/status",
      {
        ids,
        status,
      },
    );

    return response.data.leads;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update selected online leads."),
    );
  }
}

export async function bulkRetryOnlineLeads(
  ids: string[],
): Promise<OnlineBulkRetryResponse> {
  try {
    const response = await apiClient.post<OnlineBulkRetryResponse>(
      "/online/leads/bulk/retry",
      {
        ids,
      },
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to retry selected online leads."),
    );
  }
}

export async function bulkDeleteOnlineLeads(ids: string[]): Promise<string[]> {
  try {
    const response = await apiClient.delete<OnlineBulkDeleteResponse>(
      "/online/leads/bulk",
      {
        data: {
          ids,
        },
      },
    );

    return response.data.deletedIds;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to delete selected online leads."),
    );
  }
}

export async function getOnlineStats(): Promise<OnlineStats> {
  try {
    const response = await apiClient.get<OnlineStats>("/online/stats");

    return response.data;
  } catch (error) {
    console.error("Failed to fetch online statistics:", error);

    throw new Error(
      getApiErrorMessage(error, "Failed to fetch online statistics."),
    );
  }
}

export async function discoverOnlineCompanies(
  input: OnlineDiscoverInput,
): Promise<OnlineDiscoverResponse> {
  try {
    const response = await apiClient.post<OnlineDiscoverResponse>(
      "/online/discover",
      {
        ...input,
        page: input.page || 1,
        limit: input.limit || 5,
      },
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to discover online companies."),
    );
  }
}

export async function getOnlineLeads(
  filters: OnlineLeadFilters = {},
): Promise<OnlineLeadsResponse> {
  try {
    const response = await apiClient.get<OnlineLeadsResponse>("/online/leads", {
      params: {
        page: filters.page || 1,
        limit: filters.limit || 10,

        search: filters.search || undefined,

        businessModel: filters.businessModel || undefined,

        industry: filters.industry || undefined,

        country: filters.country || undefined,

        priority: filters.priority || undefined,

        status: filters.status || undefined,

        analysisStatus: filters.analysisStatus || undefined,

        date: filters.date || undefined,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load online leads."));
  }
}

export async function getOnlineLead(id: string): Promise<OnlineLead> {
  try {
    const response = await apiClient.get<{
      lead: OnlineLead;
    }>(`/online/leads/${id}`);

    return response.data.lead;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to load the online lead."),
    );
  }
}

export async function updateOnlineLeadStatus(
  id: string,
  status: OnlineLeadStatus,
): Promise<OnlineLead> {
  try {
    const response = await apiClient.patch<{
      message: string;
      lead: OnlineLead;
    }>(`/online/leads/${id}/status`, {
      status,
    });

    return response.data.lead;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update online lead status."),
    );
  }
}

export async function retryOnlineLead(id: string): Promise<OnlineLead | null> {
  try {
    const response = await apiClient.post<{
      message: string;
      success: boolean;
      lead: OnlineLead | null;
    }>(`/online/leads/${id}/retry`);

    return response.data.lead;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to retry online lead analysis."),
    );
  }
}

export async function deleteOnlineLead(id: string): Promise<void> {
  try {
    await apiClient.delete(`/online/leads/${id}`);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to delete online lead."));
  }
}
