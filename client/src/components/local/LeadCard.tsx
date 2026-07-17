import type { Lead } from "../../types/lead";

type Props = {
  lead: Lead;
  onDelete: (id: string) => void;
  onView: (lead: Lead) => void;
  onStatusChange: (id: string, status: string) => void;
  onRetry: (id: string) => void;
  selected: boolean;
  onToggleSelect: (id: string) => void;
};

export default function LeadCard({
  lead,
  onDelete,
  onView,
  onStatusChange,
  onRetry,
  selected,
  onToggleSelect,
}: Props) {
  const title = lead.title || lead.url || "Untitled Lead";

  const displayUrl = lead.url.replace(/^https?:\/\//, "").replace(/^www\./, "");

  const location =
    lead.city || lead.state
      ? `${lead.city || ""}${lead.city && lead.state ? ", " : ""}${
          lead.state || ""
        }`
      : "Unknown location";

  const priorityClass =
    lead.priority === "High"
      ? "bg-red-100 text-red-700"
      : lead.priority === "Medium"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-green-100 text-green-700";

  const statusClass =
    lead.status === "Needs Manual Review"
      ? "bg-orange-100 text-orange-700"
      : lead.status === "Email Sent"
        ? "bg-blue-100 text-blue-700"
        : lead.status === "Closed"
          ? "bg-green-100 text-green-700"
          : "bg-slate-100 text-slate-700";

  const hasWebsite = !lead.url.startsWith("no-website:");

  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
        selected ? "border-blue-500 ring-2 ring-blue-100" : ""
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(lead.id)}
          aria-label={`Select ${title}`}
          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />

        <span className="text-xs text-slate-500">Select lead</span>
      </div>
      
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-xs font-medium text-slate-500">
          📍 {location}
        </p>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${priorityClass}`}
        >
          {lead.priority ?? "N/A"}
        </span>
      </div>

      <h3 className="break-words text-lg font-bold leading-6 text-slate-900">
        {title}
      </h3>

      {hasWebsite ? (
        <a
          href={lead.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block break-all text-xs text-blue-600 hover:underline"
        >
          🌐 {displayUrl}
        </a>
      ) : (
        <p className="mt-2 text-xs font-semibold text-red-600">
          🚫 No website found
        </p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl bg-slate-100 p-2">
          <p className="text-slate-500">Score</p>
          <p className="text-base font-bold text-slate-900">
            {lead.score ?? "N/A"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-100 p-2">
          <p className="text-slate-500">Emails</p>
          <p className="text-base font-bold text-slate-900">
            {lead.emails?.length ?? 0}
          </p>
        </div>

        <div className="rounded-xl bg-slate-100 p-2">
          <p className="text-slate-500">Phones</p>
          <p className="text-base font-bold text-slate-900">
            {lead.phones?.length ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <select
          value={lead.status ?? "Not Contacted"}
          onChange={(e) => onStatusChange(lead.id, e.target.value)}
          className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none ${statusClass}`}
        >
          <option value="Needs Manual Review">Needs Manual Review</option>
          <option value="Not Contacted">Not Contacted</option>
          <option value="Email Sent">Email Sent</option>
          <option value="Interested">Interested</option>
          <option value="Meeting Booked">Meeting Booked</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {lead.emails && lead.emails.length > 0 && (
        <div className="mt-3 rounded-xl bg-slate-50 p-2 text-xs">
          <p className="font-semibold text-slate-600">📧 Email</p>
          <p className="break-all text-slate-700">{lead.emails[0]}</p>
        </div>
      )}

      {lead.phones && lead.phones.length > 0 && (
        <div className="mt-2 rounded-xl bg-slate-50 p-2 text-xs">
          <p className="font-semibold text-slate-600">📞 Phone</p>
          <p className="break-all text-slate-700">{lead.phones[0]}</p>
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <button
          onClick={() => onView(lead)}
          className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600"
        >
          👁 View Details
        </button>

        {lead.status === "Needs Manual Review" && (
          <button
            onClick={() => onRetry(lead.id)}
            className="rounded-lg border border-orange-300 px-4 py-2.5 text-orange-600 hover:bg-orange-50"
          >
            🔄
          </button>
        )}

        <button
          onClick={() => onDelete(lead.id)}
          className="rounded-lg border border-red-300 px-4 py-2.5 text-red-600 hover:bg-red-50"
          title="Delete"
        >
          🗑
        </button>
      </div>
    </div>
  );
}
