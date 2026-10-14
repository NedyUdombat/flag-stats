import { z } from "zod";
import { POSITIONS } from "@/features/athletes/athlete.constants";

export const RosterEntrySchema = z.object({
  athleteId: z.uuid("Choose an athlete."),
  jerseyNumber: z
    .number({ error: "Enter a jersey number." })
    .int("Enter a whole number.")
    .min(0, "Jersey numbers run from 0 to 99.")
    .max(99, "Jersey numbers run from 0 to 99."),
  position: z.enum(POSITIONS, { error: "Choose a position." }),
});
export const RosterEntryEditSchema = RosterEntrySchema.omit({
  athleteId: true,
});
