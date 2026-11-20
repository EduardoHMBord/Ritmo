import type { AppData } from "../types";
import { getLocalDateString } from "../utils/dates";
import { cleanupDailyProgress } from "../utils/progress";
import { parseAppData } from "./storage";

export type BackupImportResult =
  | { ok: true; data: AppData }
  | { ok: false; message: string };

export function createBackupJson(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function downloadBackupFile(data: AppData): void {
  const json = createBackupJson(data);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const date = getLocalDateString();
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ritmo-backup-${date}.json`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function parseBackupJson(text: string): BackupImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      ok: false,
      message:
        "O arquivo selecionado não é um JSON válido. Verifique o arquivo e tente novamente.",
    };
  }

  const data = parseAppData(parsed);
  if (!data) {
    return {
      ok: false,
      message:
        "O arquivo de backup está incompleto ou em um formato inválido. Os dados atuais não foram alterados.",
    };
  }

  if ("incompatible" in data) {
    return {
      ok: false,
      message:
        "O arquivo de backup foi criado em uma versão incompatível do aplicativo. Os dados atuais não foram alterados.",
    };
  }

  return {
    ok: true,
    data: {
      ...data,
      dailyProgress: cleanupDailyProgress(data.dailyProgress, data.routines),
    },
  };
}
