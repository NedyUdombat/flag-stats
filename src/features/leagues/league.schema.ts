import { z } from "zod";
import { nameField, optionalText } from "../entities/shared";

export const CreateLeagueSchema = z.object({
  name: nameField,
  region: optionalText(60),
  country: optionalText(60),
});
export type CreateLeagueInput = z.infer<typeof CreateLeagueSchema>;

export const readCreateLeagueForm = (fd: FormData) => ({
  name: fd.get("name"),
  region: fd.get("region"),
  country: fd.get("country"),
});
