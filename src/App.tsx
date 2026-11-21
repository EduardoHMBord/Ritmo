import { useEffect, useState } from "react";
import { useAppState } from "./hooks/useAppState";
import { downloadBackupFile } from "./services/backup";
import type { AppData, AppView } from "./types";
import { getLocalDateString } from "./utils/dates";
import { ActivitiesView } from "./views/ActivitiesView";
import { FocusModeView } from "./views/FocusModeView";
import { HomeView } from "./views/HomeView";
import { RoutinesView } from "./views/RoutinesView";
import { SettingsView } from "./views/SettingsView";
import "./App.css";

const NAV_ITEMS: { id: AppView; label: string }[] = [
  { id: "home", label: "Início" },
  { id: "routines", label: "Rotinas" },
  { id: "activities", label: "Atividades" },
  { id: "focus", label: "Modo simplificado" },
  { id: "settings", label: "Configurações" },
];

function App() {
  const [activeView, setActiveView] = useState<AppView>("home");
  const [todayDate] = useState(() => getLocalDateString());
  const {
    appData,
    routines,
    dailyProgress,
    preferences,
    selectedRoutine,
    loadState,
    loadError,
    saveError,
    retryLoad,
    resetAppData,
    importBackupData,
    updatePreferences,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    openRoutine,
    closeRoutine,
    createActivity,
    updateActivity,
    deleteActivity,
    moveActivity,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    moveSubtask,
    toggleRoutineActivityCompletion,
    toggleRoutineSubtaskCompletion,
  } = useAppState();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.contrast = preferences.contrast;
    root.dataset.fontSize = preferences.fontSize;
    root.dataset.spacing = preferences.spacing;
    root.dataset.reducedMotion = preferences.reducedMotion ? "true" : "false";
  }, [preferences]);

  function handleOpenRoutine(routineId: string): void {
    openRoutine(routineId);
    setActiveView("activities");
  }

  function handleGoToRoutines(): void {
    closeRoutine();
    setActiveView("routines");
  }

  function handleResetData(): void {
    const confirmed = window.confirm(
      "Reiniciar os dados locais agora? Os dados atualmente salvos no navegador serão descartados e o aplicativo voltará ao estado inicial.",
    );
    if (confirmed) {
      resetAppData();
    }
  }

  function handleExportBackup(): boolean {
    return downloadBackupFile(appData).ok;
  }

  function handleImportBackup(data: AppData): boolean {
    const confirmed = window.confirm(
      "Importar o backup selecionado? Todas as rotinas, atividades, etapas, progressos e preferências atuais serão substituídos pelos dados do arquivo. Esta ação não pode ser desfeita. Continuar?",
    );
    if (!confirmed) {
      return false;
    }
    importBackupData(data);
    return true;
  }

  function renderMainContent() {
    if (loadState === "loading") {
      return (
        <section aria-labelledby="loading-title" role="status">
          <h1 id="loading-title">Carregando dados</h1>
          <p>Aguarde enquanto os dados locais são carregados.</p>
        </section>
      );
    }

    if (loadState === "error" && loadError) {
      return (
        <section aria-labelledby="load-error-title" role="alert">
          <h1 id="load-error-title">Não foi possível carregar os dados locais</h1>
          <p>{loadError.message}</p>
          <p>
            Os dados salvos não foram apagados automaticamente. Você pode tentar
            carregar novamente. Se o problema continuar, pode reiniciar os dados
            locais do aplicativo, o que descartará os dados salvos atualmente.
          </p>
          <p>
            Se os dados do navegador forem apagados, as informações locais podem
            ser perdidas. Quando o backup estiver disponível, exporte backups
            periodicamente.
          </p>
          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={retryLoad}>
              Tentar carregar novamente
            </button>
            <button type="button" className="danger-button" onClick={handleResetData}>
              Reiniciar dados locais
            </button>
          </div>
        </section>
      );
    }

    switch (activeView) {
      case "home":
        return (
          <HomeView
            routines={routines}
            dailyProgress={dailyProgress}
            todayDate={todayDate}
            onGoToRoutines={() => setActiveView("routines")}
            onGoToFocus={() => setActiveView("focus")}
            onToggleActivityCompletion={toggleRoutineActivityCompletion}
            onToggleSubtaskCompletion={toggleRoutineSubtaskCompletion}
          />
        );
      case "routines":
        return (
          <RoutinesView
            routines={routines}
            onCreateRoutine={createRoutine}
            onUpdateRoutine={updateRoutine}
            onDeleteRoutine={deleteRoutine}
            onOpenRoutine={handleOpenRoutine}
          />
        );
      case "activities":
        return (
          <ActivitiesView
            selectedRoutine={selectedRoutine}
            onGoToRoutines={handleGoToRoutines}
            onCreateActivity={createActivity}
            onUpdateActivity={updateActivity}
            onDeleteActivity={deleteActivity}
            onMoveActivity={moveActivity}
            onCreateSubtask={createSubtask}
            onUpdateSubtask={updateSubtask}
            onDeleteSubtask={deleteSubtask}
            onMoveSubtask={moveSubtask}
          />
        );
      case "focus":
        return (
          <FocusModeView
            routines={routines}
            dailyProgress={dailyProgress}
            todayDate={todayDate}
            onGoToRoutines={() => setActiveView("routines")}
            onToggleActivityCompletion={toggleRoutineActivityCompletion}
            onToggleSubtaskCompletion={toggleRoutineSubtaskCompletion}
          />
        );
      case "settings":
        return (
          <SettingsView
            preferences={preferences}
            onUpdatePreferences={updatePreferences}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        );
      default:
        return (
          <HomeView
            routines={routines}
            dailyProgress={dailyProgress}
            todayDate={todayDate}
            onGoToRoutines={() => setActiveView("routines")}
            onGoToFocus={() => setActiveView("focus")}
            onToggleActivityCompletion={toggleRoutineActivityCompletion}
            onToggleSubtaskCompletion={toggleRoutineSubtaskCompletion}
          />
        );
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo-principal">
        Pular para o conteúdo principal
      </a>

      <header className="app-header">
        <div className="app-branding">
          <p className="app-name">Ritmo</p>
          <p className="app-tagline">Organize seu dia, uma etapa por vez.</p>
        </div>

        <nav aria-label="Navegação principal">
          <ul className="app-nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="app-nav-button"
                  aria-current={activeView === item.id ? "page" : undefined}
                  onClick={() => setActiveView(item.id)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="conteudo-principal" className="app-main" tabIndex={-1}>
        {saveError && (
          <p className="save-error-banner" role="alert">
            {saveError}
          </p>
        )}
        {renderMainContent()}
      </main>
    </div>
  );
}

export default App;
