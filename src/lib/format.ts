import { format, formatDistanceToNowStrict } from "date-fns";

export const formatDate = (value: string) => format(new Date(value), "dd MMM yyyy");
export const formatDateTime = (value: string) => format(new Date(value), "dd MMM yyyy, HH:mm");
export const formatRelative = (value: string) => formatDistanceToNowStrict(new Date(value), { addSuffix: true });
export const percent = (value: number, total: number) => Math.round((value / Math.max(total, 1)) * 100);
