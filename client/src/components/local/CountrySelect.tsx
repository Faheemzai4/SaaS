import Select from "react-select";
import { COUNTRIES } from "../../constants/countries";

const options = COUNTRIES.map((country) => ({
  value: country.code,
  label: country.name,
}));

<Select
  options={options}
  placeholder="Search country..."
  isSearchable
/>