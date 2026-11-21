import type { Activity, DailyProgress, Routine } from "../types";

export function findDailyProgress(
  dailyProgress: DailyProgress[],
  date: string,
  routineId: string,
): DailyProgress | undefined {
  return dailyProgress.find(
    (entry) => entry.date === date && entry.routineId === routineId,
  );
}

export function getOrCreateDailyProgress(
  dailyProgress: DailyProgress[],
  date: string,
  routineId: string,
): { progress: DailyProgress; allProgress: DailyProgress[] } {
  const existing = findDailyProgress(dailyProgress, date, routineId);
  if (existing) {
    return { progress: existing, allProgress: dailyProgress };
  }

  const created: DailyProgress = {
    date,
    routineId,
    completedActivityIds: [],
    completedSubtaskIds: [],
  };

  return { progress: created, allProgress: [...dailyProgress, created] };
}

export function isActivityCompleted(
  activity: Activity,
  progress: DailyProgress | undefined,
): boolean {
  if (!progress) {
    return false;
  }

  if (activity.subtasks.length === 0) {
    return progress.completedActivityIds.includes(activity.id);
  }

  return activity.subtasks.every((subtask) =>
    progress.completedSubtaskIds.includes(subtask.id),
  );
}

export function countCompletedActivities(
  routine: Routine,
  progress: DailyProgress | undefined,
): number {
  return routine.activities.filter((activity) =>
    isActivityCompleted(activity, progress),
  ).length;
}

export function getRoutineProgressPercent(
  routine: Routine,
  progress: DailyProgress | undefined,
): number | null {
  if (routine.activities.length === 0) {
    return null;
  }

  const completedCount = countCompletedActivities(routine, progress);
  return Math.round((completedCount / routine.activities.length) * 100);
}

export function toggleActivityCompletion(
  dailyProgress: DailyProgress[],
  date: string,
  routine: Routine,
  activityId: string,
): DailyProgress[] {
  const activity = routine.activities.find((item) => item.id === activityId);
  if (!activity) {
    return dailyProgress;
  }

  if (activity.subtasks.length > 0) {
    return dailyProgress;
  }

  const { progress, allProgress } = getOrCreateDailyProgress(
    dailyProgress,
    date,
    routine.id,
  );
  const isCompleted = progress.completedActivityIds.includes(activityId);
  const updatedProgress: DailyProgress = {
    ...progress,
    completedActivityIds: isCompleted
      ? progress.completedActivityIds.filter((id) => id !== activityId)
      : [...progress.completedActivityIds, activityId],
  };

  return allProgress.map((entry) =>
    entry.date === date && entry.routineId === routine.id
      ? updatedProgress
      : entry,
  );
}

export function toggleSubtaskCompletion(
  dailyProgress: DailyProgress[],
  date: string,
  routineId: string,
  subtaskId: string,
): DailyProgress[] {
  const { progress, allProgress } = getOrCreateDailyProgress(
    dailyProgress,
    date,
    routineId,
  );
  const isCompleted = progress.completedSubtaskIds.includes(subtaskId);
  const updatedProgress: DailyProgress = {
    ...progress,
    completedSubtaskIds: isCompleted
      ? progress.completedSubtaskIds.filter((id) => id !== subtaskId)
      : [...progress.completedSubtaskIds, subtaskId],
  };

  return allProgress.map((entry) =>
    entry.date === date && entry.routineId === routineId
      ? updatedProgress
      : entry,
  );
}

export function cleanupDailyProgress(
  dailyProgress: DailyProgress[],
  routines: Routine[],
): DailyProgress[] {
  const routineMap = new Map(routines.map((routine) => [routine.id, routine]));

  return dailyProgress
    .filter((entry) => routineMap.has(entry.routineId))
    .map((entry) => {
      const routine = routineMap.get(entry.routineId);
      if (!routine) {
        return entry;
      }

      const activityIds = new Set(routine.activities.map((activity) => activity.id));
      const subtaskIds = new Set(
        routine.activities.flatMap((activity) =>
          activity.subtasks.map((subtask) => subtask.id),
        ),
      );
      const activitiesWithoutSubtasks = new Set(
        routine.activities
          .filter((activity) => activity.subtasks.length === 0)
          .map((activity) => activity.id),
      );

      return {
        ...entry,
        completedActivityIds: entry.completedActivityIds.filter(
          (id) => activityIds.has(id) && activitiesWithoutSubtasks.has(id),
        ),
        completedSubtaskIds: entry.completedSubtaskIds.filter((id) =>
          subtaskIds.has(id),
        ),
      };
    });
}
