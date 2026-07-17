import { useEffect, useState } from "react";

import type { WebsiteData } from "../types/website";
import Login from "./Login";
import { supabase } from "./supabase";

type LeadModule = "local" | "online";

type SavedLead = {
  title?: string;
  name?: string;

  url?: string;
  website_url?: string;

  score?: number;
  priority?: string;

  issues?: string[];
  emails?: string[];
  phones?: string[];

  emailSubject?: string;
  emailBody?: string;

  email_subject?: string;
  email_body?: string;
};

interface ExtensionSaveResponse {
  module: LeadModule;
  message: string;
  lead: SavedLead;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function PopupApp() {
  const [module, setModule] = useState<LeadModule>("local");

  const [authLoading, setAuthLoading] = useState(true);

  const [loggedIn, setLoggedIn] = useState(false);

  const [loading, setLoading] = useState(false);

  const [lead, setLead] = useState<SavedLead | null>(null);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setLoggedIn(Boolean(session));
      setAuthLoading(false);
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session));
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    setError("");
    setMessage("");
    setLead(null);

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      return;
    }

    setLoggedIn(false);
  };

  const analyzeAndSave = () => {
    setLoading(true);
    setError("");
    setMessage("");
    setLead(null);

    chrome.runtime.sendMessage(
      {
        type: "ANALYZE_WEBSITE",
      },
      async (websiteData: WebsiteData | undefined) => {
        if (chrome.runtime.lastError || !websiteData) {
          setError(
            "Could not read the current website. Refresh the page and try again.",
          );

          setLoading(false);
          return;
        }

        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.access_token) {
            throw new Error(
              "Your extension session has expired. Please log in again.",
            );
          }

          const response = await fetch(`${API_URL}/extension/leads`, {
            method: "POST",

            headers: {
              "Content-Type": "application/json",

              Authorization: `Bearer ${session.access_token}`,
            },

            body: JSON.stringify({
              module,
              website: websiteData,

              local:
                module === "local"
                  ? {
                      businessName: websiteData.title,

                      businessType: "Extension Lead",
                    }
                  : undefined,

              online:
                module === "online"
                  ? {
                      companyName: websiteData.title,

                      businessModel: "other",
                    }
                  : undefined,
            }),
          });

          const data = (await response.json()) as ExtensionSaveResponse & {
            error?: string;
          };

          if (!response.ok) {
            throw new Error(
              data.message || data.error || "Extension sync failed.",
            );
          }

          setLead(data.lead);
          setMessage(data.message);
        } catch (requestError) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Backend failed. Make sure the server is running.",
          );
        } finally {
          setLoading(false);
        }
      },
    );
  };

  const displayTitle = lead?.title || lead?.name || "Saved lead";

  const displayUrl = lead?.url || lead?.website_url || "";

  if (authLoading) {
    return (
      <div className="flex w-[400px] items-center justify-center bg-slate-100 p-8 text-sm text-slate-600">
        Loading...
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="w-[400px] bg-slate-100 p-5">
        <Login onLogin={() => setLoggedIn(true)} />
      </div>
    );
  }

  return (
    <div className="w-[400px] bg-slate-100 p-5 text-black">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">AI Sales Agent</h1>

          <p className="mt-1 text-sm text-slate-600">
            Analyze and save the current website.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loading}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
        >
          Logout
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setModule("local")}
          disabled={loading}
          className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
            module === "local"
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Local Business
        </button>

        <button
          type="button"
          onClick={() => setModule("online")}
          disabled={loading}
          className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
            module === "online"
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Online Company
        </button>
      </div>

      <button
        type="button"
        onClick={analyzeAndSave}
        disabled={loading}
        className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading
          ? "Analyzing & Saving..."
          : `Analyze Current Website as ${
              module === "local" ? "Local" : "Online"
            } Lead`}
      </button>

      {error && (
        <p className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p className="mt-4 rounded-lg bg-green-100 p-3 text-sm text-green-700">
          {message}
        </p>
      )}

      {lead && (
        <div className="mt-4 space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="font-bold text-slate-900">{displayTitle}</h2>

          <p className="break-all text-xs text-blue-600">{displayUrl}</p>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <p>
              <strong>Score:</strong> {lead.score ?? "N/A"}
            </p>

            <p>
              <strong>Priority:</strong> {lead.priority ?? "N/A"}
            </p>
          </div>

          <p className="text-sm text-slate-600">
            Emails found: {lead.emails?.length ?? 0}
          </p>

          <p className="text-sm text-slate-600">
            Phones found: {lead.phones?.length ?? 0}
          </p>
        </div>
      )}
    </div>
  );
}
