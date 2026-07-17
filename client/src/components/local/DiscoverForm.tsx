import { useMemo, useState } from "react";
import Select from "react-select";

import type { DiscoverInput } from "../../types/lead";
import { COUNTRIES } from "../../constants/countries";

type Props = {
  onDiscover: (input: DiscoverInput) => void;
  loading: boolean;
  message: string;
  limit: number;
  setLimit: (value: number) => void;
};

type CountryOption = {
  value: string;
  label: string;
};

export default function DiscoverForm({
  onDiscover,
  loading,
  message,
  limit,
  setLimit,
}: Props) {
  const [businessType, setBusinessType] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [countryCode, setCountryCode] = useState("");

  const countryOptions = useMemo<CountryOption[]>(
    () =>
      COUNTRIES.filter((country) => country.code !== "CUSTOM").map(
        (country) => ({
          value: country.code,
          label: `${country.name} (${country.code})`,
        }),
      ),
    [],
  );

  const selectedCountry =
    countryOptions.find((option) => option.value === countryCode) ?? null;

  const handleSubmit = () => {
    if (!businessType.trim() || !city.trim() || !countryCode) {
      return;
    }

    onDiscover({
      businessType: businessType.trim(),
      city: city.trim(),
      state: state.trim() || undefined,
      countryCode,
      limit,
    });
  };

  return (
    <div className="mb-4 rounded-lg border bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">Discover Leads</h2>

      <input
        className="mb-2 w-full rounded border p-2"
        placeholder="Business Type e.g. dentist"
        value={businessType}
        onChange={(event) => setBusinessType(event.target.value)}
        disabled={loading}
      />

      <input
        className="mb-2 w-full rounded border p-2"
        placeholder="City e.g. Austin"
        value={city}
        onChange={(event) => setCity(event.target.value)}
        disabled={loading}
      />

      <input
        className="mb-3 w-full rounded border p-2"
        placeholder="State / Province e.g. Texas (Optional)"
        value={state}
        onChange={(event) => setState(event.target.value)}
        disabled={loading}
      />

      <label className="mb-1 block text-sm font-medium text-slate-700">
        Country
      </label>

      <div className="mb-3">
        <Select<CountryOption, false>
          options={countryOptions}
          value={selectedCountry}
          onChange={(option) => setCountryCode(option?.value ?? "")}
          placeholder="Search country..."
          isSearchable
          isClearable
          isDisabled={loading}
          noOptionsMessage={() => "No country found"}
        />
      </div>

      <label className="mb-3 flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">
          Number of businesses
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

      <button
        type="button"
        onClick={handleSubmit}
        disabled={
          loading || !businessType.trim() || !city.trim() || !countryCode
        }
        className="w-full rounded-lg bg-green-600 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {loading ? "Searching..." : "Discover Leads"}
      </button>

      {message && <p className="mt-3 text-sm">{message}</p>}
    </div>
  );
}
