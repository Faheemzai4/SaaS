import { useState } from "react";
import type { Lead } from "../../types/lead";
import LeadCard from "./LeadCard";
import LeadDetailsModal from "./LeadDetailsModal";
import TablePagination from "@mui/material/TablePagination";
import { retryLeadAnalysis, updateLeadStatus } from "../../services/local/api";
import { exportLocalLeadsToCsv } from "../../utils/exportLeadsToCsv";

type Props = {
  leads: Lead[];
  total: number;
  page: number;
  setPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (value: number) => void;
  search: string;
  setSearch: (value: string) => void;
  priorityFilter: string;
  setPriorityFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  loading: boolean;
  error: string;
  onDelete: (id: string) => void;
  onLeadUpdated: (updatedLead: Lead) => void;
  date: string;
  setDate: (value: string) => void;
  onClear: () => void;
  selectedIds: string[];
  allVisibleSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
};

export default function LeadList({
  leads,
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
  loading,
  error,
  onDelete,
  onLeadUpdated,
  date,
  setDate,
  onClear,
  selectedIds,
  allVisibleSelected,
  onToggleSelect,
  onToggleAll,
}: Props) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // filter search

  // change handle
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const updatedLead = await updateLeadStatus(id, status);
      onLeadUpdated(updatedLead);

      if (selectedLead?.id === updatedLead.id) {
        setSelectedLead(updatedLead);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    }
  };

  // retryLeadAnalysis
  const handleRetry = async (id: string) => {
    try {
      const updatedLead = await retryLeadAnalysis(id);
      onLeadUpdated(updatedLead);

      if (selectedLead?.id === updatedLead.id) {
        setSelectedLead(updatedLead);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to retry analysis");
    }
  };

  // Cards
  const totalLeads = leads.length;
  const highPriority = leads.filter((lead) => lead.priority === "High").length;
  const needReview = leads.filter(
    (lead) => lead.status === "Needs Manual Review",
  ).length;
  const contacted = leads.filter((lead) => lead.status === "Email Sent").length;
  const closed = leads.filter((lead) => lead.status === "Closed").length;

  // export btn
  const handleExportSelected = () => {
    const selectedLeads = leads.filter((lead) => selectedIds.includes(lead.id));

    if (selectedLeads.length === 0) {
      window.alert("Select at least one visible local lead to export.");

      return;
    }

    exportLocalLeadsToCsv(selectedLeads, "local-leads-selected.csv");
  };

  // pagination
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          Saved Leads ({leads.length}/{total})
        </h2>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleExportSelected}
            disabled={selectedIds.length === 0}
            className="rounded-xl border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            📥 Export Selected ({selectedIds.length})
          </button>
        </div>
      </div>
      <div className="mb-4 flex items-center justify-between rounded-xl border bg-slate-50 px-4 py-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={onToggleAll}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Select all visible
        </label>

        <span className="text-sm text-slate-500">
          {selectedIds.length} selected
        </span>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total Leads" value={totalLeads} />
        <StatCard label="High Priority" value={highPriority} />
        <StatCard label="Need Review" value={needReview} />
        <StatCard label="Email Sent" value={contacted} />
        <StatCard label="Closed" value={closed} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MiniChart
          title="Leads by Priority"
          items={[
            { label: "High", value: highPriority },
            {
              label: "Medium",
              value: leads.filter((lead) => lead.priority === "Medium").length,
            },
            {
              label: "Low",
              value: leads.filter((lead) => lead.priority === "Low").length,
            },
          ]}
        />

        <MiniChart
          title="Leads by Status"
          items={[
            { label: "Need Review", value: needReview },
            { label: "Email Sent", value: contacted },
            { label: "Closed", value: closed },
            {
              label: "Not Contacted",
              value: leads.filter((lead) => lead.status === "Not Contacted")
                .length,
            },
          ]}
        />
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search company, website, email, phone..."
        className="mb-4 w-full rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
      />

      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="No Website">No Website</option>
          <option value="Needs Manual Review">Needs Manual Review</option>
          <option value="Not Contacted">Not Contacted</option>
          <option value="Email Sent">Email Sent</option>
          <option value="Interested">Interested</option>
          <option value="Meeting Booked">Meeting Booked</option>
          <option value="Closed">Closed</option>
        </select>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500"
          />

          <button
            type="button"
            onClick={onClear}
            disabled={!date}
            className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Date
          </button>
        </div>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[4, 8, 16, 32, 64, 100]}
        />
      </div>

      {loading && <p className="text-sm">Loading leads...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && leads.length === 0 && (
        <p className="text-sm text-gray-500">No leads found.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onDelete={onDelete}
            onView={setSelectedLead}
            onStatusChange={handleStatusChange}
            onRetry={handleRetry}
            selected={selectedIds.includes(lead.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>

      <LeadDetailsModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </div>
  );
}

//

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-100 p-3 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function MiniChart({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number }[];
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-xl border bg-white p-4">
      <h3 className="mb-3 text-sm font-bold text-slate-800">{title}</h3>

      <div className="space-y-3">
        {items.map((item) => {
          const percent = total === 0 ? 0 : (item.value / total) * 100;

          return (
            <div key={item.label}>
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
