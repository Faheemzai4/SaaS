import { useState } from "react";

import {
  discoverOnlineCompanies,
} from "../../services/online/onlineApi";

import type {
  OnlineDiscoverInput,
  OnlineDiscoverResponse,
} from "../../types/onlineLead";

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

  return "Online company discovery failed.";
}

export function useOnlineDiscover() {
  const [data, setData] =
    useState<OnlineDiscoverResponse | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function discover(
    input: OnlineDiscoverInput,
  ): Promise<OnlineDiscoverResponse | null> {
    setLoading(true);
    setError(null);

    try {
      const result =
        await discoverOnlineCompanies({
          ...input,
          page: 1,
        });

      setData(result);

      return result;
    } catch (error) {
      setError(getErrorMessage(error));
      return null;
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setData(null);
    setError(null);
  }

  return {
    data,
    loading,
    error,
    discover,
    reset,
  };
}