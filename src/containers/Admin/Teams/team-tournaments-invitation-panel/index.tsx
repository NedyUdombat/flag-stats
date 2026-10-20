"use client";

import { useState } from "react";
import { Panel } from "@/containers/Account/shared/panel";
import { buttonPrimary } from "@/containers/Account/styles";
import { acceptTournamentInvitationAction } from "@/features/tournaments/actions/tournament-registration.actions";

interface Invitation {
  id: string;
  status: string;
  tournament: {
    id: string;
    name: string;
    season: string;
    start_date: string;
  } | null;
}

export function TeamInvitationsPanel({
  teamId,
  invitations,
}: {
  teamId: string;
  invitations: Invitation[];
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleAccept(registrationId: string, tournamentId: string) {
    setLoadingId(registrationId);
    setMessage(null);

    const res = await acceptTournamentInvitationAction(
      registrationId,
      teamId,
      tournamentId
    );

    setMessage(res.message);
    setLoadingId(null);
  }

  if (invitations.length === 0) return null;

  return (
    <Panel
      title="Tournament Invitations"
      description="You have been invited to join the following tournaments."
    >
      <ul className="divide-y divide-zs-line border border-zs-line">
        {invitations.map((inv) => {
          if (!inv.tournament) return null;
          const isHandling = loadingId === inv.id;

          return (
            <li
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-4 px-4 py-3"
            >
              <div>
                <p className="font-display text-base font-bold text-zs-ink uppercase">
                  {inv.tournament.name}
                </p>
                <p className="font-data text-xs text-zs-muted">
                  Season: {inv.tournament.season} · Starts: {inv.tournament.start_date}
                </p>
              </div>
              <button
                type="button"
                disabled={isHandling}
                onClick={() => handleAccept(inv.id, inv.tournament!.id)}
                className={buttonPrimary}
              >
                {isHandling ? "Accepting…" : "Accept Invitation"}
              </button>
            </li>
          );
        })}
      </ul>
      {message && <p className="mt-3 text-xs text-zs-lime">{message}</p>}
    </Panel>
  );
}