"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/users/service";
import { isMinor } from "@/lib/age";
import { cleanupReplacedImage } from "@/lib/cloudinary/server";
import { logServerError } from "@/lib/errors";
import { rateKey, rateLimit } from "@/lib/rate-limit";
import { generateUniqueSlug, isUniqueViolation, isValidSlug } from "@/lib/slug";
import { createServerClient } from "@/lib/supabase/server";
import type { AthleteActionState } from "../athlete.constants";
import {
  type AthleteProfileInput,
  AthleteProfileSchema,
  buildSocialLinks,
  invalidResult,
  readAthleteForm,
} from "../athlete.schema";

const DUPLICATE_MESSAGE =
  "An athlete profile with this name and date of birth already exists and hasn't been claimed. Check your email for a claim invitation from your team or league. If the invitation has expired, ask your team admin to resend it.";

const GENERIC_ERROR = "Something went wrong. Please try again.";

function toColumns(i: AthleteProfileInput, minor: boolean) {
  return {
    full_name: i.fullName,
    date_of_birth: i.dateOfBirth,
    gender: i.gender,
    nationality: i.nationality ?? null,
    home_city: i.homeCity ?? null,
    positions: i.positions,
    height_cm: i.heightCm ?? null,
    weight_kg: i.weightKg ?? null,
    dominant_hand: i.dominantHand ?? null,
    started_playing_year: i.startedPlayingYear ?? null,
    preferred_jersey_number: i.preferredJerseyNumber ?? null,
    bio: i.bio ?? null,
    social_links: buildSocialLinks(i),
    visibility: i.visibility,
    photo_url: i.photoUrl ?? null,
    // Only ever set for minors, so an adult edit never wipes a consent record.
    ...(minor ? { parental_consent: true } : {}),
  };
}

function refresh() {
  revalidatePath("/account");
  revalidatePath("/admin/settings");
}

async function savePhone(athleteId: string, phone: string | undefined) {
  const supabase = await createServerClient();
  const { error } = phone
    ? await supabase.from("athlete_private").upsert({
        athlete_id: athleteId,
        contact_phone: phone,
        updated_at: new Date().toISOString(),
      })
    : await supabase
        .from("athlete_private")
        .delete()
        .eq("athlete_id", athleteId);
  if (error) logServerError("athlete.savePhone", error);
  return !error;
}

export async function createMyAthleteProfileAction(
  _prev: AthleteActionState,
  fd: FormData,
): Promise<AthleteActionState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Please sign in again." };

  const parsed = AthleteProfileSchema.safeParse(readAthleteForm(fd));
  if (!parsed.success) return invalidResult(parsed.error);
  const input = parsed.data;

  const minor = isMinor(input.dateOfBirth);
  if (minor && !input.parentalConsent) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        parentalConsent:
          "A parent or guardian must consent for athletes under 18.",
      },
    };
  }
  if (input.slug && !isValidSlug(input.slug)) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        slug: "Use 3-60 lowercase letters, numbers and dashes. Some words are reserved.",
      },
    };
  }

  const supabase = await createServerClient();

  const { data: existing } = await supabase
    .from("athletes")
    .select("id")
    .eq("profile_user_id", user.id)
    .maybeSingle();
  if (existing)
    return { status: "error", message: "You already have an athlete profile." };

  if (fd.get("confirmNotDuplicate") !== "on") {
    if (!(await rateLimit(rateKey("athlete-dup", user.id), 10, 3600))) {
      return {
        status: "error",
        message: "Too many attempts. Please try again later.",
      };
    }
    const { data: dup, error } = await supabase.rpc(
      "athlete_duplicate_exists",
      {
        p_name: input.fullName,
        p_dob: input.dateOfBirth,
      },
    );
    if (error)
      logServerError("athlete.duplicateCheck", error); // fail open
    else if (dup) return { status: "duplicate", message: DUPLICATE_MESSAGE };
  }

  const columns = toColumns(input, minor);
  let created: { id: string; slug: string } | null = null;

  for (let attempt = 0; attempt < 3 && !created; attempt++) {
    const slug =
      input.slug ??
      (await generateUniqueSlug(supabase, "athletes", input.fullName));
    const { data, error } = await supabase
      .from("athletes")
      .insert({
        ...columns,
        slug,
        profile_user_id: user.id,
        created_by: user.id,
      })
      .select("id, slug")
      .single();

    if (!error) {
      created = data;
    } else if (isUniqueViolation(error)) {
      if (input.slug) {
        return {
          status: "error",
          message: "Please fix the highlighted fields.",
          fieldErrors: { slug: "That Profile ID is taken. Try another." },
        };
      }
    } else {
      logServerError("athlete.create", error);
      return {
        status: "error",
        message: error.message.includes("Parental consent")
          ? error.message
          : GENERIC_ERROR,
      };
    }
  }
  if (!created) return { status: "error", message: GENERIC_ERROR };

  let message = "Athlete profile created.";
  if (
    input.contactPhone &&
    !(await savePhone(created.id, input.contactPhone))
  ) {
    message =
      "Profile created, but your phone number couldn't be saved. Add it by editing your profile.";
  }

  refresh();
  return { status: "success", message };
}

export async function updateMyAthleteProfileAction(
  _prev: AthleteActionState,
  fd: FormData,
): Promise<AthleteActionState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Please sign in again." };

  const parsed = AthleteProfileSchema.safeParse(readAthleteForm(fd));
  if (!parsed.success) return invalidResult(parsed.error);
  const input = parsed.data;

  const minor = isMinor(input.dateOfBirth);
  if (minor && !input.parentalConsent) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        parentalConsent:
          "A parent or guardian must consent for athletes under 18.",
      },
    };
  }

  const supabase = await createServerClient();

  const { data: before } = await supabase
    .from("athletes")
    .select("photo_url")
    .eq("profile_user_id", user.id)
    .maybeSingle();
  const { data, error } = await supabase
    .from("athletes")
    .update({
      ...toColumns(input, minor),
      updated_at: new Date().toISOString(),
    })
    .eq("profile_user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    logServerError("athlete.update", error);
    return {
      status: "error",
      message: error.message.includes("Parental consent")
        ? error.message
        : GENERIC_ERROR,
    };
  }
  if (!data)
    return {
      status: "error",
      message: "We couldn't find your athlete profile.",
    };

  if (!(await savePhone(data.id, input.contactPhone))) {
    return {
      status: "error",
      message: "Saved, but your phone number couldn't be updated. Try again.",
    };
  }

  await cleanupReplacedImage(before?.photo_url, input.photoUrl ?? null);

  refresh();
  return { status: "success", message: "Athlete profile updated." };
}
