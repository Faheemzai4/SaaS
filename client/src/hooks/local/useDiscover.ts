import { useState } from "react";
import type { DiscoverInput } from "../../types/lead";
import { discoverLeads } from "../../services/local/api";

export function useDiscover(onSuccess: () => Promise<void>) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const discover = async (input: DiscoverInput) => {
    try {
      setLoading(true);
      setMessage("Searching businesses...");

      const data = await discoverLeads(input);

      setMessage(`Done. Found ${data.total} leads.`);

      await onSuccess();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Discovery failed");
    } finally {
      setLoading(false);
    }
  };

  return {
    discover,
    loading,
    message,
  };
}