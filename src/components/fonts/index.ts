import { Barlow_Condensed, DM_Mono, DM_Sans } from "next/font/google";

/** Condensed athletic display face for headings, team names and big numbers. */
export const displayFont = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-zs-display",
  display: "swap",
});

/** Monospace for scores, timestamps, referee/meta lines — the "ledger" voice. */
export const dataFont = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-zs-data",
  display: "swap",
});

/** Sans-serif for everything else. */
export const dmSansFont = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-zs-sans",
  display: "swap",
});
