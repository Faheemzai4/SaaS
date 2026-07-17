import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number;
  icon?: ReactNode;
  loading?: boolean;
}

export default function StatCard({
  title,
  value,
  icon,
  loading = false,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          {loading ? (
            <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-200" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {value}
            </p>
          )}
        </div>

        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xl">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}