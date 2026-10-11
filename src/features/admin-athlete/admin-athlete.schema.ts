import { z } from "zod";
import { GENDERS, POSITIONS } from "@/features/athletes/athlete.constants";
import { ageFromDob } from "@/lib/age";

export const CreateUnclaimedAthleteSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the athlete's full name.").max(80),
  dateOfBirth: z.iso.date({ error: "Enter a date of birth." }).refine((d) => {
    const age = ageFromDob(d);
    return age !== null && age >= 0 && age <= 100;
  }, "Enter a valid date of birth."),
  gender: z.enum(GENDERS, { error: "Choose a gender." }),
  primaryPosition: z.enum(POSITIONS, { error: "Choose a position." }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.")),
});

export const EditUnclaimedAthleteSchema = CreateUnclaimedAthleteSchema.omit({
  email: true,
});

export type CreateUnclaimedAthleteInput = z.infer<
  typeof CreateUnclaimedAthleteSchema
>;

export const readAdminAthleteForm = (fd: FormData) => ({
  fullName: fd.get("fullName"),
  dateOfBirth: fd.get("dateOfBirth"),
  gender: fd.get("gender"),
  primaryPosition: fd.get("primaryPosition"),
  email: fd.get("email"),
});
