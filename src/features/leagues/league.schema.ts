import { z } from "zod";
import { countryField, nameField, optionalText } from "../entities/shared";

export const CreateLeagueSchema = z.object({
  name: nameField,
  region: optionalText(60),
  country: countryField,
});
export type CreateLeagueInput = z.infer<typeof CreateLeagueSchema>;

export const readCreateLeagueForm = (fd: FormData) => ({
  name: fd.get("name"),
  region: fd.get("region"),
  country: fd.get("country"),
});
