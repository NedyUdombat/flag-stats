export const LEAGUE_TINTS = [
  "bg-gradient-to-br from-stone-400/80 via-stone-900 to-black text-stone-200",
  "bg-gradient-to-br from-orange-400/80 via-amber-950 to-stone-950 text-orange-100",
  "bg-gradient-to-br from-violet-400/80 via-purple-950 to-black text-violet-100",
  "bg-gradient-to-br from-rose-400/80 via-red-950 to-black text-rose-100",
  "bg-gradient-to-br from-emerald-600/80 via-slate-900 to-black text-emerald-200",
  "bg-gradient-to-br from-indigo-400/80 via-slate-900 to-stone-950 text-indigo-100",
  "bg-gradient-to-br from-amber-600/80 via-stone-900 to-black text-amber-200",
  "bg-gradient-to-br from-sky-500/80 via-slate-950 to-black text-sky-100",
  "bg-gradient-to-br from-purple-600/80 via-stone-950 to-black text-purple-200",
  "bg-gradient-to-br from-teal-600/80 via-slate-900 to-black text-teal-200",
  "bg-gradient-to-br from-pink-600/80 via-purple-950 to-stone-950 text-pink-200",
  "bg-gradient-to-br from-lime-600/80 via-neutral-950 to-black text-lime-200",
];

export function getLeagueTint(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % LEAGUE_TINTS.length;
  return LEAGUE_TINTS[index];
}
