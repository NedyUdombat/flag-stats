export const TINTS = [
  "bg-gradient-to-br from-amber-500/80 via-amber-900/60 to-stone-950 text-amber-200",
  "bg-gradient-to-br from-yellow-500/80 via-stone-900 to-black text-yellow-300",
  "bg-gradient-to-br from-cyan-400/80 via-slate-800 to-slate-950 text-cyan-200",
  "bg-gradient-to-br from-blue-500/80 via-slate-900 to-black text-blue-200",
  "bg-gradient-to-br from-rose-500/80 via-stone-900 to-black text-rose-200",
  "bg-gradient-to-br from-emerald-500/80 via-teal-950 to-black text-emerald-200",
  "bg-gradient-to-br from-violet-500/80 via-purple-950 to-black text-purple-200",
  "bg-gradient-to-br from-orange-500/80 via-red-950 to-stone-950 text-orange-200",
  "bg-gradient-to-br from-lime-400/80 via-neutral-900 to-black text-lime-200",
  "bg-gradient-to-br from-fuchsia-500/80 via-pink-950 to-black text-fuchsia-200",
  "bg-gradient-to-br from-indigo-500/80 via-slate-900 to-black text-indigo-200",
  "bg-gradient-to-br from-teal-400/80 via-slate-900 to-black text-teal-200",
];

export function getTint(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TINTS.length;
  return TINTS[index];
}
