import { useMemo, useState, type FormEvent } from "react";
import Select from "react-select";

import { COUNTRIES } from "../../constants/countries";

import type {
  EcommercePlatform,
  OnlineBusinessModel,
  OnlineDiscoverInput,
} from "../../types/onlineLead";

interface OnlineDiscoverFormProps {
  loading: boolean;
  onDiscover: (input: OnlineDiscoverInput) => Promise<unknown> | unknown;
}

type CountryOption = {
  value: string;
  label: string;
  countryName: string;
};

const businessModels: Array<{
  value: OnlineBusinessModel;
  label: string;
}> = [
  { value: "ecommerce", label: "Ecommerce" },
  { value: "saas", label: "SaaS" },
  { value: "agency", label: "Agency" },
  { value: "marketplace", label: "Marketplace" },
  { value: "other", label: "Other Online Business" },
];

const platforms: Array<{
  value: EcommercePlatform;
  label: string;
}> = [
  { value: "any", label: "Any platform" },
  { value: "shopify", label: "Shopify" },
  { value: "woocommerce", label: "WooCommerce" },
];

export default function OnlineDiscoverForm({
  loading,
  onDiscover,
}: OnlineDiscoverFormProps) {
  const [keywords, setKeywords] = useState("");
  const [businessModel, setBusinessModel] =
    useState<OnlineBusinessModel>("saas");
  const [industry, setIndustry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [platform, setPlatform] = useState<EcommercePlatform>("any");
  const [limit, setLimit] = useState(5);

  const countryOptions = useMemo<CountryOption[]>(
    () =>
      COUNTRIES.filter((country) => country.code !== "CUSTOM").map(
        (country) => ({
          value: country.code,
          countryName: country.name,
          label: `${country.name} (${country.code})`,
        }),
      ),
    [],
  );

  const selectedCountry =
    countryOptions.find((option) => option.value === countryCode) ?? null;

  const showPlatform = businessModel === "ecommerce";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedKeywords = keywords.trim();

    if (!normalizedKeywords || loading) {
      return;
    }

    await onDiscover({
      keywords: normalizedKeywords,
      businessModel,
      industry: industry.trim() || undefined,

      // Full country name is useful for the Brave search query.
      country: selectedCountry?.countryName || undefined,

      // ISO country code is required for phone normalization.
      countryCode: selectedCountry?.value || undefined,

      platform: businessModel === "ecommerce" ? platform : "any",

      page: 1,
      limit,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">
          Discover Online Companies
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Find SaaS companies, ecommerce stores, agencies, marketplaces and
          other internet-first businesses.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Keywords</span>

          <input
            value={keywords}
            onChange={(event) => setKeywords(event.target.value)}
            placeholder="Project management software"
            required
            disabled={loading}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">
            Business model
          </span>

          <select
            value={businessModel}
            onChange={(event) =>
              setBusinessModel(event.target.value as OnlineBusinessModel)
            }
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {businessModels.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Industry</span>

          <input
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
            placeholder="Productivity"
            disabled={loading}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Country</span>

          <Select<CountryOption, false>
            options={countryOptions}
            value={selectedCountry}
            onChange={(option) => setCountryCode(option?.value ?? "")}
            placeholder="Search country..."
            isSearchable
            isClearable
            isDisabled={loading}
            noOptionsMessage={() => "No country found"}
            classNamePrefix="online-country"
          />
        </div>

        {showPlatform && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              Ecommerce platform
            </span>

            <select
              value={platform}
              onChange={(event) =>
                setPlatform(event.target.value as EcommercePlatform)
              }
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              {platforms.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">
            Number of companies
          </span>

          <select
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {[5, 10, 20, 50, 100].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={loading || !keywords.trim()}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "Discovering companies..." : "Discover Online Companies"}
        </button>
      </div>
    </form>
  );
}
