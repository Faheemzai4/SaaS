import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

interface HeaderProps {
  onOpenProfile: () => void;
}

export default function Header({ onOpenProfile }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const handleAddExtension = () => {
    alert(
      "To add this extension:\n\n1. Run npm run build in client\n2. Open chrome://extensions\n3. Enable Developer Mode\n4. Click Load Unpacked\n5. Select client/dist",
    );
  };

  const handleLogout = async () => {
    setLogoutError("");
    setLoggingOut(true);

    try {
      const { error } = await signOut();

      if (error) {
        setLogoutError(error.message);
        return;
      }

      navigate("/login", {
        replace: true,
      });
    } catch (unknownError) {
      console.error("Logout failed:", unknownError);

      setLogoutError("Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            AI Sales Dashboard
          </h1>

          <p className="text-sm text-slate-500">
            Discover, analyze, and manage business leads.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 rounded-xl bg-slate-100 px-4 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Signed in as
            </p>

            <p className="max-w-64 truncate text-sm font-semibold text-slate-800">
              {user?.email ?? "Authenticated user"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            disabled={loggingOut}
            className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
          >
            Service Profile
          </button>
          <button
            type="button"
            onClick={handleAddExtension}
            className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-900"
          >
            Add Extension
          </button>
        </div>
      </div>

      {logoutError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {logoutError}
        </div>
      )}
    </header>
  );
}
