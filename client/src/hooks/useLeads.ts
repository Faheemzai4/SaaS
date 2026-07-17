import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  bulkDeleteLocalLeads,
  bulkRetryLocalLeads,
  bulkUpdateLocalLeadStatus,
  deleteLead,
  getLeads,
} from "../services/local/api";

import type { Lead } from "../types/lead";
import type { LeadStatus } from "../constants/leadStatuses";

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [date, setDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] =
    useState(10);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] =
    useState("");
  const [statusFilter, setStatusFilter] =
    useState("");

  const fetchLeads = useCallback(
    async (selectedDate = date) => {
      try {
        setLoading(true);
        setError("");

        const data = await getLeads({
          page: page + 1,
          limit: rowsPerPage,
          search,
          priority: priorityFilter,
          status: statusFilter,
          date: selectedDate,
        });

        setLeads(data.leads);
        setTotal(data.total);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load leads",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      date,
      page,
      rowsPerPage,
      search,
      priorityFilter,
      statusFilter,
    ],
  );

  const removeLead = async (
    id: string,
  ): Promise<boolean> => {
    try {
      setError("");

      await deleteLead(id);
      await fetchLeads();

      return true;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete lead",
      );

      return false;
    }
  };

  const bulkUpdateStatus = async (
    ids: string[],
    status: LeadStatus,
  ): Promise<boolean> => {
    if (ids.length === 0) {
      return false;
    }

    try {
      setBulkActionLoading(true);
      setError("");

      const updatedLeads =
        await bulkUpdateLocalLeadStatus(
          ids,
          status,
        );

      const updatedLeadMap = new Map(
        updatedLeads.map((lead) => [
          lead.id,
          lead,
        ]),
      );

      setLeads((currentLeads) =>
        currentLeads.map(
          (lead) =>
            updatedLeadMap.get(lead.id) || lead,
        ),
      );

      return true;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update selected leads",
      );

      return false;
    } finally {
      setBulkActionLoading(false);
    }
  };

  const bulkRetry = async (
    ids: string[],
  ): Promise<boolean> => {
    if (ids.length === 0) {
      return false;
    }

    try {
      setBulkActionLoading(true);
      setError("");

      await bulkRetryLocalLeads(ids);
      await fetchLeads();

      return true;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to retry selected leads",
      );

      return false;
    } finally {
      setBulkActionLoading(false);
    }
  };

  const bulkRemove = async (
    ids: string[],
  ): Promise<boolean> => {
    if (ids.length === 0) {
      return false;
    }

    try {
      setBulkActionLoading(true);
      setError("");

      await bulkDeleteLocalLeads(ids);
      await fetchLeads();

      return true;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete selected leads",
      );

      return false;
    } finally {
      setBulkActionLoading(false);
    }
  };

  const updateLeadInState = (
    updatedLead: Lead,
  ) => {
    setLeads((currentLeads) =>
      currentLeads.map((lead) =>
        lead.id === updatedLead.id
          ? updatedLead
          : lead,
      ),
    );
  };

  const clearDateFilter = async () => {
    setDate("");
    await fetchLeads("");
  };

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  return {
    total,
    page,
    setPage,

    rowsPerPage,
    setRowsPerPage,

    search,
    setSearch,

    priorityFilter,
    setPriorityFilter,

    statusFilter,
    setStatusFilter,

    leads,
    date,
    setDate,

    loading,
    bulkActionLoading,
    error,

    fetchLeads,
    removeLead,
    updateLeadInState,
    clearDateFilter,

    bulkUpdateStatus,
    bulkRetry,
    bulkRemove,
  };
}