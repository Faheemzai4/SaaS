import type { Lead } from "../types/lead";
import type { OnlineLead } from "../types/onlineLead";

function escapeCsvValue(value: unknown): string {
  const text = String(value ?? "").replace(/"/g, '""');

  return `"${text}"`;
}

function downloadCsv(
  headers: string[],
  rows: unknown[][],
  filename: string,
) {
  const csvContent = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) =>
      row.map(escapeCsvValue).join(","),
    ),
  ].join("\n");

  const blob = new Blob(
    [`\uFEFF${csvContent}`],
    {
      type: "text/csv;charset=utf-8;",
    },
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function exportLocalLeadsToCsv(
  leads: Lead[],
  filename = "local-leads.csv",
) {
  const headers = [
    "Company",
    "Website",
    "Email",
    "Phone",
    "Business Type",
    "City",
    "State",
    "Score",
    "Priority",
    "Status",
    "Summary",
    "Issues",
    "Email Subject",
    "Email Body",
    "Created At",
  ];

  const rows = leads.map((lead) => [
    lead.title || "",
    lead.url || "",
    lead.emails?.join("; ") || "",
    lead.phones?.join("; ") || "",
    lead.businessType || "",
    lead.city || "",
    lead.state || "",
    lead.score ?? "",
    lead.priority || "",
    lead.status || "Not Contacted",
    lead.summary || "",
    lead.issues?.join("; ") || "",
    lead.emailSubject || "",
    lead.emailBody || "",
    lead.createdAt || "",
  ]);

  downloadCsv(headers, rows, filename);
}

export function exportOnlineLeadsToCsv(
  leads: OnlineLead[],
  filename = "online-leads.csv",
) {
  const headers = [
    "Company",
    "Website",
    "Primary Domain",
    "Business Model",
    "Industry",
    "Country",
    "Email",
    "Phone",
    "Score",
    "Priority",
    "Status",
    "Analysis Status",
    "Summary",
    "Issues",
    "Email Subject",
    "Email Body",
    "Created At",
  ];

  const rows = leads.map((lead) => [
    lead.name || "",
    lead.website_url || "",
    lead.primary_domain || "",
    lead.business_model || "",
    lead.industry || "",
    lead.country || "",
    lead.emails?.join("; ") || "",
    lead.phones?.join("; ") || "",
    lead.score ?? "",
    lead.priority || "",
    lead.status || "",
    lead.analysis_status || "",
    lead.summary || "",
    lead.issues?.join("; ") || "",
    lead.email_subject || "",
    lead.email_body || "",
    lead.created_at || "",
  ]);

  downloadCsv(headers, rows, filename);
}