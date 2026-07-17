import { useState } from "react";

import Header from "../components/layout/Header";
import ProfileModal from "../components/profile/ProfileModal";

import LocalBusinessesDashboard from "../components/local/LocalBusinessesDashboard";
import OnlineCompaniesDashboard from "../components/online/OnlineCompaniesDashboard";

type DashboardModule = "local" | "online";

export default function DashboardPage() {
  const [dashboardModule, setDashboardModule] =
    useState<DashboardModule>("local");

  const [profileOpen, setProfileOpen] = useState(false);

  const [, setSelectedLocalLeadIds] = useState<string[]>([]);
  const [, setSelectedOnlineLeadIds] = useState<string[]>([]);

  function handleModuleChange(module: DashboardModule) {
    setDashboardModule(module);
  }

  return (
    <>
      <div className="min-h-screen w-full bg-slate-100 p-6 text-black">
        <div className="mx-auto max-w-7xl space-y-6">
          <Header onOpenProfile={() => setProfileOpen(true)} />

          <div className="flex gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            <button
              type="button"
              onClick={() => handleModuleChange("local")}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                dashboardModule === "local"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Local Businesses
            </button>

            <button
              type="button"
              onClick={() => handleModuleChange("online")}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                dashboardModule === "online"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Online Companies
            </button>
          </div>

          {dashboardModule === "local" && (
            <LocalBusinessesDashboard
              onSelectionChange={setSelectedLocalLeadIds}
            />
          )}

          {dashboardModule === "online" && (
            <OnlineCompaniesDashboard
              onSelectionChange={setSelectedOnlineLeadIds}
            />
          )}
        </div>
      </div>

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  );
}