import { format, parseISO } from "date-fns";

export const fmtDate = (iso: string): string =>
  format(parseISO(iso), "dd MMM yyyy");

export const fmtDay = (iso: string): string =>
  format(parseISO(iso), "dd MMM yyyy");

export const fmtRange = (start: string, end: string): string => {
  return start === end ? fmtDay(start) : `${fmtDay(start)} to ${fmtDay(end)}`;
};
