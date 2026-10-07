import { differenceInYears, isValid, parseISO } from "date-fns";

export function ageFromDob(dob: string, now = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;

  const birthDate = parseISO(dob);

  if (!isValid(birthDate)) return null;

  return differenceInYears(now, birthDate);
}

export function isMinor(dob: string): boolean {
  const age = ageFromDob(dob);
  return age !== null && age < 18;
}
