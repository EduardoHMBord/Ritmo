import { describe, expect, it, vi } from "vitest";
import { makeTestData } from "../test/fixtures";
import { createBackupJson, downloadBackupFile, parseBackupJson } from "./backup";

describe("backup", () => {
  it("faz um round-trip completo de rotinas, progresso e preferências", () => {
    const original = makeTestData();
    const result = parseBackupJson(createBackupJson(original));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual(original);
    }
  });

  it("rejeita JSON inválido sem alterar os dados de entrada", () => {
    const original = makeTestData();
    const before = createBackupJson(original);

    const result = parseBackupJson("{ JSON quebrado");

    expect(result.ok).toBe(false);
    expect(createBackupJson(original)).toBe(before);
  });

  it("rejeita estrutura incompleta e versão incompatível", () => {
    const missingFields = parseBackupJson(JSON.stringify({ schemaVersion: 1 }));
    expect(missingFields.ok).toBe(false);

    const incompatible = makeTestData();
    incompatible.schemaVersion = 2;
    const result = parseBackupJson(JSON.stringify(incompatible));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/incompatível/i);
    }
  });

  it("remove referências de progresso inválidas ao importar", () => {
    const data = makeTestData();
    data.dailyProgress[0].completedActivityIds.push("atividade-excluida");
    data.dailyProgress[0].completedSubtaskIds.push("etapa-excluida");

    const result = parseBackupJson(JSON.stringify(data));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.dailyProgress[0]).toEqual({
        date: "2026-11-21",
        routineId: "rotina-manha",
        completedActivityIds: ["ativ-sem-etapas"],
        completedSubtaskIds: ["etapa-1"],
      });
    }
  });

  it("gera o download com nome de arquivo datado e libera a URL", () => {
    const createObjectURL = vi.fn(() => "blob:ritmo");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    vi.useFakeTimers();

    try {
      const result = downloadBackupFile(makeTestData());

      expect(result.ok).toBe(true);
      expect(createObjectURL).toHaveBeenCalledOnce();
      expect(click).toHaveBeenCalledOnce();
      const anchor = click.mock.instances[0] as HTMLAnchorElement;
      expect(anchor.download).toMatch(/^ritmo-backup-\d{4}-\d{2}-\d{2}\.json$/);
      vi.advanceTimersByTime(1000);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:ritmo");
    } finally {
      vi.useRealTimers();
    }
  });
});
