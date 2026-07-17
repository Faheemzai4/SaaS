import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { getOnlineStats } from "../../services/online/onlineApi";

import type { OnlineStats } from "../../types/onlineStats";

const initialStats: OnlineStats = {
  total: 0,
  highPriority: 0,
  withEmail: 0,
  manualReview: 0,
  interested: 0,
  closed: 0,
};

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to load online statistics.";
}

export function useOnlineStats() {
  const [stats, setStats] =
    useState<OnlineStats>(initialStats);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshStats = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getOnlineStats();

      setStats(result);
    } catch (error) {
      console.error(
        "Failed to load online statistics:",
        error,
      );

      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
  };
}