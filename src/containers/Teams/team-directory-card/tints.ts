export const TEAMS_TINTS = [
  "bg-gradient-to-br from-pink-500/80 via-rose-950 to-stone-950 text-pink-200",
  "bg-gradient-to-br from-sky-400/80 via-indigo-950 to-black text-sky-200",
  "bg-gradient-to-br from-emerald-400/80 via-emerald-950 to-stone-950 text-emerald-100",
  "bg-gradient-to-br from-purple-500/80 via-indigo-950 to-black text-purple-200",
  "bg-gradient-to-br from-amber-400/80 via-orange-950 to-black text-amber-100",
  "bg-gradient-to-br from-teal-500/80 via-cyan-950 to-stone-950 text-teal-100",
  "bg-gradient-to-br from-red-500/80 via-rose-950 to-black text-red-200",
  "bg-gradient-to-br from-blue-400/80 via-blue-950 to-stone-950 text-blue-100",
  "bg-gradient-to-br from-lime-500/80 via-green-950 to-black text-lime-100",
  "bg-gradient-to-br from-fuchsia-400/80 via-purple-950 to-stone-950 text-fuchsia-100",
  "bg-gradient-to-br from-yellow-400/80 via-amber-950 to-black text-yellow-100",
  "bg-gradient-to-br from-cyan-500/80 via-teal-950 to-stone-950 text-cyan-100",
];

export function getTeamTint(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TEAMS_TINTS.length;
  return TEAMS_TINTS[index];
}
