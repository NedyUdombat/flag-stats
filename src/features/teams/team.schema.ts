import { z } from "zod";
import { logoUrlField, nameField, optionalText } from "../entities/shared";

export const CreateTeamSchema = z.object({
  name: nameField,
  homeCity: optionalText(60),
  country: optionalText(60),
  logoUrl: logoUrlField,
});
export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;

export const readCreateTeamForm = (fd: FormData) => ({
  name: fd.get("name"),
  homeCity: fd.get("homeCity"),
  country: fd.get("country"),
  logoUrl: fd.get("logoUrl"),
});
