import { useState, useEffect } from "react";
import DiscoverForm from "./DiscoverForm";

import LeadList from "./LeadList";
import BulkActionBar from "../common/BulkActionBar";

import { LEAD_STATUSES } from "../../constants/leadStatuses";

import { useLeadSelection } from "../../hooks/common/useLeadSelection";
import { useDiscover } from "../../hooks/local/useDiscover";
import { useLeads } from "../../hooks/useLeads";

import type { LeadStatus } from "../../constants/leadStatuses";

interface LocalBusinessesDashboardProps {
  onSelectionChange?: (selectedIds: string[]) => void;
}

export default function LocalBusinessesDashboard({
  onSelectionChange,
}: LocalBusinessesDashboardProps) {
  const [limit, setLimit] = useState(5);

  const {
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
    bulkUpdateStatus,
    bulkRetry,
    bulkRemove,
  } = useLeads();

  const {
    selectedIds,
    selectedCount,
    toggleLead,
    toggleAll,
    clearSelection,
    areAllSelected,
  } = useLeadSelection();

  useEffect(() => {
    onSelectionChange?.(selectedIds);
  }, [selectedIds, onSelectionChange]);

  const {
    discover,
    loading: discoverLoading,
    message: discoverMessage,
  } = useDiscover(async () => {
    await fetchLeads();
    clearSelection();
  });

  const visibleLeadIds = leads.map((lead) => lead.id);

  const allVisibleSelected = areAllSelected(visibleLeadIds);

  async function handleBulkStatus(status: LeadStatus) {
    const success = await bulkUpdateStatus(selectedIds, status);

    if (success) {
      clearSelection();
    }
  }

  async function handleBulkRetry() {
    const success = await bulkRetry(selectedIds);

    if (success) {
      clearSelection();
    }
  }

  async function handleBulkDelete() {
    const confirmed = window.confirm(
      `Delete ${selectedCount} selected local lead${
        selectedCount === 1 ? "" : "s"
      }?`,
    );

    if (!confirmed) {
      return;
    }

    const success = await bulkRemove(selectedIds);

    if (success) {
      clearSelection();
    }
  }

  return (
    <div className="space-y-6">
      <DiscoverForm
        onDiscover={(input) =>
          discover({
            ...input,
            limit,
          })
        }
        loading={discoverLoading}
        message={discoverMessage}
        limit={limit}
        setLimit={setLimit}
      />

      <BulkActionBar
        selectedCount={selectedCount}
        statuses={LEAD_STATUSES}
        loading={bulkActionLoading}
        onStatusChange={handleBulkStatus}
        onRetry={handleBulkRetry}
        onDelete={handleBulkDelete}
        onClear={clearSelection}
      />

      <LeadList
        leads={leads}
        total={total}
        page={page}
        setPage={(newPage) => {
          clearSelection();
          setPage(newPage);
        }}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={(value) => {
          clearSelection();
          setRowsPerPage(value);
        }}
        search={search}
        setSearch={(value) => {
          clearSelection();
          setSearch(value);
        }}
        priorityFilter={priorityFilter}
        setPriorityFilter={(value) => {
          clearSelection();
          setPriorityFilter(value);
        }}
        statusFilter={statusFilter}
        setStatusFilter={(value) => {
          clearSelection();
          setStatusFilter(value);
        }}
        loading={loading}
        error={error}
        onDelete={removeLead}
        onLeadUpdated={updateLeadInState}
        date={date}
        setDate={setDate}
        onClear={() => {
          clearSelection();
          void clearDateFilter();
        }}
        selectedIds={selectedIds}
        allVisibleSelected={allVisibleSelected}
        onToggleSelect={toggleLead}
        onToggleAll={() => toggleAll(visibleLeadIds)}
      />
    </div>
  );
}
