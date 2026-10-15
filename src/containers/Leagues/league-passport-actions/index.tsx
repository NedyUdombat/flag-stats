"use client";

import { CheckIcon, DownloadIcon, Share2Icon } from "lucide-react";
import { useState } from "react";
import type { LeaguePassportSummary } from "@/features/leagues/league-profile.service";

interface LeaguePassportActionsProps {
  url: string;
  summary?: LeaguePassportSummary;
}

export function LeaguePassportActions({
  url,
  summary,
}: LeaguePassportActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: summary?.name
            ? `${summary.name} - League Profile`
            : "League Profile",
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

    const csvRows = [
      ["League Passport Summary Report"],
      ["Name", summary.name],
      ["Slug", summary.slug],
      ["Short Code", summary.shortCode ?? ""],
      ["Commissioner / Lead", summary.commissionerName ?? ""],
      ["Country", summary.country ?? ""],
      ["Region", summary.region ?? ""],
      ["Competition Level", summary.competitionLevel ?? ""],
      ["Format", summary.format ?? ""],
      ["Rulebook URL", summary.rulebook ?? ""],
      ["Verified Status", summary.verified ? "Verified" : "Unverified"],
      [],
      ["Telemetry Totals"],
      ["Registered Clubs", summary.careerTotals.teamsCount],
      ["Tournaments Hosted", summary.careerTotals.tournamentsCount],
      ["Matches Logged", summary.careerTotals.matchesPlayed],
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
