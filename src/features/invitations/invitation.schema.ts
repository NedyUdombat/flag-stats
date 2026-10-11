import { z } from "zod";

export const ResendSchema = z.object({
  athleteId: z.uuid(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.")),
});
