export const TOURNAMENT_TINTS = [
  "border-amber-500/30 hover:border-amber-400 bg-gradient-to-br from-amber-500/10 via-neutral-950 to-stone-950",
  "border-cyan-400/30 hover:border-cyan-400 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-black",
  "border-emerald-500/30 hover:border-emerald-400 bg-gradient-to-br from-emerald-500/10 via-teal-950 to-black",
  "border-violet-500/30 hover:border-violet-400 bg-gradient-to-br from-violet-500/10 via-purple-950 to-black",
  "border-orange-500/30 hover:border-orange-400 bg-gradient-to-br from-orange-500/10 via-red-950 to-stone-950",
  "border-rose-500/30 hover:border-rose-400 bg-gradient-to-br from-rose-500/10 via-rose-950/40 to-black",
  "border-indigo-500/30 hover:border-indigo-400 bg-gradient-to-br from-indigo-500/10 via-indigo-950/40 to-stone-950",
  "border-sky-500/30 hover:border-sky-400 bg-gradient-to-br from-sky-500/10 via-blue-950/40 to-black",
  "border-fuchsia-500/30 hover:border-fuchsia-400 bg-gradient-to-br from-fuchsia-500/10 via-purple-950/40 to-zinc-950",
  "border-lime-500/30 hover:border-lime-400 bg-gradient-to-br from-lime-500/10 via-lime-950/45 to-neutral-950",
  "border-teal-500/30 hover:border-teal-400 bg-gradient-to-br from-teal-500/10 via-cyan-950/40 to-stone-950",
  "border-yellow-500/30 hover:border-yellow-400 bg-gradient-to-br from-yellow-500/10 via-amber-950/40 to-black",
  "border-pink-500/30 hover:border-pink-400 bg-gradient-to-br from-pink-500/10 via-rose-950/40 to-zinc-950",
];

export function getTournamentTint(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TOURNAMENT_TINTS[Math.abs(hash) % TOURNAMENT_TINTS.length];
}
