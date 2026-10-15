"use client";

import { buttonPrimary } from "@/containers/Account/styles";
import { fieldClass, labelClass } from "@/containers/Admin/Teams/styles";
import type {
  LeagueActionState,
  OrganizationOption,
} from "@/features/leagues/league.types";
import { useOrganizationLink } from "./use-organization-link";

interface Props {
  options: OrganizationOption[];
  current: string | null;
  action: (organizationId: string | null) => Promise<LeagueActionState>;
}

export function OrganizationLink({ options, current, action }: Props) {
  const { value, setValue, state, pending, save, changed } =
    useOrganizationLink(current, action);
  return (
    <div className="space-y-2">
      <label htmlFor="league-org" className={labelClass}>
        Federation
      </label>
      <div className="flex flex-wrap gap-2">
        <select
          id="league-org"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${fieldClass} min-w-56 flex-1`}
        >
          <option value="">Independent (no federation)</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={save}
          disabled={pending || !changed}
          className={buttonPrimary}
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "text-sm text-zs-coral"
              : "text-sm text-zs-lime"
          }
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
