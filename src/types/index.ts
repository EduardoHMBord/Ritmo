export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type Subtask = {
  id: string;
  title: string;
  order: number;
};

export type Activity = {
  id: string;
  title: string;
  description?: string;
  scheduledTime?: string;
  icon?: string;
  order: number;
  subtasks: Subtask[];
};

export type Routine = {
  id: string;
  name: string;
  description?: string;
  weekdays: Weekday[];
  activities: Activity[];
  createdAt: string;
  updatedAt: string;
};

export type DailyProgress = {
  date: string;
  routineId: string;
  completedActivityIds: string[];
  completedSubtaskIds: string[];
};

export type AccessibilityPreferences = {
  fontSize: "normal" | "large" | "extra-large";
  contrast: "standard" | "high";
  spacing: "standard" | "increased";
  reducedMotion: boolean;
};

export type AppData = {
  schemaVersion: number;
  routines: Routine[];
  dailyProgress: DailyProgress[];
  preferences: AccessibilityPreferences;
};

export type AppView =
  | "home"
  | "routines"
  | "activities"
  | "focus"
  | "settings";
