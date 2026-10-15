const ROLE_LABELS: Record<string, string> = {
  platform_admin: "Platform admin",
  super_admin: "Platform admin",
  federation_admin: "Federation admin",
  league_admin: "League admin",
  team_coach: "Team coach",
};

export function roleLabel(role: string) {
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ");
}

export function initials(name: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "?";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length > 1) {
    return parts
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

const _tints = [
  "from-amber-300/70 to-stone-900",
  "from-yellow-500/70 to-black",
  "from-cyan-200/80 to-slate-700",
  "from-blue-400/80 to-slate-900",
  "from-rose-400/80 to-stone-900",
  "from-blue-300/80 to-orange-950",
  "from-yellow-300/80 to-black",
];
