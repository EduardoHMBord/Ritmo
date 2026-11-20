import type { AccessibilityPreferences } from "../types";

type SettingsViewProps = {
  preferences: AccessibilityPreferences;
  onUpdatePreferences: (patch: Partial<AccessibilityPreferences>) => void;
};

export function SettingsView({
  preferences,
  onUpdatePreferences,
}: SettingsViewProps) {
  return (
    <section aria-labelledby="settings-title">
      <div className="view-header">
        <h1 id="settings-title">Configurações de acessibilidade</h1>
      </div>

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

        <fieldset className="form-field">
          <legend>Movimento</legend>
          <div className="radio-group">
            <label className="radio-item">
              <input
                type="radio"
                name="reducedMotion"
                value="off"
                checked={!preferences.reducedMotion}
                onChange={() => onUpdatePreferences({ reducedMotion: false })}
              />
              <span>Permitir animações e transições</span>
            </label>
            <label className="radio-item">
              <input
                type="radio"
                name="reducedMotion"
                value="on"
                checked={preferences.reducedMotion}
                onChange={() => onUpdatePreferences({ reducedMotion: true })}
              />
              <span>Reduzir movimento</span>
            </label>
          </div>
          <p className="field-hint">
            O aplicativo também respeita a preferência de redução de movimento do
            seu sistema, quando disponível.
          </p>
        </fieldset>
      </form>
    </section>
  );
}
