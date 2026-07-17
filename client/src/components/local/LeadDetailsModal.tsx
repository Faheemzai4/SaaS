import { useState } from "react";
import type { ReactNode } from "react";
import type { Lead } from "../../types/lead";

type Props = {
  lead: Lead | null;
  onClose: () => void;
};

type Tab = "Overview" | "Contacts" | "Socials" | "Issues" | "AI Email";

export default function LeadDetailsModal({ lead, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  if (!lead) return null;
  const hasWebsite = !lead.url.startsWith("no-website:");

  const copyText = async (text?: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="border-b p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {lead.title || "Untitled Lead"}
              </h2>

              <a
                href={lead.url}
                target="_blank"
                rel="noreferrer"
                className="break-all text-sm text-blue-600"
              >
                {lead.url}
              </a>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <Stat label="Score" value={lead.score ?? "N/A"} />
            <Stat label="Priority" value={lead.priority ?? "N/A"} />
            <Stat label="Status" value={lead.status ?? "Not Contacted"} />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b px-5 pt-4">
          {(
            ["Overview", "Contacts", "Socials", "Issues", "AI Email"] as Tab[]
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === "Overview" && (
            <>
              {lead.description && (
                <Section title="Description">
                  <p>{lead.description}</p>
                </Section>
              )}

              {lead.summary && (
                <Section title="Summary">
                  <p>{lead.summary}</p>
                </Section>
              )}

              {lead.businessOpportunity && (
                <Section title="Business Opportunity">
                  <p>{lead.businessOpportunity}</p>
                </Section>
              )}

              {hasWebsite && (
                <button
                  onClick={() => window.open(lead.url, "_blank")}
                  className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  🌐 Visit Website
                </button>
              )}
            </>
          )}

          {activeTab === "Contacts" && (
            <>
              <Section title="📧 Emails">
                {lead.emails && lead.emails.length > 0 ? (
                  lead.emails.map((email, index) => (
                    <a
                      key={index}
                      href={`mailto:${email}`}
                      className="block break-all text-blue-600"
                    >
                      {email}
                    </a>
                  ))
                ) : (
                  <p>No emails found.</p>
                )}
              </Section>

              <Section title="📞 Phones">
                {lead.phones && lead.phones.length > 0 ? (
                  lead.phones.map((phone, index) => (
                    <p key={index} className="break-all">
                      {phone}
                    </p>
                  ))
                ) : (
                  <p>No phones found.</p>
                )}
              </Section>
            </>
          )}

          {activeTab === "Socials" && (
            <Section title="🌐 Social Links">
              {lead.socialLinks ? (
                <>
                  {lead.socialLinks.facebook.map((link, i) => (
                    <LinkItem key={`fb-${i}`} label="Facebook" link={link} />
                  ))}

                  {lead.socialLinks.instagram.map((link, i) => (
                    <LinkItem key={`ig-${i}`} label="Instagram" link={link} />
                  ))}

                  {lead.socialLinks.linkedin.map((link, i) => (
                    <LinkItem key={`li-${i}`} label="LinkedIn" link={link} />
                  ))}

                  {lead.socialLinks.x.map((link, i) => (
                    <LinkItem key={`x-${i}`} label="X" link={link} />
                  ))}
                </>
              ) : (
                <p>No social links found.</p>
              )}
            </Section>
          )}

          {activeTab === "Issues" && (
            <Section title="⚠ Issues">
              {lead.issues && lead.issues.length > 0 ? (
                <ul className="list-disc pl-5">
                  {lead.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              ) : (
                <p>No issues found.</p>
              )}
            </Section>
          )}

          {activeTab === "AI Email" && (
            <>
              <Section title="Email Subject">
                <div className="flex items-start justify-between gap-3">
                  <p>{lead.emailSubject || "No subject generated."}</p>

                  {lead.emailSubject && (
                    <button
                      onClick={() => copyText(lead.emailSubject)}
                      className="rounded bg-gray-200 px-3 py-1 text-xs hover:bg-gray-300"
                    >
                      Copy
                    </button>
                  )}
                </div>
              </Section>

              <Section title="Email Body">
                {lead.emailBody ? (
                  <>
                    <textarea
                      readOnly
                      value={lead.emailBody}
                      rows={8}
                      className="w-full rounded-lg border p-3 text-sm"
                    />

                    <button
                      onClick={() => copyText(lead.emailBody)}
                      className="mt-2 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                    >
                      📋 Copy Email
                    </button>
                  </>
                ) : (
                  <p>No email generated.</p>
                )}
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-gray-100 p-3">
      <p className="text-gray-500">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border bg-gray-50 p-3 text-sm">
      <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
      <div className="text-gray-700">{children}</div>
    </div>
  );
}

function LinkItem({ label, link }: { label: string; link: string }) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className="block break-all text-blue-600"
    >
      {label}: {link}
    </a>
  );
}
