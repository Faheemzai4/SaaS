import { supabase } from "../../../config/supabase";
import { normalizeWebsiteUrl } from "../../../utils/normalizeWebsiteUrl";

export async function getLeadByUrl(
  url: string,
  userId: string,
) {
  const normalizedUrl = normalizeWebsiteUrl(url);

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", userId)
    .eq("url", normalizedUrl)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}