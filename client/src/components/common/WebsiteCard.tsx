import type { WebsiteData } from "../../types/website";

type Props = {
  website: WebsiteData;
};

export default function WebsiteCard({ website }: Props) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="font-semibold text-lg">Website</h2>

      <p className="mt-2">{website.title}</p>

      <p className="text-sm text-gray-500 break-all">
        {website.url}
      </p>

      <p className="mt-2 text-sm">
        {website.description}
      </p>
    </div>
  );
}