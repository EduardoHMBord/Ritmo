import { useEffect, useState } from "react";
import type { Activity, AppData, Routine, Subtask, Weekday } from "../types";
import { createId } from "../utils/id";
import { moveItem, withSequentialOrder } from "../utils/order";
import { normalizeText } from "../utils/validation";
import {
  cleanupDailyProgress,
  toggleActivityCompletion,
  toggleSubtaskCompletion,
} from "../utils/progress";
import {
  clearAppDataStorage,
  createInitialAppData,
  loadAppData,
  saveAppData,
  type LoadResult,
} from "../services/storage";

type RoutineInput = {
  name: string;
  description: string;
  weekdays: Weekday[];
};

type ActivityInput = {
  title: string;
  description: string;
  scheduledTime: string;
  icon: string;
};

type LoadError = {
  status: Exclude<LoadResult["status"], "ok" | "empty">;
  message: string;
};

type BootState = {
  appData: AppData;
  loadState: "ready" | "error";
  loadError: LoadError | null;
  canPersist: boolean;
};

function toOptionalText(value: string): string | undefined {
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : undefined;
}

function updateRoutineInData(
  data: AppData,
  routineId: string,
  updater: (routine: Routine) => Routine,
): AppData {
  return {
    ...data,
    routines: data.routines.map((routine) =>
      routine.id === routineId ? updater(routine) : routine,
    ),
  };
}

function getBootStateFromResult(result: LoadResult): BootState {
  if (result.status === "ok") {
    return {
      appData: {
        ...result.data,
        dailyProgress: cleanupDailyProgress(
          result.data.dailyProgress,
          result.data.routines,
        ),
      },
      loadState: "ready",
      loadError: null,
      canPersist: true,
    };
  }

  if (result.status === "empty") {
    return {
      appData: createInitialAppData(),
      loadState: "ready",
      loadError: null,
      canPersist: true,
    };
  }

  return {
    appData: createInitialAppData(),
    loadState: "error",
    loadError: { status: result.status, message: result.message },
    canPersist: false,
  };
}

