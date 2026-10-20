"use client";

import { useState } from "react";
import { Panel } from "@/containers/Account/shared/panel";
import { buttonPrimary } from "@/containers/Account/styles";
import { fieldClass, labelClass } from "@/containers/Admin/Teams/styles";
import { joinTournamentWithCodeAction } from "@/features/tournaments/actions/tournament-manage.actions";

export function JoinTournamentWithCodeContainer({
  teamId,
}: {
  teamId: string;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await joinTournamentWithCodeAction(teamId, code);
    setMessage(res.message ?? null);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase text-zs-ink">
          Join Tournament with Code
        </h1>
        <p className="text-sm text-zs-muted">
          Enter the private tournament join code provided by the league
          commissioner.
        </p>
      </div>

      <Panel title="Join Code">
        <div>
          <label htmlFor="join-code" className={labelClass}>
            Tournament Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. TRN-XYZ123"
            className={fieldClass}
            required
            id="join-code"
            name="join-code"
          />
        </div>
      </Panel>

      {message && <p className="text-sm text-zs-lime">{message}</p>}

      <button type="submit" disabled={loading} className={buttonPrimary}>
        {loading ? "Submitting..." : "Request Entry"}
      </button>
    </form>
  );
}
