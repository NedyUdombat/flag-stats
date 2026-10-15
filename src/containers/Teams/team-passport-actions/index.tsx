"use client";

import { CheckIcon, DownloadIcon, Share2Icon } from "lucide-react";
import { useState } from "react";
import type { TeamPassportSummary } from "@/features/teams/team-passport.service";

// import type { TeamPassportSummary } from "@/features/teams/actions/team-passport.actions";

interface TeamPassportActionsProps {
  url: string;
  summary?: TeamPassportSummary;
}

export function TeamPassportActions({
  url,
  summary,
}: TeamPassportActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: summary?.name
            ? `${summary.name} - Team Profile`
            : "Team Profile",
          url,
        });
        return;
      } catch {
        // Fallback to clipboard if share sheet is canceled or unhandled
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    if (!summary) return;

    // Build CSV content
    const csvRows = [
      ["Team Summary Report"],
      ["Name", summary.name],
      ["Slug", summary.slug],
      ["Short Name", summary.shortName ?? ""],
      ["Country", summary.country ?? ""],
      ["Home City", summary.homeCity ?? ""],
      ["Home Ground", summary.homeGround ?? ""],
      ["Founded Year", summary.foundedYear ?? ""],
      ["Head Coach", summary.headCoachName ?? ""],
      ["Verified Status", summary.verified ? "Verified" : "Unverified"],
      [],
      ["Career Totals"],
      ["Matches Played", summary.careerTotals.matchesPlayed],
      ["Matches Won", summary.careerTotals.matchesWon],
      ["Matches Lost", summary.careerTotals.matchesLost],
      ["Matches Drawn", summary.careerTotals.matchesDrawn],
      ["Win Rate (%)", summary.careerTotals.winPct],
      ["Tournaments Played", summary.careerTotals.tournamentsPlayed],
      ["Active Roster Count", summary.careerTotals.activeAthletesCount],
      [],
      ["Active Roster"],
      ["Athlete Name", "Position", "Jersey #", "Status", "Joined At"],
      ...summary.roster.map((r) => [
        `"${r.fullName}"`,
        `"${r.primaryPosition ?? "Unassigned"}"`,
        r.jerseyNumber ?? "##",
        r.status,
        r.joinedAt ? new Date(r.joinedAt).toLocaleDateString() : "",
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${summary.slug}-passport-summary.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleShare}
        className="flex items-center gap-1.5 rounded-sm border border-white/10 px-4 py-2 font-mono text-[10px] tracking-wide text-white/70 uppercase transition-colors hover:border-brand-lime hover:text-brand-lime cursor-pointer"
      >
        {copied ? (
          <CheckIcon className="size-3.5 text-brand-lime" />
        ) : (
          <Share2Icon className="size-3.5" />
        )}
        {copied ? "Link copied" : "Share profile"}
      </button>
      {summary ? (
        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 rounded-sm border border-white/10 px-4 py-2 font-mono text-[10px] tracking-wide text-white/70 uppercase transition-colors hover:border-accent-gold hover:text-accent-gold cursor-pointer"
        >
          <DownloadIcon className="size-3.5" />
          Export CSV
        </button>
      ) : null}
    </div>
  );
}
