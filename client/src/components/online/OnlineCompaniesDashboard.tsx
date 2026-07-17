import { useEffect, useState } from "react";

import OnlineDiscoverForm from "./OnlineDiscoverForm";
import OnlineLeadDetailsModal from "./OnlineLeadDetailsModal";
import OnlineLeadList from "./OnlineLeadList";

import DashboardStats from "../online/DashboardStats";

import { useOnlineDiscover } from "../../hooks/online/useOnlineDiscover";
import { useOnlineLeads } from "../../hooks/online/useOnlineLeads";
import { useOnlineStats } from "../../hooks/online/useOnlineStats";
import { exportOnlineLeadsToCsv } from "../../utils/exportLeadsToCsv";

import type { OnlineLead, OnlineLeadStatus } from "../../types/onlineLead";

import BulkActionBar from "../common/BulkActionBar";

import { LEAD_STATUSES } from "../../constants/leadStatuses";
import { useLeadSelection } from "../../hooks/common/useLeadSelection";

interface OnlineCompaniesDashboardProps {
  onSelectionChange?: (selectedIds: string[]) => void;
}

export default function OnlineCompaniesDashboard({
  onSelectionChange,
}: OnlineCompaniesDashboardProps) {
  const [selectedLead, setSelectedLead] = useState<OnlineLead | null>(null);
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
    stats,
    loading: statsLoading,
    error: statsError,
    refreshStats,
  } = useOnlineStats();

  const {
    data: discoveryData,
    loading: discoveryLoading,
    error: discoveryError,
    discover,
  } = useOnlineDiscover();

  const {
    leads,
    filters,
    total,
    loading: leadsLoading,
    initialLoading,
    error: leadsError,
    bulkActionLoading,
    updateFilters,
    loadLeads,
    updateStatus,
    retry,
    remove,
    bulkUpdateStatus,
    bulkRetry,
    bulkRemove,
  } = useOnlineLeads();

  const visibleLeadIds = leads.map((lead) => lead.id);

  const allVisibleSelected = areAllSelected(visibleLeadIds);

  async function handleBulkStatus(status: OnlineLeadStatus) {
    const success = await bulkUpdateStatus(selectedIds, status);

    if (success) {
      clearSelection();
      await refreshStats();
    }
  }

  async function handleBulkRetry() {
    const success = await bulkRetry(selectedIds);

    if (success) {
      clearSelection();
      await refreshStats();
    }
  }

  async function handleBulkDelete() {
    const confirmed = window.confirm(
      `Delete ${selectedCount} selected online lead${
        selectedCount === 1 ? "" : "s"
      }?`,
    );

    if (!confirmed) {
      return;
    }

    const success = await bulkRemove(selectedIds);

    if (success) {
      clearSelection();
      await refreshStats();
    }
  }

  async function handleDiscover(input: Parameters<typeof discover>[0]) {
    const result = await discover(input);

    if (!result) {
      return;
    }

    clearSelection();
    await loadLeads();
    await refreshStats();
  }

  async function handleStatusChange(id: string, status: OnlineLeadStatus) {
    await updateStatus(id, status);
    await refreshStats();
  }

  async function handleRetry(id: string) {
    await retry(id);
    await refreshStats();
  }

  async function handleDelete(id: string) {
    await remove(id);
    await refreshStats();

    if (selectedIds.includes(id)) {
      clearSelection();
    }

    if (selectedLead?.id === id) {
      setSelectedLead(null);
    }
  }

  function handleExportSelected() {
    const selectedLeads = leads.filter((lead) => selectedIds.includes(lead.id));

    if (selectedLeads.length === 0) {
      window.alert("Select at least one visible online lead to export.");

      return;
    }

    exportOnlineLeadsToCsv(selectedLeads, "online-leads-selected.csv");
  }

  return (
    <div className="space-y-6">
      <DashboardStats
        stats={stats}
        loading={statsLoading}
        error={statsError}
        onRefresh={() => {
          void refreshStats();
        }}
      />

      <OnlineDiscoverForm
        loading={discoveryLoading}
        onDiscover={handleDiscover}
      />

      {discoveryError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {discoveryError}
        </div>
      )}

      {discoveryData && (
        <div className="grid gap-3 sm:grid-cols-3">
          <ResultCard label="Discovered" value={discoveryData.discovered} />

          <ResultCard label="Successful" value={discoveryData.successful} />

          <ResultCard label="Failed" value={discoveryData.failed} />
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.date || ""}
              onChange={(event) => {
                clearSelection();

                updateFilters({
                  date: event.target.value,
                });
              }}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            />

            <button
              type="button"
              onClick={() => {
                clearSelection();

                updateFilters({
                  date: "",
                });
              }}
              disabled={!filters.date}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear
            </button>
          </div>
          <input
            value={filters.search || ""}
            onChange={(event) => {
              clearSelection();

              updateFilters({
                search: event.target.value,
              });
            }}
            placeholder="Search online leads"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={filters.businessModel || ""}
            onChange={(event) => {
              clearSelection();

              updateFilters({
                businessModel: event.target
                  .value as typeof filters.businessModel,
              });
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All business models</option>

            <option value="ecommerce">Ecommerce</option>

            <option value="saas">SaaS</option>
            <option value="agency">Agency</option>

            <option value="marketplace">Marketplace</option>

            <option value="other">Other</option>
          </select>

          <select
            value={filters.priority || ""}
            onChange={(event) => {
              clearSelection();

              updateFilters({
                priority: event.target.value as typeof filters.priority,
              });
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All priorities</option>

            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={filters.status || ""}
            onChange={(event) => {
              clearSelection();

              updateFilters({
                status: event.target.value as typeof filters.status,
              });
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>

            <option value="Not Contacted">Not Contacted</option>

            <option value="Email Sent">Email Sent</option>

            <option value="Interested">Interested</option>

            <option value="Meeting Booked">Meeting Booked</option>

            <option value="Closed">Closed</option>

            <option value="Needs Manual Review">Needs Manual Review</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleExportSelected}
          disabled={selectedCount === 0}
          className="rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          📥 Export Selected ({selectedCount})
        </button>
      </div>

      {leadsLoading && !initialLoading && (
        <p className="text-sm text-blue-600">Updating leads...</p>
      )}

      <BulkActionBar
        selectedCount={selectedCount}
        statuses={LEAD_STATUSES}
        loading={bulkActionLoading}
        onStatusChange={(status) =>
          handleBulkStatus(status as OnlineLeadStatus)
        }
        onRetry={handleBulkRetry}
        onDelete={handleBulkDelete}
        onClear={clearSelection}
      />

      <OnlineLeadList
        leads={leads}
        loading={leadsLoading}
        error={leadsError}
        page={filters.page ?? 1}
        total={total}
        rowsPerPage={filters.limit ?? 10}
        onPageChange={(page) => {
          clearSelection();
          updateFilters({ page });
        }}
        onRowsPerPageChange={(limit) => {
          clearSelection();

          updateFilters({
            limit,
            page: 1,
          });
        }}
        onSelect={setSelectedLead}
        selectedIds={selectedIds}
        allVisibleSelected={allVisibleSelected}
        onToggleSelect={toggleLead}
        onToggleAll={() => toggleAll(visibleLeadIds)}
        onStatusChange={handleStatusChange}
        onRetry={handleRetry}
        onDelete={handleDelete}
      />

      <OnlineLeadDetailsModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
