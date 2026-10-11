import { COUNTRIES } from "@/lib/countries";

export function CountrySelect({
  id,
  name,
  defaultValue,
  required,
  className,
}: {
  id: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  className?: string;
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue ?? ""}
      required={required}
      className={className}
    >
      <option value="">Choose a country…</option>
      {COUNTRIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
