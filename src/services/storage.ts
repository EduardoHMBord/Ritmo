import { INITIAL_APP_DATA } from "../app/initialData";
import type {
  AccessibilityPreferences,
  Activity,
  AppData,
  DailyProgress,
  Routine,
  Subtask,
  Weekday,
} from "../types";

export const STORAGE_KEY = "ritmo:data:v1";

const VALID_WEEKDAYS: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export type LoadResult =
  | { status: "ok"; data: AppData }
  | { status: "empty" }
  | { status: "invalid"; message: string }
  | { status: "incompatible"; message: string }
  | { status: "storage-error"; message: string };

export type SaveResult =
  | { status: "ok" }
  | { status: "storage-error"; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isWeekday(value: unknown): value is Weekday {
  return isString(value) && (VALID_WEEKDAYS as string[]).includes(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function parseSubtask(value: unknown): Subtask | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.id)) return null;
  if (!isString(value.title) || value.title.trim().length === 0) return null;
  if (!isNumber(value.order)) return null;

  return {
    id: value.id,
    title: value.title,
    order: value.order,
  };
}

function parseActivity(value: unknown): Activity | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.id)) return null;
  if (!isString(value.title) || value.title.trim().length === 0) return null;
  if (!isNumber(value.order)) return null;
  if (!Array.isArray(value.subtasks)) return null;

  const subtasks: Subtask[] = [];
  for (const subtaskValue of value.subtasks) {
    const subtask = parseSubtask(subtaskValue);
    if (!subtask) return null;
    subtasks.push(subtask);
  }

  const description =
    value.description === undefined
      ? undefined
      : isString(value.description)
        ? value.description
        : null;
  const scheduledTime =
    value.scheduledTime === undefined
      ? undefined
      : isString(value.scheduledTime)
        ? value.scheduledTime
        : null;
  const icon =
    value.icon === undefined
      ? undefined
      : isString(value.icon)
        ? value.icon
        : null;

  if (description === null || scheduledTime === null || icon === null) {
    return null;
  }

  return {
    id: value.id,
    title: value.title,
    description: description && description.trim().length > 0 ? description : undefined,
    scheduledTime:
      scheduledTime && scheduledTime.trim().length > 0 ? scheduledTime : undefined,
    icon: icon && icon.trim().length > 0 ? icon : undefined,
    order: value.order,
    subtasks,
  };
}

function parseRoutine(value: unknown): Routine | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.id)) return null;
  if (!isString(value.name) || value.name.trim().length === 0) return null;
  if (!Array.isArray(value.weekdays) || value.weekdays.length === 0) return null;
  if (!value.weekdays.every(isWeekday)) return null;
  if (!Array.isArray(value.activities)) return null;
  if (!isString(value.createdAt)) return null;
  if (!isString(value.updatedAt)) return null;

  const activities: Activity[] = [];
  for (const activityValue of value.activities) {
    const activity = parseActivity(activityValue);
    if (!activity) return null;
    activities.push(activity);
  }

  const description =
    value.description === undefined
      ? undefined
      : isString(value.description)
        ? value.description
        : null;
  if (description === null) return null;

  return {
    id: value.id,
    name: value.name,
    description: description && description.trim().length > 0 ? description : undefined,
    weekdays: value.weekdays as Weekday[],
    activities,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function parseDailyProgress(value: unknown): DailyProgress | null {
  if (!isRecord(value)) return null;
  if (!isString(value.date) || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) {
    return null;
  }
  if (!isNonEmptyString(value.routineId)) return null;
  if (!isStringArray(value.completedActivityIds)) return null;
  if (!isStringArray(value.completedSubtaskIds)) return null;

  return {
    date: value.date,
    routineId: value.routineId,
    completedActivityIds: value.completedActivityIds,
    completedSubtaskIds: value.completedSubtaskIds,
  };
}

function parsePreferences(value: unknown): AccessibilityPreferences | null {
  if (!isRecord(value)) return null;

  const fontSize = value.fontSize;
  const contrast = value.contrast;
  const spacing = value.spacing;
  const reducedMotion = value.reducedMotion;

  if (fontSize !== "normal" && fontSize !== "large" && fontSize !== "extra-large") {
    return null;
  }
  if (contrast !== "standard" && contrast !== "high") {
    return null;
  }
  if (spacing !== "standard" && spacing !== "increased") {
    return null;
  }
  if (!isBoolean(reducedMotion)) {
    return null;
  }

  return { fontSize, contrast, spacing, reducedMotion };
}

export function parseAppData(
  value: unknown,
): AppData | { incompatible: true } | null {
  if (!isRecord(value)) return null;

  if (!isNumber(value.schemaVersion)) return null;
  if (value.schemaVersion !== 1) {
    return { incompatible: true };
  }

  if (!Array.isArray(value.routines)) return null;
  if (!Array.isArray(value.dailyProgress)) return null;

  const routines: Routine[] = [];
  for (const routineValue of value.routines) {
    const routine = parseRoutine(routineValue);
    if (!routine) return null;
    routines.push(routine);
  }

  const dailyProgress: DailyProgress[] = [];
  for (const progressValue of value.dailyProgress) {
    const progress = parseDailyProgress(progressValue);
    if (!progress) return null;
    dailyProgress.push(progress);
  }

  const preferences = parsePreferences(value.preferences);
  if (!preferences) return null;

  return {
    schemaVersion: 1,
    routines,
    dailyProgress,
    preferences,
  };
}

function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadAppData(): LoadResult {
  const storage = getStorage();
  if (!storage) {
    return {
      status: "storage-error",
      message:
        "Não foi possível acessar o armazenamento local do navegador.",
    };
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) {
      return { status: "empty" };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        status: "invalid",
        message:
          "Os dados salvos no navegador estão em formato inválido e não puderam ser lidos.",
      };
    }

    const data = parseAppData(parsed);
    if (!data) {
      return {
        status: "invalid",
        message:
          "Os dados salvos no navegador estão incompletos ou em um formato inválido.",
      };
    }

    if ("incompatible" in data) {
      return {
        status: "incompatible",
        message:
          "Os dados salvos foram criados em uma versão incompatível do aplicativo.",
      };
    }

    return { status: "ok", data };
  } catch {
    return {
      status: "storage-error",
      message:
        "Ocorreu um erro ao tentar ler os dados salvos no navegador.",
    };
  }
}

export function saveAppData(data: AppData): SaveResult {
  const storage = getStorage();
  if (!storage) {
    return {
      status: "storage-error",
      message:
        "Não foi possível acessar o armazenamento local para salvar os dados.",
    };
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { status: "ok" };
  } catch {
    return {
      status: "storage-error",
      message:
        "Não foi possível salvar os dados no armazenamento local do navegador.",
    };
  }
}

export function clearAppDataStorage(): SaveResult {
  const storage = getStorage();
  if (!storage) {
    return {
      status: "storage-error",
      message:
        "Não foi possível acessar o armazenamento local do navegador.",
    };
  }

  try {
    storage.removeItem(STORAGE_KEY);
    return { status: "ok" };
  } catch {
    return {
      status: "storage-error",
      message:
        "Não foi possível limpar os dados salvos no navegador.",
    };
  }
}

export function createInitialAppData(): AppData {
  return structuredClone(INITIAL_APP_DATA);
}
