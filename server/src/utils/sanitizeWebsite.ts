export function sanitizeWebsite(url: string): string {
  let cleaned = url.trim();

  cleaned = cleaned.replace(/^https?:\/\/https?:\/\//i, "https://");
  cleaned = cleaned.replace(/^http:\/\/http:\/\//i, "http://");
  cleaned = cleaned.replace(/^https:\/\/https:\/\//i, "https://");

  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }

  return cleaned;
}