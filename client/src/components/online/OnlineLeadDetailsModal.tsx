import {
  useState,
  type ReactNode,
} from "react";

import type { OnlineLead } from "../../types/onlineLead";

interface OnlineLeadDetailsModalProps {
  lead: OnlineLead | null;
  onClose: () => void;
}

type Tab =
  | "overview"
  | "contacts"
  | "socials"
  | "issues"
  | "email";

function CopyButton({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!value}
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
    >
      {copied ? "Copied" : label}
    </button>
  );
}

export default function OnlineLeadDetailsModal({
  lead,
  onClose,
}: OnlineLeadDetailsModalProps) {
  const [tab, setTab] = useState<Tab>("overview");

  if (!lead) {
    return null;
  }

  const socialGroups = [
    ["LinkedIn", lead.social_links?.linkedin || []],
    ["Facebook", lead.social_links?.facebook || []],
    ["Instagram", lead.social_links?.instagram || []],
    ["X / Twitter", lead.social_links?.x || []],
    ["WhatsApp", lead.social_links?.whatsapp || []],
  ] as const;

  const tabs: Array<{
    value: Tab;
    label: string;
  }> = [
    { value: "overview", label: "Overview" },
    { value: "contacts", label: "Contacts" },
    { value: "socials", label: "Socials" },
    { value: "issues", label: "Issues" },
    { value: "email", label: "AI Email" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-slate-200 p-5">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-slate-900">
              {lead.name}
            </h2>

            <a
              href={lead.website_url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block truncate text-sm text-blue-600 hover:underline"
            >
              {lead.website_url}
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-4 rounded-lg px-3 py-1.5 text-xl text-slate-500 hover:bg-slate-100"
            aria-label="Close modal"
          >
            ×
          </button>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 px-5 py-3">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                tab === item.value
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <main className="max-h-[65vh] overflow-y-auto p-5">
          {tab === "overview" && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  label="Website score"
                  value={
                    lead.score === null
                      ? "N/A"
                      : `${lead.score}/100`
                  }
                />

                <Metric
                  label="Priority"
                  value={lead.priority || "N/A"}
                />

                <Metric
                  label="Business model"
                  value={lead.business_model}
                />

                <Metric
                  label="Status"
                  value={lead.status}
                />
              </div>

              <Section title="Page title">
                <p>{lead.page_title || "Not available."}</p>
              </Section>

              <Section title="Description">
                <p>{lead.description || "Not available."}</p>
              </Section>

              <Section title="AI summary">
                <p>{lead.summary || "Not available."}</p>
              </Section>

              <Section title="Business opportunity">
                <p>
                  {lead.business_opportunity ||
                    "Not available."}
                </p>
              </Section>

              <Section title="Estimated impact">
                <p>
                  {lead.estimated_impact ||
                    "Not available."}
                </p>
              </Section>
            </div>
          )}

          {tab === "contacts" && (
            <div className="grid gap-5 md:grid-cols-2">
              <ContactSection
                title="Emails"
                values={lead.emails || []}
              />

              <ContactSection
                title="Phone numbers"
                values={lead.phones || []}
              />
            </div>
          )}

          {tab === "socials" && (
            <div className="space-y-5">
              {socialGroups.map(([label, values]) => (
                <section
                  key={label}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <h3 className="font-semibold text-slate-900">
                    {label}
                  </h3>

                  {values.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">
                      No links found.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {values.map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="block break-all text-sm text-blue-600 hover:underline"
                        >
                          {url}
                        </a>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}

          {tab === "issues" && (
            <div>
              {lead.issues?.length ? (
                <ul className="space-y-3">
                  {lead.issues.map((issue, index) => (
                    <li
                      key={`${issue}-${index}`}
                      className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
                    >
                      {issue}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">
                  No website issues were detected.
                </p>
              )}
            </div>
          )}

          {tab === "email" && (
            <div className="space-y-5">
              <section className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">
                    Subject
                  </h3>

                  <CopyButton
                    value={lead.email_subject || ""}
                    label="Copy subject"
                  />
                </div>

                <p className="mt-3 text-sm text-slate-700">
                  {lead.email_subject ||
                    "No email subject generated."}
                </p>
              </section>

              <section className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">
                    Email body
                  </h3>

                  <CopyButton
                    value={lead.email_body || ""}
                    label="Copy email"
                  />
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {lead.email_body ||
                    "No email body generated."}
                </p>
              </section>
            </div>
          )}
        </main>

        <footer className="flex justify-end gap-3 border-t border-slate-200 p-4">
          <a
            href={lead.website_url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Visit website
          </a>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 capitalize font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900">
        {title}
      </h3>

      <div className="mt-2 text-sm leading-6 text-slate-600">
        {children}
      </div>
    </section>
  );
}

function ContactSection({
  title,
  values,
}: {
  title: string;
  values: string[];
}) {
  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900">
        {title}
      </h3>

      {values.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          No {title.toLowerCase()} found.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {values.map((value) => (
            <div
              key={value}
              className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"
            >
              <span className="break-all text-sm text-slate-700">
                {value}
              </span>

              <CopyButton
                value={value}
                label="Copy"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}