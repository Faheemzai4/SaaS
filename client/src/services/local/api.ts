import { apiClient, getApiErrorMessage } from "../apiClient";

import type { DiscoverInput, Lead } from "../../types/lead";

import type { LeadStatus } from "../../constants/leadStatuses";

interface LocalBulkStatusResponse {
  message: string;
  updatedCount: number;
  leads: Lead[];
}

export interface LocalBulkRetryResult {
  id: string;
  success: boolean;
  lead: Lead | null;
  error?: string;
}

export interface LocalBulkRetryResponse {
  message: string;
  total: number;
  successful: number;
  failed: number;
  results: LocalBulkRetryResult[];
}

interface LocalBulkDeleteResponse {
  message: string;
  deletedCount: number;
  deletedIds: string[];
}

type GetLeadsParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  businessType?: string;
  date?: string;
};

export async function discoverLeads(input: DiscoverInput) {
  try {
    const response = await apiClient.post("/discover", input);

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Discovery failed."));
  }
}

export async function getLeads(params: GetLeadsParams = {}) {
  try {
    const response = await apiClient.get("/leads", {
      params: {
        page: params.page || undefined,
        limit: params.limit || undefined,
        search: params.search || undefined,
        status: params.status || undefined,
        priority: params.priority || undefined,
        businessType: params.businessType || undefined,
        date: params.date || undefined,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load leads."));
  }
}

export async function updateLeadStatus(
  id: string,
  status: string,
): Promise<Lead> {
  try {
    const response = await apiClient.patch<Lead>(`/leads/${id}/status`, {
      status,
    });

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update lead status."));
  }
}

export async function bulkUpdateLocalLeadStatus(
  ids: string[],
  status: LeadStatus,
): Promise<Lead[]> {
  try {
    const response = await apiClient.patch<LocalBulkStatusResponse>(
      "/leads/bulk/status",
      {
        ids,
        status,
      },
    );

    return response.data.leads;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update selected leads."),
    );
  }
}

export async function retryLeadAnalysis(id: string): Promise<Lead> {
  try {
    const response = await apiClient.post<Lead>(`/leads/${id}/retry`);

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to retry analysis."));
  }
}

export async function bulkRetryLocalLeads(
  ids: string[],
): Promise<LocalBulkRetryResponse> {
  try {
    const response = await apiClient.post<LocalBulkRetryResponse>(
      "/leads/bulk/retry",
      {
        ids,
      },
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to retry selected leads."),
    );
  }
}

export async function deleteLead(id: string) {
  try {
    const response = await apiClient.delete(`/leads/${id}`);

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to delete lead."));
  }
}

export async function bulkDeleteLocalLeads(ids: string[]): Promise<string[]> {
  try {
    const response = await apiClient.delete<LocalBulkDeleteResponse>(
      "/leads/bulk",
      {
        data: {
          ids,
        },
      },
    );

    return response.data.deletedIds;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to delete selected leads."),
    );
  }
}
