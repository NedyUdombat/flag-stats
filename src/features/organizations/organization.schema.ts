import { z } from "zod";
import { logoUrlField, nameField, optionalText } from "../entities/shared";

export const CreateOrganizationSchema = z.object({
  name: nameField,
  country: optionalText(60),
  description: optionalText(500),
  logoUrl: logoUrlField,
});
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;

export const readCreateOrganizationForm = (fd: FormData) => ({
  name: fd.get("name"),
  country: fd.get("country"),
  description: fd.get("description"),
  logoUrl: fd.get("logoUrl"),
});
