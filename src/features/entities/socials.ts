import { z } from "zod";

export const SOCIAL_PLATFORMS = ["instagram", "tiktok", "twitter", "youtube", "facebook"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram", tiktok: "TikTok", twitter: "X / Twitter", youtube: "YouTube", facebook: "Facebook",
};

const handle = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().replace(/^@/, "") || undefined : undefined),
  z.string().regex(/^[A-Za-z0-9._]{1,30}$/, "Usernames only: letters, numbers, . and _").optional(),
);
export const socialsSchema = z.object({
  instagram: handle, tiktok: handle, twitter: handle, youtube: handle, facebook: handle,
});
export type Socials = z.infer<typeof socialsSchema>;

export const readSocialsFromForm = (fd: FormData) =>
  Object.fromEntries(SOCIAL_PLATFORMS.map((s) => [s, fd.get(`social_${s}`)]));

export const socialLinksFrom = (s: Socials) =>
  Object.fromEntries(SOCIAL_PLATFORMS.flatMap((p) => (s[p] ? [[p, s[p]]] : [])));