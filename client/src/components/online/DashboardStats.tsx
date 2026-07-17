import StatCard from "../online/StatCard";

import type { OnlineStats } from "../../types/onlineStats";

interface DashboardStatsProps {
  stats: OnlineStats;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
}

export default function DashboardStats({
  stats,
  loading = false,
  error = "",
  onRefresh,
}: DashboardStatsProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Online Companies Overview
          </h2>

          <p className="text-sm text-slate-500">
            Live statistics from your online leads.
          </p>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Refreshing..."
              : "Refresh Stats"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total Leads"
          value={stats.total}
          icon="🏢"
          loading={loading}
        />

        <StatCard
          title="High Priority"
          value={stats.highPriority}
          icon="🔥"
          loading={loading}
        />

        <StatCard
          title="Emails Found"
          value={stats.withEmail}
          icon="✉️"
          loading={loading}
        />

        <StatCard
          title="Manual Review"
          value={stats.manualReview}
          icon="⚠️"
          loading={loading}
        />

        <StatCard
          title="Interested"
          value={stats.interested}
          icon="⭐"
          loading={loading}
        />

        <StatCard
          title="Closed"
          value={stats.closed}
          icon="✅"
          loading={loading}
        />
      </div>
    </section>
  );
}