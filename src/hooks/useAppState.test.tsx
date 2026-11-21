import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { STORAGE_KEY } from "../services/storage";
import { makeTestData, TEST_DATE } from "../test/fixtures";
import { useAppState } from "./useAppState";

describe("useAppState", () => {
  it("cria rotina, atividade e etapa e persiste automaticamente", () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.createRoutine({
        name: "Rotina nova",
        description: "",
        weekdays: ["monday"],
      });
    });
    const routineId = result.current.routines[0].id;

    act(() => {
      result.current.createActivity(routineId, {
        title: "Atividade nova",
        description: "",
        scheduledTime: "",
        icon: "",
      });
    });
    const activityId = result.current.routines[0].activities[0].id;

    act(() => {
      result.current.createSubtask(routineId, activityId, "Primeira etapa");
    });

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    expect(saved?.routines?.[0]?.name).toBe("Rotina nova");
    expect(saved?.routines?.[0]?.activities?.[0]?.subtasks?.[0]?.title).toBe(
      "Primeira etapa",
    );
  });

  it("edita, reordena e exclui atividades e etapas", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(makeTestData()));
    const { result } = renderHook(() => useAppState());
    const routineId = "rotina-manha";
    const activityId = "ativ-com-etapas";

    act(() =>
      result.current.updateActivity(routineId, activityId, {
        title: "Escovar os dentes (editada)",
        description: "",
        scheduledTime: "",
        icon: "",
      }),
    );
    act(() => result.current.moveActivity(routineId, activityId, "up"));
    act(() =>
      result.current.updateSubtask(routineId, activityId, "etapa-1", "Passar creme"),
    );
    act(() => result.current.moveSubtask(routineId, activityId, "etapa-2", "up"));

    let routine = result.current.routines[0];
    expect(routine.activities[0].title).toBe("Escovar os dentes (editada)");
    expect(routine.activities[0].subtasks[0].id).toBe("etapa-2");
    expect(routine.activities[0].subtasks[1].title).toBe("Passar creme");

    act(() => result.current.deleteSubtask(routineId, activityId, "etapa-1"));
    act(() => result.current.deleteActivity(routineId, activityId));
    routine = result.current.routines[0];
    expect(routine.activities).toHaveLength(1);
    expect(routine.activities[0].id).toBe("ativ-sem-etapas");
  });

  it("exclui rotina e referências de progresso associadas", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(makeTestData()));
    const { result } = renderHook(() => useAppState());

    expect(result.current.dailyProgress).toHaveLength(1);
    act(() => result.current.deleteRoutine("rotina-manha"));

    expect(result.current.routines).toHaveLength(0);
    expect(result.current.dailyProgress).toHaveLength(0);
  });

  it("importa backup substituindo rotinas, progresso e preferências", () => {
    const { result } = renderHook(() => useAppState());
    expect(result.current.routines).toHaveLength(0);

    const backup = makeTestData();
    act(() => result.current.importBackupData(backup));

    expect(result.current.routines[0].name).toBe("Rotina da manhã");
    expect(result.current.dailyProgress[0].date).toBe(TEST_DATE);
    expect(result.current.preferences).toEqual(backup.preferences);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")?.routines).toHaveLength(1);
  });
});
