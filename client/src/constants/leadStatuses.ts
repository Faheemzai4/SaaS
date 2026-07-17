export const LEAD_STATUSES = [
  "Not Contacted",
  "Email Sent",
  "Interested",
  "Meeting Booked",
  "Closed",
  "Needs Manual Review",
] as const;

export type LeadStatus =
  (typeof LEAD_STATUSES)[number];