import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createBackupJson } from "../services/backup";
import { makeTestData } from "../test/fixtures";
import type { AccessibilityPreferences, AppData } from "../types";
import { SettingsView } from "./SettingsView";

const PREFERENCES: AccessibilityPreferences = {
  fontSize: "normal",
  contrast: "standard",
  spacing: "standard",
  reducedMotion: false,
};

function renderSettings(onImportBackup: (data: AppData) => boolean) {
  const onExportBackup = vi.fn(() => true);
  const result = render(
    <SettingsView
      preferences={PREFERENCES}
      onUpdatePreferences={vi.fn()}
      onExportBackup={onExportBackup}
      onImportBackup={onImportBackup}
    />,
  );
  return { ...result, onExportBackup };
}

function selectFile(text: string, name = "backup.json") {
  const input = screen.getByLabelText("Arquivo de backup (.json)");
  fireEvent.change(input, {
    target: {
      files: [new File([text], name, { type: "application/json" })],
    },
  });
}

describe("SettingsView — backup", () => {
  it("exporta e informa sucesso", () => {
    const { onExportBackup } = renderSettings(vi.fn(() => true));

    fireEvent.click(screen.getByRole("button", { name: "Exportar backup" }));

    expect(onExportBackup).toHaveBeenCalledOnce();
    expect(screen.getByRole("status").textContent).toContain("Backup exportado");
  });

  it("importa backup válido e confirma a substituição", async () => {
    const onImportBackup = vi.fn((_data: AppData) => true);
    renderSettings(onImportBackup);

    selectFile(createBackupJson(makeTestData()));

    await waitFor(() => {
      expect(onImportBackup).toHaveBeenCalledOnce();
    });
    expect(onImportBackup.mock.calls[0][0].routines[0].name).toBe(
      "Rotina da manhã",
    );
    expect(screen.getByRole("status").textContent).toContain("substituídos");
  });

  it("rejeita arquivo inválido sem chamar a importação", async () => {
    const onImportBackup = vi.fn(() => true);
    renderSettings(onImportBackup);

    selectFile("{ quebrado");

    expect((await screen.findByRole("alert")).textContent).toContain(
      "não é um JSON válido",
    );
    expect(onImportBackup).not.toHaveBeenCalled();
  });

  it("informa quando o usuário cancela a substituição", async () => {
    renderSettings(vi.fn(() => false));

    selectFile(createBackupJson(makeTestData()));

    expect((await screen.findByRole("status")).textContent).toContain(
      "Importação cancelada",
    );
  });
});
