"use client";

import { buttonLink, labelClass } from "../../styles";
import { useColorField } from "./use-color-field";

export function ColorField({
  name,
  label,
  initial,
}: {
  name: string;
  label: string;
  initial: string | null;
}) {
  const { value, set, clear } = useColorField(initial);
  return (
    <div>
      <label htmlFor={`c-${name}`} className={labelClass}>
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          id={`c-${name}`}
          type="color"
          value={value || "#000000"}
          onChange={(e) => set(e.target.value)}
          className="h-10 w-14 cursor-pointer border border-zs-line bg-zs-bg p-1"
        />
        <span className="font-data text-xs text-zs-muted">
          {value || "Not set"}
        </span>
        {value && (
          <button type="button" onClick={clear} className={buttonLink}>
            Clear
          </button>
        )}
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
