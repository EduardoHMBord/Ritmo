import type { AppData } from "../types";

export const TEST_DATE = "2026-11-21";

export function makeTestData(): AppData {
  return {
    schemaVersion: 1,
    routines: [
      {
        id: "rotina-manha",
        name: "Rotina da manhã",
        description: "Preparo para o dia",
        weekdays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        createdAt: "2026-11-01T08:00:00.000Z",
        updatedAt: "2026-11-01T08:00:00.000Z",
        activities: [
          {
            id: "ativ-sem-etapas",
            title: "Beber água",
            description: "Um copo de água",
            scheduledTime: "08:00",
            order: 0,
            subtasks: [],
          },
          {
            id: "ativ-com-etapas",
            title: "Escovar os dentes",
            order: 1,
            subtasks: [
              { id: "etapa-1", title: "Passar creme", order: 0 },
              { id: "etapa-2", title: "Escovar", order: 1 },
            ],
          },
        ],
      },
    ],
    dailyProgress: [
      {
        date: TEST_DATE,
        routineId: "rotina-manha",
        completedActivityIds: ["ativ-sem-etapas"],
        completedSubtaskIds: ["etapa-1"],
      },
    ],
    preferences: {
      fontSize: "normal",
      contrast: "standard",
      spacing: "standard",
      reducedMotion: false,
    },
  };
}
