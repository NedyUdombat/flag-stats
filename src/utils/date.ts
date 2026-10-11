import { format, parseISO } from "date-fns";

export const fmtDate = (iso: string) => format(parseISO(iso), "dd MMM yyyy");
