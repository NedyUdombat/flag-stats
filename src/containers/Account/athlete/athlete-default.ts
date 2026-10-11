import type { SOCIALS } from "@/features/athletes/athlete.constants";
import type { Tables } from "@/types/database/types";

export type AthleteFormInitial = {
  fullName: string;
  slug: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  homeCity: string;
  primaryPosition: string;
  secondaryPositions: string[];
  heightCm: string;
  weightKg: string;
  dominantHand: string;
  startedPlayingYear: string;
  preferredJerseyNumber: string;
  bio: string;
  socials: Record<(typeof SOCIALS)[number], string>;
  contactPhone: string;
  contactEmail: string;
  contactVisibility: string;
  visibility: string;
  parentalConsent: boolean;
  photoUrl: string | null;
};

const emptySocials = {
  instagram: "",
  tiktok: "",
  youtube: "",
  twitter: "",
  facebook: "",
};

export function emptyInitial(fullName: string | null): AthleteFormInitial {
  return {
    fullName: fullName ?? "",
    slug: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    homeCity: "",
    primaryPosition: "",
    secondaryPositions: [],
    heightCm: "",
    weightKg: "",
    dominantHand: "",
    startedPlayingYear: "",
    preferredJerseyNumber: "",
    bio: "",
    socials: emptySocials,
    contactPhone: "",
    contactEmail: "",
    contactVisibility: "private",
    visibility: "public",
    parentalConsent: false,
    photoUrl: null,
  };
}

export function toFormInitial(
  a: Tables<"athletes">,
  contact: { phone: string | null; email: string | null },
): AthleteFormInitial {
  const s = (a.social_links ?? {}) as Record<string, string>;
  return {
    fullName: a.full_name,
    slug: a.slug,
    dateOfBirth: a.date_of_birth ?? "",
    gender: a.gender ?? "",
    nationality: a.nationality ?? "",
    homeCity: a.home_city ?? "",
    primaryPosition: a.primary_position ?? "",
    secondaryPositions: a.secondary_positions,
    heightCm: a.height_cm?.toString() ?? "",
    weightKg: a.weight_kg?.toString() ?? "",
    dominantHand: a.dominant_hand ?? "",
    startedPlayingYear: a.started_playing_year?.toString() ?? "",
    preferredJerseyNumber: a.preferred_jersey_number?.toString() ?? "",
    bio: a.bio ?? "",
    socials: {
      instagram: s.instagram ?? "",
      tiktok: s.tiktok ?? "",
      youtube: s.youtube ?? "",
      twitter: s.twitter ?? "",
      facebook: s.facebook ?? "",
    },
    contactPhone: contact.phone ?? "",
    contactEmail: contact.email ?? "",
    contactVisibility: a.contact_visibility,
    visibility: a.visibility,
    parentalConsent: a.parental_consent,
    photoUrl: a.photo_url,
  };
}
