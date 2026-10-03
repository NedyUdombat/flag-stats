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

export function initials(name: string | null, email: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  return (
    parts.length > 1
      ? parts[0][0] + parts[parts.length - 1][0]
      : source.slice(0, 2)
  ).toUpperCase();
}
