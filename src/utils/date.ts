import { format, parseISO } from "date-fns";

export const fmtDate = (iso: string): string =>
  format(parseISO(iso), "dd MMM yyyy");

export const fmtDay = (iso: string): string =>
  format(parseISO(iso), "dd MMM yyyy");

export const fmtRange = (start: string, end: string): string => {
  return start === end ? fmtDay(start) : `${fmtDay(start)} to ${fmtDay(end)}`;
};

export const APP_TIMEZONE = "Africa/Lagos";
const OFFSET_MS = 60 * 60 * 1000;

export const lagosLocalToIso = (local: string): string => {
  return new Date(`${local}:00+01:00`).toISOString();
};

export const isoToLagosLocal = (iso: string): string => {
  const shiftedDate = new Date(new Date(iso).getTime() + OFFSET_MS);
  return format(shiftedDate, "yyyy-MM-dd'T'HH:mm");
};

export const fmtDateTime = (iso: string): string => {
  const date = parseISO(iso);

  const lagosDate = new Date(date.getTime() + OFFSET_MS);
  return format(lagosDate, "d MMM yyyy, HH:mm");
};
