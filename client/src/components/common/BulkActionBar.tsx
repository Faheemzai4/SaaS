import { useState } from "react";

interface BulkActionBarProps<TStatus extends string> {
  selectedCount: number;
  statuses: readonly TStatus[];
  loading?: boolean;
  onStatusChange: (status: TStatus) => Promise<void> | void;
  onRetry: () => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  onClear: () => void;
}

export default function BulkActionBar<
  TStatus extends string,
>({
  selectedCount,
  statuses,
  loading = false,
  onStatusChange,
  onRetry,
  onDelete,
  onClear,
}: BulkActionBarProps<TStatus>) {
  const [selectedStatus, setSelectedStatus] =
    useState<TStatus | "">("");

  if (selectedCount === 0) {
    return null;
  }

  async function handleStatusApply() {
    if (!selectedStatus) {
      return;
    }

    await onStatusChange(selectedStatus);
    setSelectedStatus("");
  }

  return (
    <div className="sticky top-3 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 shadow-sm">
      <div className="mr-auto">
        <p className="font-semibold text-blue-900">
          {selectedCount} selected
        </p>

        <p className="text-xs text-blue-700">
          Actions apply to all selected leads.
        </p>
      </div>

      <select
        value={selectedStatus}
        onChange={(event) =>
          setSelectedStatus(
            event.target.value as TStatus | "",
          )
        }
        disabled={loading}
        className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">Choose status</option>

        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => {
          void handleStatusApply();
        }}
        disabled={loading || !selectedStatus}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Apply Status
      </button>

      <button
        type="button"
        onClick={() => {
          void onRetry();
        }}
        disabled={loading}
        className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Retry Selected
      </button>

      <button
        type="button"
        onClick={() => {
          void onDelete();
        }}
        disabled={loading}
        className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Delete Selected
      </button>

      <button
        type="button"
        onClick={onClear}
        disabled={loading}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Clear
      </button>
    </div>
  );
}