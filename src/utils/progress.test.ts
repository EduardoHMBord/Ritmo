import { describe, expect, it } from "vitest";
import { makeTestData } from "../test/fixtures";
import type { DailyProgress, Routine } from "../types";
import {
  cleanupDailyProgress,
  getRoutineProgressPercent,
  isActivityCompleted,
  toggleActivityCompletion,
  toggleSubtaskCompletion,
} from "./progress";

const DATE_A = "2026-11-21";
const DATE_B = "2026-11-22";

function getRoutine(): Routine {
  return makeTestData().routines[0];
}

function findProgress(
  entries: DailyProgress[],
  date: string,
): DailyProgress | undefined {
  return entries.find((entry) => entry.date === date);
}

describe("progresso diário", () => {
  it("conclui atividade sem etapas apenas no dia selecionado", () => {
    const routine = getRoutine();
    const initial: DailyProgress[] = [];

    const afterA = toggleActivityCompletion(
      initial,
      DATE_A,
      routine,
      "ativ-sem-etapas",
    );
    const afterB = toggleActivityCompletion(
      afterA,
      DATE_B,
      routine,
      "ativ-sem-etapas",
    );

    expect(
      isActivityCompleted(
        routine.activities[0],
        findProgress(afterA, DATE_A),
      ),
    ).toBe(true);
    expect(
      isActivityCompleted(
        routine.activities[0],
        findProgress(afterA, DATE_B),
      ),
    ).toBe(false);
    expect(
      isActivityCompleted(
        routine.activities[0],
        findProgress(afterB, DATE_B),
      ),
    ).toBe(true);
    expect(
      isActivityCompleted(
        routine.activities[0],
        findProgress(afterB, DATE_A),
      ),
    ).toBe(true);
  });

  it("deriva conclusão de atividade com etapas e ignora marcação direta", () => {
    const routine = getRoutine();
    const activity = routine.activities[1];
    let entries: DailyProgress[] = [];

    entries = toggleActivityCompletion(entries, DATE_A, routine, activity.id);
    expect(
      isActivityCompleted(activity, findProgress(entries, DATE_A)),
    ).toBe(false);

    entries = toggleSubtaskCompletion(
      entries,
      DATE_A,
      routine.id,
      "etapa-1",
    );
    expect(
      isActivityCompleted(activity, findProgress(entries, DATE_A)),
    ).toBe(false);

    entries = toggleSubtaskCompletion(
      entries,
      DATE_A,
      routine.id,
      "etapa-2",
    );
    expect(
      isActivityCompleted(activity, findProgress(entries, DATE_A)),
    ).toBe(true);

    entries = toggleSubtaskCompletion(
      entries,
      DATE_A,
      routine.id,
      "etapa-1",
    );
    expect(
      isActivityCompleted(activity, findProgress(entries, DATE_A)),
    ).toBe(false);
  });

  it("calcula progresso por atividades concluídas e trata rotina vazia", () => {
    const routine = getRoutine();
    const progress = findProgress(makeTestData().dailyProgress, DATE_A);

    expect(getRoutineProgressPercent(routine, progress)).toBe(50);
    expect(getRoutineProgressPercent({ ...routine, activities: [] }, progress)).toBe(
      null,
    );
  });

  it("limpa progresso órfão ao excluir rotinas, atividades ou etapas", () => {
    const data = makeTestData();
    const entries = [...data.dailyProgress, {
      date: DATE_B,
      routineId: "rotina-excluida",
      completedActivityIds: [],
      completedSubtaskIds: [],
    }];

    const cleaned = cleanupDailyProgress(entries, data.routines);

    expect(cleaned).toHaveLength(1);
    expect(cleaned[0].completedActivityIds).toContain("ativ-sem-etapas");
  });
});
