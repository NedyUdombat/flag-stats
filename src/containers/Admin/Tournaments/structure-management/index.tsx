"use client";

import { useState } from "react";
import { Panel } from "@/containers/Account/shared/panel";
import { buttonPrimary, buttonSecondary } from "@/containers/Account/styles";
import {
  generateFixturesAction,
  rotateJoinCodeAction,
} from "@/features/tournaments/actions/tournament-manage.actions";

export function StructureManagementContainer({
  tournament,
  stages,
  initialJoinCode,
}: {
  tournament: any;
  stages: any[];
  initialJoinCode: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [joinCode, _setJoinCode] = useState(initialJoinCode);

  async function handleGenerate(stageId: string) {
    setLoading(true);
    setMessage(null);
    const res = await generateFixturesAction(
      tournament.id,
      stageId,
      tournament.start_date,
    );
    setMessage(res.message ?? null);
    setLoading(false);
  }

  async function handleRotateCode() {
    setLoading(true);
    const res = await rotateJoinCodeAction(tournament.id);
    if (res.status === "success") {
      // reload or update state
      window.location.reload();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase text-zs-ink">
          Structure & Fixtures: {tournament.name}
        </h1>
        <p className="text-sm text-zs-muted">
          Manage tournament stages, automatic fixture generation, and join
          codes.
        </p>
      </div>

      <Panel title="Tournament Join Code">
        <div className="flex items-center gap-4">
          <div className="font-mono text-xl font-bold bg-zs-raised px-4 py-2 border border-zs-line">
            {joinCode ?? "None Generated"}
          </div>
          <button
            type="button"
            onClick={handleRotateCode}
            disabled={loading}
            className={buttonSecondary}
          >
            Rotate / Generate Code
          </button>
        </div>
      </Panel>

      <Panel title="Stages & Automated Generation">
        <div className="space-y-4">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="border border-zs-line p-4 bg-zs-panel flex items-center justify-between"
            >
              <div>
                <h3 className="font-display font-bold uppercase">
                  {stage.name}
                </h3>
                <p className="text-xs text-zs-muted">
                  Type: {stage.stage_type}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleGenerate(stage.id)}
                disabled={loading}
                className={buttonPrimary}
              >
                {loading ? "Generating..." : "Generate Fixtures"}
              </button>
            </div>
          ))}
        </div>
        {message && <p className="mt-4 text-sm text-zs-lime">{message}</p>}
      </Panel>
    </div>
  );
}
