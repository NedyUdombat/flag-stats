import { Barlow_Condensed, JetBrains_Mono } from "next/font/google";

/** Condensed athletic display face for headings, team names and big numbers. */
export const displayFont = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-zs-display",
  display: "swap",
});

/** Monospace for scores, timestamps, referee/meta lines — the "ledger" voice. */
export const dataFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-zs-data",
  display: "swap",
});
