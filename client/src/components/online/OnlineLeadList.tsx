import TablePagination from "@mui/material/TablePagination";
import type { OnlineLead, OnlineLeadStatus } from "../../types/onlineLead";

interface OnlineLeadListProps {
  leads: OnlineLead[];
  loading: boolean;
  error: string | null;

  page: number;
  total: number;
  rowsPerPage: number;

  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onSelect: (lead: OnlineLead) => void;

  selectedIds: string[];
  allVisibleSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;

  onStatusChange: (
    id: string,
    status: OnlineLeadStatus,
  ) => Promise<unknown> | unknown;

  onRetry: (id: string) => Promise<unknown> | unknown;
  onDelete: (id: string) => Promise<unknown> | unknown;
}

const statuses: OnlineLeadStatus[] = [
  "Processing",
  "Not Contacted",
  "Email Sent",
  "Interested",
  "Meeting Booked",
  "Closed",
  "Needs Manual Review",
];

function priorityClasses(priority: OnlineLead["priority"]): string {
  switch (priority) {
    case "High":
      return "bg-red-100 text-red-700";

    case "Medium":
      return "bg-amber-100 text-amber-700";

    case "Low":
      return "bg-emerald-100 text-emerald-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function statusClasses(status: OnlineLeadStatus): string {
  switch (status) {
    case "Interested":
    case "Meeting Booked":
    case "Closed":
      return "bg-emerald-100 text-emerald-700";

    case "Needs Manual Review":
      return "bg-red-100 text-red-700";

    case "Processing":
      return "bg-blue-100 text-blue-700";

    case "Email Sent":
      return "bg-purple-100 text-purple-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function OnlineLeadList({
  leads,
  loading,
  error,
  page,
  total,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onSelect,
  onStatusChange,
  onRetry,
  onDelete,
  selectedIds,
  allVisibleSelected,
  onToggleSelect,
  onToggleAll,
}: OnlineLeadListProps) {
  async function handleDelete(lead: OnlineLead) {
    const confirmed = window.confirm(`Delete ${lead.name}?`);

    if (!confirmed) {
      return;
    }

    await onDelete(lead.id);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Loading online leads...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h3 className="font-semibold text-slate-900">No online leads found</h3>

        <p className="mt-1 text-sm text-slate-500">
          Run an online company search or change your filters.
        </p>
      </div>
    );
  }
  function handleChangePage(_event: unknown, newMuiPage: number) {
    // MUI uses zero-based pages.
    // The Online API and hook use one-based pages.
    onPageChange(newMuiPage + 1);
  }

  function handleChangeRowsPerPage(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const newRowsPerPage = Number(event.target.value);

    onRowsPerPageChange(newRowsPerPage);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Online Leads</h2>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
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

          <p className="text-sm text-slate-500">
            {total} lead{total === 1 ? "" : "s"} found
          </p>
        </div>
      </div>
      <div className="flex justify-end rounded-xl border border-slate-200 bg-white">
        <TablePagination
          component="div"
          count={total}
          page={Math.max(0, page - 1)}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 20, 50, 100]}
        />
      </div>

      <div className="grid gap-4">
        {leads.map((lead) => {
          const selected = selectedIds.includes(lead.id);

          return (
            <article
              key={lead.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                selected
                  ? "border-blue-500 ring-2 ring-blue-100"
                  : "border-slate-200 hover:border-blue-200"
              }`}
            >
              <div className="mb-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggleSelect(lead.id)}
                  aria-label={`Select ${lead.name}`}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <span className="text-xs text-slate-500">Select lead</span>
              </div>
              <div className="flex flex-col justify-between gap-4 lg:flex-row">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelect(lead)}
                      className="truncate text-left text-lg font-semibold text-slate-900 hover:text-blue-600"
                    >
                      {lead.name}
                    </button>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityClasses(
                        lead.priority,
                      )}`}
                    >
                      {lead.priority || "No priority"}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                        lead.status,
                      )}`}
                    >
                      {lead.status}
                    </span>
                  </div>

                  <a
                    href={lead.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block truncate text-sm text-blue-600 hover:underline"
                  >
                    {lead.primary_domain}
                  </a>

                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                    {lead.description ||
                      lead.summary ||
                      "No description available."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span>
                      Model:{" "}
                      <strong className="capitalize text-slate-700">
                        {lead.business_model}
                      </strong>
                    </span>

                    {lead.country && (
                      <span>
                        Country:{" "}
                        <strong className="text-slate-700">
                          {lead.country}
                        </strong>
                      </span>
                    )}

                    <span>
                      Score:{" "}
                      <strong className="text-slate-700">
                        {lead.score ?? "N/A"}
                      </strong>
                    </span>

                    <span>
                      Emails:{" "}
                      <strong className="text-slate-700">
                        {lead.emails?.length || 0}
                      </strong>
                    </span>

                    <span>
                      Phones:{" "}
                      <strong className="text-slate-700">
                        {lead.phones?.length || 0}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 lg:w-48">
                  <select
                    value={lead.status}
                    onChange={(event) =>
                      void onStatusChange(
                        lead.id,
                        event.target.value as OnlineLeadStatus,
                      )
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => onSelect(lead)}
                    className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                  >
                    View details
                  </button>

                  <button
                    type="button"
                    onClick={() => void onRetry(lead.id)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Retry analysis
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDelete(lead)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
