import type { Weekday } from "../types";

export const WEEKDAY_OPTIONS: { value: Weekday; label: string }[] = [
  { value: "monday", label: "Segunda-feira" },
  { value: "tuesday", label: "Terça-feira" },
  { value: "wednesday", label: "Quarta-feira" },
  { value: "thursday", label: "Quinta-feira" },
  { value: "friday", label: "Sexta-feira" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

const WEEKDAY_LABELS = new Map(
  WEEKDAY_OPTIONS.map((option) => [option.value, option.label]),
);

export function formatWeekdays(weekdays: Weekday[]): string {
  return WEEKDAY_OPTIONS.filter((option) => weekdays.includes(option.value))
    .map((option) => option.label)
    .join(", ");
}

export function getWeekdayLabel(weekday: Weekday): string {
  return WEEKDAY_LABELS.get(weekday) ?? weekday;
}
