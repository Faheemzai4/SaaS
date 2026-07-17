import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

import { supabase } from "../lib/supabase";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export type ApiErrorResponse = {
  message?: string;
  error?: string;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig,
  ) => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error(
        "Failed to read authentication session:",
        error.message,
      );

      return config;
    }

    if (session?.access_token) {
      config.headers.Authorization =
        `Bearer ${session.access_token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      console.warn(
        "Authentication session is missing, invalid, or expired.",
      );
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      fallbackMessage
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}