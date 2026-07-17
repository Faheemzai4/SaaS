export function normalizeWebsiteUrl(rawUrl: string): string {
  const parsed = new URL(rawUrl.trim());

  parsed.hostname = parsed.hostname.toLowerCase();

  return parsed.toString();
}
