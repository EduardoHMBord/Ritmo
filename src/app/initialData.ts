import type { AccessibilityPreferences, AppData } from "../types";

export const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  fontSize: "normal",
  contrast: "standard",
  spacing: "standard",
};

export const INITIAL_APP_DATA: AppData = {
  schemaVersion: 1,
  routines: [],
  dailyProgress: [],
  preferences: DEFAULT_PREFERENCES,
};
