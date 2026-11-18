import type { Weekday } from "../types";

export function normalizeText(value: string): string {
  return value.trim();
}

export function hasNonEmptyText(value: string): boolean {
  return normalizeText(value).length > 0;
}

export function hasAtLeastOneWeekday(weekdays: Weekday[]): boolean {
  return weekdays.length > 0;
}
