"use client";

import { ActionButton } from "@/containers/Admin/Teams/components/action-button";
import { POSITIONS } from "@/features/athletes/athlete.constants";
import type { RosterActionState } from "@/features/rosters/roster.types";
import { buttonLink, fieldClass } from "../../Admin/Teams/styles";
import { useEntryEditor } from "./use-entry-editor";

interface Props {
  jersey: number;
  position: string;
  update: (jersey: number, position: string) => Promise<RosterActionState>;
  withdraw: () => Promise<RosterActionState>;
}

export function EntryEditor({ jersey, position, update, withdraw }: Props) {
  const e = useEntryEditor({ jersey, position }, update);
  if (!e.editing) {
    return (
      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={e.open} className={buttonLink}>
          Edit
        </button>
        <ActionButton
          action={withdraw}
          label="Remove"
          pendingLabel="Removing…"
          variant="danger"
          confirm="Remove this athlete from the roster?"
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <input
          type="number"
          min={0}
          max={99}
          value={e.jersey}
          onChange={(ev) => e.setJersey(ev.target.value)}
          aria-label="Jersey number"
          className={`${fieldClass} w-20`}
        />
        <select
          value={e.position}
          onChange={(ev) => e.setPosition(ev.target.value)}
          aria-label="Position"
          className={`${fieldClass} w-28`}
        >
          {POSITIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={e.save}
          disabled={e.pending}
          className={buttonLink}
        >
          {e.pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={e.cancel}
          disabled={e.pending}
          className={buttonLink}
        >
          Cancel
        </button>
      </div>
      {e.error && (
        <span
          role="alert"
          className="max-w-xs text-right text-xs text-zs-coral"
        >
          {e.error}
        </span>
      )}
    </div>
  );
}
