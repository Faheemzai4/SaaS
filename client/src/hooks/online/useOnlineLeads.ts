import { useCallback, useEffect, useMemo, useState } from "react";

import {
  bulkDeleteOnlineLeads,
  bulkRetryOnlineLeads,
  bulkUpdateOnlineLeadStatus,
  deleteOnlineLead,
  getOnlineLeads,
  retryOnlineLead,
  updateOnlineLeadStatus,
} from "../../services/online/onlineApi";

import type {
  OnlineLead,
  OnlineLeadFilters,
  OnlineLeadStatus,
} from "../../types/onlineLead";

const initialFilters: OnlineLeadFilters = {
  page: 1,
  limit: 10,
  businessModel: "",
  priority: "",
  status: "",
  analysisStatus: "",
  date: "",
};

function useDebouncedValue<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, delay]);

  return debouncedValue;
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to load online leads.";
}

export function useOnlineLeads() {
  const [leads, setLeads] = useState<OnlineLead[]>([]);

  const [searchInput, setSearchInput] = useState("");

  const [activeSearch, setActiveSearch] = useState("");

  const debouncedSearch = useDebouncedValue(searchInput, 250);

  const [filters, setFilters] = useState<OnlineLeadFilters>(initialFilters);

  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [retryingId, setRetryingId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);

  /*
   * Only commit search to the API after the
   * user stops typing for 500ms.
   */
  useEffect(() => {
    setActiveSearch(debouncedSearch.trim());

    setFilters((current) => {
      if (current.page === 1) {
        return current;
      }

      return {
        ...current,
        page: 1,
      };
    });
  }, [debouncedSearch]);

  const requestFilters = useMemo<OnlineLeadFilters>(
    () => ({
      ...filters,
      search: activeSearch || undefined,
    }),
    [filters, activeSearch],
  );

  const displayFilters = useMemo<OnlineLeadFilters>(
    () => ({
      ...filters,
      search: searchInput,
    }),
    [filters, searchInput],
  );

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getOnlineLeads(requestFilters);

      setLeads(response.leads);
      setTotal(response.total);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [requestFilters]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  function updateFilters(changes: Partial<OnlineLeadFilters>) {
    if (changes.search !== undefined) {
      setSearchInput(changes.search || "");
      return;
    }

    setFilters((current) => ({
      ...current,
      ...changes,
      page: changes.page !== undefined ? changes.page : 1,
    }));
  }

  async function updateStatus(id: string, status: OnlineLeadStatus) {
    setUpdatingStatusId(id);
    setError(null);

    try {
      const updatedLead = await updateOnlineLeadStatus(id, status);

      setLeads((current) =>
        current.map((lead) => (lead.id === id ? updatedLead : lead)),
      );
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setUpdatingStatusId(null);
    }
  }

  async function bulkUpdateStatus(
    ids: string[],
    status: OnlineLeadStatus,
  ): Promise<boolean> {
    if (ids.length === 0) {
      return false;
    }

    setBulkActionLoading(true);
    setError(null);

    try {
      const updatedLeads = await bulkUpdateOnlineLeadStatus(ids, status);

      const updatedLeadMap = new Map(
        updatedLeads.map((lead) => [lead.id, lead]),
      );

      setLeads((current) =>
        current.map((lead) => updatedLeadMap.get(lead.id) || lead),
      );

      return true;
    } catch (error) {
      setError(getErrorMessage(error));
      return false;
    } finally {
      setBulkActionLoading(false);
    }
  }
  async function bulkRetry(ids: string[]): Promise<boolean> {
    if (ids.length === 0) {
      return false;
    }

    setBulkActionLoading(true);
    setError(null);

    try {
      await bulkRetryOnlineLeads(ids);

      // Reload because retries can change many fields:
      // score, priority, contacts, analysis status and email.
      await loadLeads();

      return true;
    } catch (error) {
      setError(getErrorMessage(error));
      return false;
    } finally {
      setBulkActionLoading(false);
    }
  }
  async function retry(id: string) {
    setRetryingId(id);
    setError(null);

    try {
      const updatedLead = await retryOnlineLead(id);

      if (updatedLead) {
        setLeads((current) =>
          current.map((lead) => (lead.id === id ? updatedLead : lead)),
        );
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setRetryingId(null);
    }
  }

  async function bulkRemove(ids: string[]): Promise<boolean> {
    if (ids.length === 0) {
      return false;
    }

    setBulkActionLoading(true);
    setError(null);

    try {
      await bulkDeleteOnlineLeads(ids);
      await loadLeads();

      return true;
    } catch (error) {
      setError(getErrorMessage(error));
      return false;
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function remove(id: string) {
    setDeletingId(id);
    setError(null);

    try {
      await deleteOnlineLead(id);
      await loadLeads();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  function clearFilters() {
    setSearchInput("");
    setActiveSearch("");
    setFilters(initialFilters);
  }

  return {
    leads,
    filters: displayFilters,

    total,
    loading,
    initialLoading,
    error,

    retryingId,
    deletingId,
    updatingStatusId,
    bulkActionLoading,

    updateFilters,
    clearFilters,
    loadLeads,
    updateStatus,
    retry,
    remove,

    bulkUpdateStatus,
    bulkRetry,
    bulkRemove,
  };
}
