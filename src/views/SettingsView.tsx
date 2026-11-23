import { useState, type ChangeEvent } from "react";
import { parseBackupJson, readBackupFile } from "../services/backup";
import type { AccessibilityPreferences, AppData } from "../types";

type BackupMessage = {
  kind: "success" | "error" | "info";
  text: string;
};

type SettingsViewProps = {
  preferences: AccessibilityPreferences;
  onUpdatePreferences: (patch: Partial<AccessibilityPreferences>) => void;
  onExportBackup: () => boolean;
  onImportBackup: (data: AppData) => boolean;
};

export function SettingsView({
  preferences,
  onUpdatePreferences,
  onExportBackup,
  onImportBackup,
}: SettingsViewProps) {
  const [backupMessage, setBackupMessage] = useState<BackupMessage | null>(null);

  function handleExport(): void {
    setBackupMessage(
      onExportBackup()
        ? {
            kind: "success",
            text: "Backup exportado. O arquivo foi baixado neste navegador.",
          }
        : {
            kind: "error",
            text: "Não foi possível iniciar o download do backup. Tente novamente.",
          },
    );
  }

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) {
      return;
    }

    setBackupMessage(null);

    try {
      const result = parseBackupJson(await readBackupFile(file));
      if (!result.ok) {
        setBackupMessage({ kind: "error", text: result.message });
        return;
      }

      const applied = onImportBackup(result.data);
      setBackupMessage(
        applied
          ? {
              kind: "success",
              text: "Backup importado. Rotinas, progresso e preferências foram substituídos e salvos neste navegador.",
            }
          : {
              kind: "info",
              text: "Importação cancelada. Nenhum dado foi alterado.",
            },
      );
    } catch {
      setBackupMessage({
        kind: "error",
        text: "Não foi possível ler o arquivo selecionado. Os dados atuais não foram alterados.",
      });
    }
  }

  return (
    <section aria-labelledby="settings-title">
      <div className="view-header">
        <h1 id="settings-title">Configurações</h1>
      </div>

      <section aria-labelledby="accessibility-title" className="settings-panel">
        <h2 id="accessibility-title">Acessibilidade</h2>
        <p>
          Ajuste a aparência e a leitura da interface. As alterações são salvas
          automaticamente neste navegador.
        </p>

        <form className="card-form" aria-describedby="settings-help">
          <p id="settings-help" className="field-hint">
            Escolha as opções que tornam o uso mais confortável para você.
          </p>

          <fieldset className="form-field">
            <legend>Aparência e contraste</legend>
            <div className="radio-group">
              <label className="radio-item">
                <input
                  type="radio"
                  name="contrast"
                  value="standard"
                  checked={preferences.contrast === "standard"}
                  onChange={() => onUpdatePreferences({ contrast: "standard" })}
                />
                <span>Padrão</span>
              </label>
              <label className="radio-item">
                <input
                  type="radio"
                  name="contrast"
                  value="high"
                  checked={preferences.contrast === "high"}
                  onChange={() => onUpdatePreferences({ contrast: "high" })}
                />
                <span>Alto contraste</span>
              </label>
            </div>
          </fieldset>

          <fieldset className="form-field">
            <legend>Tamanho da fonte</legend>
            <div className="radio-group">
              <label className="radio-item">
                <input
                  type="radio"
                  name="fontSize"
                  value="normal"
                  checked={preferences.fontSize === "normal"}
                  onChange={() => onUpdatePreferences({ fontSize: "normal" })}
                />
                <span>Normal</span>
              </label>
              <label className="radio-item">
                <input
                  type="radio"
                  name="fontSize"
                  value="large"
                  checked={preferences.fontSize === "large"}
                  onChange={() => onUpdatePreferences({ fontSize: "large" })}
                />
                <span>Grande</span>
              </label>
              <label className="radio-item">
                <input
                  type="radio"
                  name="fontSize"
                  value="extra-large"
                  checked={preferences.fontSize === "extra-large"}
                  onChange={() =>
                    onUpdatePreferences({ fontSize: "extra-large" })
                  }
                />
                <span>Muito grande</span>
              </label>
            </div>
          </fieldset>

          <fieldset className="form-field">
            <legend>Espaçamento</legend>
            <div className="radio-group">
              <label className="radio-item">
                <input
                  type="radio"
                  name="spacing"
                  value="standard"
                  checked={preferences.spacing === "standard"}
                  onChange={() => onUpdatePreferences({ spacing: "standard" })}
                />
                <span>Padrão</span>
              </label>
              <label className="radio-item">
                <input
                  type="radio"
                  name="spacing"
                  value="increased"
                  checked={preferences.spacing === "increased"}
                  onChange={() => onUpdatePreferences({ spacing: "increased" })}
                />
                <span>Aumentado</span>
              </label>
            </div>
          </fieldset>

        </form>
      </section>

      <section aria-labelledby="backup-title" className="settings-panel">
        <h2 id="backup-title">Backup dos dados</h2>
        <p id="backup-help">
          Exporte suas rotinas, atividades, etapas, progresso e preferências em
          um arquivo JSON. Ao importar um backup válido, os dados atuais são
          <strong> substituídos</strong> após confirmação.
          Um arquivo inválido ou incompatível não altera os dados atuais.
        </p>

        <div className="backup-actions">
          <button type="button" className="secondary-button" onClick={handleExport}>
            Exportar backup
          </button>
          <div className="form-field backup-file-field">
            <label htmlFor="backup-file">Arquivo de backup (.json)</label>
            <input
              id="backup-file"
              className="backup-file-input"
              type="file"
              accept="application/json,.json"
              aria-describedby="backup-help"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {backupMessage && (
          <p
            className={`backup-status backup-status--${backupMessage.kind}`}
            role={backupMessage.kind === "error" ? "alert" : "status"}
          >
            {backupMessage.text}
          </p>
        )}

        <p className="field-hint">
          Exporte backups periodicamente: limpar os dados do navegador pode
          apagar suas informações locais.
        </p>
      </section>
    </section>
  );
}
