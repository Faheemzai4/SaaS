import type { WebsiteData } from "../../types/website";

type Props = {
  website: WebsiteData;
};

export default function StatsCard({ website }: Props) {
  return (
    <div className="rounded-lg border bg-white p-4 mt-4">
      <h2 className="font-semibold text-lg mb-3">Statistics</h2>

      <p>📧 Emails: {website.emails.length}</p>
      {website.emails.length > 0 && (
        <ul className="list-disc pl-5 text-sm break-all">
          {website.emails.map((email, index) => (
            <li key={index}>{email}</li>
          ))}
        </ul>
      )}

      <p className="mt-3">📞 Phones: {website.phones.length}</p>
      {website.phones.length > 0 && (
        <ul className="list-disc pl-5 text-sm break-all">
          {website.phones.map((phone, index) => (
            <li key={index}>{phone}</li>
          ))}
        </ul>
      )}

      <p className="mt-3">🖼 Images: {website.images}</p>
      <p>🔘 Buttons: {website.buttons}</p>
      <p>📋 Forms: {website.forms}</p>
    </div>
  );
}