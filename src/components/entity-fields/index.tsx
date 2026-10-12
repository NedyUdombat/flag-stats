/**
 * Placeholders until ImageUpload / CountrySelect are wired in: they keep the current
 * value in the form so saving never wipes the logo or country.
 */
export function LogoField({ value }: { value: string | null }) {
  return <input type="hidden" name="logoUrl" defaultValue={value ?? ""} />;
}
export function CountryField({ value }: { value: string | null }) {
  return <input type="hidden" name="country" defaultValue={value ?? ""} />;
}