export function useAppState() {
  const [initialBoot] = useState<BootState>(() =>
    getBootStateFromResult(loadAppData()),
  );
  const [appData, setAppData] = useState<AppData>(initialBoot.appData);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    initialBoot.loadState,
  );
  const [loadError, setLoadError] = useState<LoadError | null>(
    initialBoot.loadError,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [canPersist, setCanPersist] = useState(initialBoot.canPersist);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(
    null,
  );

  function applyLoadResult(result: LoadResult): void {
    const boot = getBootStateFromResult(result);
    setAppData(boot.appData);
    setLoadState(boot.loadState);
    setLoadError(boot.loadError);
    setCanPersist(boot.canPersist);
    setSaveError(null);
  }

  useEffect(() => {
    if (!canPersist || loadState !== "ready") {
      return;
    }

    const result = saveAppData(appData);
    const nextSaveError =
      result.status === "storage-error" ? result.message : null;
    queueMicrotask(() => {
      setSaveError((previous) =>
        previous === nextSaveError ? previous : nextSaveError,
      );
    });
  }, [appData, canPersist, loadState]);

  const selectedRoutine =
    appData.routines.find((routine) => routine.id === selectedRoutineId) ??
    null;

  function retryLoad(): void {
    setLoadState("loading");
    const result = loadAppData();
    applyLoadResult(result);
  }

  function resetAppData(): void {
    clearAppDataStorage();
    setAppData(createInitialAppData());
    setSelectedRoutineId(null);
    setLoadError(null);
    setSaveError(null);
    setLoadState("ready");
    setCanPersist(true);
  }

  function updateAppData(updater: (current: AppData) => AppData): void {
    setAppData((current) => {
      const next = updater(current);
      return {
        ...next,
        dailyProgress: cleanupDailyProgress(next.dailyProgress, next.routines),
      };
    });
  }

  function createRoutine(input: RoutineInput): void {
    const timestamp = new Date().toISOString();
    const newRoutine: Routine = {
      id: createId(),
      name: normalizeText(input.name),
      description: toOptionalText(input.description),
      weekdays: [...input.weekdays],
      activities: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    updateAppData((current) => ({
      ...current,
      routines: [...current.routines, newRoutine],
    }));
  }

  function updateRoutine(routineId: string, input: RoutineInput): void {
    const timestamp = new Date().toISOString();
    updateAppData((current) =>
      updateRoutineInData(current, routineId, (routine) => ({
        ...routine,
        name: normalizeText(input.name),
        description: toOptionalText(input.description),
        weekdays: [...input.weekdays],
        updatedAt: timestamp,
      })),
    );
  }

  function deleteRoutine(routineId: string): void {
    updateAppData((current) => ({
      ...current,
      routines: current.routines.filter((routine) => routine.id !== routineId),
      dailyProgress: current.dailyProgress.filter(
        (entry) => entry.routineId !== routineId,
      ),
    }));
    setSelectedRoutineId((current) => (current === routineId ? null : current));
  }

  function openRoutine(routineId: string): void {
    setSelectedRoutineId(routineId);
  }

  function closeRoutine(): void {
    setSelectedRoutineId(null);
  }

  function createActivity(routineId: string, input: ActivityInput): void {
    const timestamp = new Date().toISOString();
    updateAppData((current) =>
      updateRoutineInData(current, routineId, (routine) => {
        const newActivity: Activity = {
          id: createId(),
          title: normalizeText(input.title),
          description: toOptionalText(input.description),
          scheduledTime: toOptionalText(input.scheduledTime),
          icon: toOptionalText(input.icon),
          order: routine.activities.length,
          subtasks: [],
        };

        return {
          ...routine,
          activities: [...routine.activities, newActivity],
          updatedAt: timestamp,
        };
      }),
    );
  }

  function updateActivity(
    routineId: string,
    activityId: string,
    input: ActivityInput,
  ): void {
    const timestamp = new Date().toISOString();
    updateAppData((current) =>
      updateRoutineInData(current, routineId, (routine) => ({
        ...routine,
        activities: routine.activities.map((activity) =>
          activity.id === activityId
            ? {
                ...activity,
                title: normalizeText(input.title),
                description: toOptionalText(input.description),
                scheduledTime: toOptionalText(input.scheduledTime),
                icon: toOptionalText(input.icon),
              }
            : activity,
        ),
        updatedAt: timestamp,
      })),
    );
  }

  function deleteActivity(routineId: string, activityId: string): void {
    const timestamp = new Date().toISOString();
    updateAppData((current) =>
      updateRoutineInData(current, routineId, (routine) => ({
        ...routine,
        activities: withSequentialOrder(
          routine.activities.filter((activity) => activity.id !== activityId),
        ),
        updatedAt: timestamp,
      })),
    );
  }

  function moveActivity(
    routineId: string,
    activityId: string,
    direction: "up" | "down",
  ): void {
    const timestamp = new Date().toISOString();
    updateAppData((current) =>
      updateRoutineInData(current, routineId, (routine) => {
        const fromIndex = routine.activities.findIndex(
          (activity) => activity.id === activityId,
        );
        if (fromIndex === -1) {
          return routine;
        }
        const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
        const reordered = moveItem(routine.activities, fromIndex, toIndex);
        if (reordered === routine.activities) {
          return routine;
        }
        return {
          ...routine,
          activities: withSequentialOrder(reordered),
          updatedAt: timestamp,
        };
      }),
    );
  }

  function createSubtask(
    routineId: string,
    activityId: string,
    title: string,
  ): void {
    const timestamp = new Date().toISOString();
    updateAppData((current) =>
      updateRoutineInData(current, routineId, (routine) => ({
        ...routine,
        activities: routine.activities.map((activity) => {
          if (activity.id !== activityId) {
            return activity;
          }
          const newSubtask: Subtask = {
            id: createId(),
            title: normalizeText(title),
            order: activity.subtasks.length,
          };
          return {
            ...activity,
            subtasks: [...activity.subtasks, newSubtask],
          };
        }),
        updatedAt: timestamp,
      })),
    );
  }

  function updateSubtask(
    routineId: string,
    activityId: string,
    subtaskId: string,
    title: string,
  ): void {
    const timestamp = new Date().toISOString();
    updateAppData((current) =>
      updateRoutineInData(current, routineId, (routine) => ({
        ...routine,
        activities: routine.activities.map((activity) =>
          activity.id === activityId
            ? {
                ...activity,
                subtasks: activity.subtasks.map((subtask) =>
                  subtask.id === subtaskId
                    ? { ...subtask, title: normalizeText(title) }
                    : subtask,
                ),
              }
            : activity,
        ),
        updatedAt: timestamp,
      })),
    );
  }

  function deleteSubtask(
    routineId: string,
    activityId: string,
    subtaskId: string,
  ): void {
    const timestamp = new Date().toISOString();
    updateAppData((current) =>
      updateRoutineInData(current, routineId, (routine) => ({
        ...routine,
        activities: routine.activities.map((activity) =>
          activity.id === activityId
            ? {
                ...activity,
                subtasks: withSequentialOrder(
                  activity.subtasks.filter((subtask) => subtask.id !== subtaskId),
                ),
              }
            : activity,
        ),
        updatedAt: timestamp,
      })),
    );
  }

  function moveSubtask(
    routineId: string,
    activityId: string,
    subtaskId: string,
    direction: "up" | "down",
  ): void {
    const timestamp = new Date().toISOString();
    updateAppData((current) =>
      updateRoutineInData(current, routineId, (routine) => ({
        ...routine,
        activities: routine.activities.map((activity) => {
          if (activity.id !== activityId) {
            return activity;
          }
          const fromIndex = activity.subtasks.findIndex(
            (subtask) => subtask.id === subtaskId,
          );
          if (fromIndex === -1) {
            return activity;
          }
          const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
          const reordered = moveItem(activity.subtasks, fromIndex, toIndex);
          if (reordered === activity.subtasks) {
            return activity;
          }
          return {
            ...activity,
            subtasks: withSequentialOrder(reordered),
          };
        }),
        updatedAt: timestamp,
      })),
    );
  }

  function toggleRoutineActivityCompletion(
    routineId: string,
    activityId: string,
    date: string,
  ): void {
    updateAppData((current) => {
      const routine = current.routines.find((item) => item.id === routineId);
      if (!routine) {
        return current;
      }
      return {
        ...current,
        dailyProgress: toggleActivityCompletion(
          current.dailyProgress,
          date,
          routine,
          activityId,
        ),
      };
    });
  }

  function toggleRoutineSubtaskCompletion(
    routineId: string,
    subtaskId: string,
    date: string,
  ): void {
    updateAppData((current) => ({
      ...current,
      dailyProgress: toggleSubtaskCompletion(
        current.dailyProgress,
        date,
        routineId,
        subtaskId,
      ),
    }));
  }

  return {
    appData,
    loadState,
    loadError,
    saveError,
    routines: appData.routines,
    dailyProgress: appData.dailyProgress,
    preferences: appData.preferences,
    selectedRoutine,
    selectedRoutineId,
    retryLoad,
    resetAppData,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    openRoutine,
    closeRoutine,
    createActivity,
    updateActivity,
    deleteActivity,
    moveActivity,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    moveSubtask,
    toggleRoutineActivityCompletion,
    toggleRoutineSubtaskCompletion,
  };
}
