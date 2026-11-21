import type { AppData } from "../types";
import { getLocalDateString } from "../utils/dates";
import { cleanupDailyProgress } from "../utils/progress";
import { parseAppData } from "./storage";

export type BackupImportResult =
  | { ok: true; data: AppData }
  | { ok: false; message: string };

export type BackupDownloadResult =
  | { ok: true }
  | { ok: false; message: string };

export function createBackupJson(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function downloadBackupFile(data: AppData): BackupDownloadResult {
  try {
    const json = createBackupJson(data);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    try {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ritmo-backup-${getLocalDateString()}.json`;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      message:
        "Não foi possível iniciar o download do backup. Tente novamente.",
    };
  }
}

export function readBackupFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo de backup"));
    reader.readAsText(file);
  });
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
