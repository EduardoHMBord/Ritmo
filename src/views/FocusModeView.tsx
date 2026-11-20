import { useEffect, useState } from "react";
import type { Activity, DailyProgress, Routine } from "../types";
import {
  findDailyProgress,
  isActivityCompleted,
} from "../utils/progress";
import { formatDateLongPtBr, getWeekdayFromDate } from "../utils/dates";
import {
  isSpeechPaused,
  isSpeechSpeaking,
  isSpeechSupported,
  pauseSpeech,
  resumeSpeech,
  speakText,
  stopSpeech,
} from "../services/speech";

type FocusModeViewProps = {
  routines: Routine[];
  dailyProgress: DailyProgress[];
  todayDate: string;
  onGoToRoutines: () => void;
  onToggleActivityCompletion: (
    routineId: string,
    activityId: string,
    date: string,
  ) => void;
  onToggleSubtaskCompletion: (
    routineId: string,
    subtaskId: string,
    date: string,
  ) => void;
};

function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function buildSpeechText(activity: Activity): string {
  const parts: string[] = [];
  parts.push(`Atividade: ${activity.title}.`);
  if (activity.description) {
    parts.push(`Descrição: ${activity.description}.`);
  }
  if (activity.subtasks.length > 0) {
    const steps = [...activity.subtasks]
      .sort((a, b) => a.order - b.order)
      .map((subtask, index) => `Etapa ${index + 1}: ${subtask.title}`)
      .join(". ");
    parts.push(`Etapas: ${steps}.`);
  }
  return parts.join(" ");
}

export function FocusModeView({
  routines,
  dailyProgress,
  todayDate,
  onGoToRoutines,
  onToggleActivityCompletion,
  onToggleSubtaskCompletion,
}: FocusModeViewProps) {
  const today = parseLocalDate(todayDate);
  const todayWeekday = getWeekdayFromDate(today);
  const todaysRoutines = routines.filter((routine) =>
    routine.weekdays.includes(todayWeekday),
  );

  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [activityIndex, setActivityIndex] = useState(0);
  const [speechSupported] = useState(() => isSpeechSupported());
  const [speechStatus, setSpeechStatus] = useState<
    "idle" | "speaking" | "paused"
  >("idle");

  const effectiveSelectedRoutineId =
    todaysRoutines.length === 0
      ? null
      : selectedRoutineId &&
          todaysRoutines.some((routine) => routine.id === selectedRoutineId)
        ? selectedRoutineId
        : todaysRoutines[0].id;

  const selectedRoutine =
    todaysRoutines.find((routine) => routine.id === effectiveSelectedRoutineId) ??
    null;

  const activities = selectedRoutine
    ? [...selectedRoutine.activities].sort((a, b) => a.order - b.order)
    : [];

  const safeActivityIndex =
    activities.length === 0 ? 0 : Math.min(activityIndex, activities.length - 1);

  const currentActivity = activities[safeActivityIndex] ?? null;
  const progress = selectedRoutine
    ? findDailyProgress(dailyProgress, todayDate, selectedRoutine.id)
    : undefined;

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  function stopAndResetSpeech(): void {
    stopSpeech();
    setSpeechStatus("idle");
  }

  function handleRoutineChange(routineId: string): void {
    stopAndResetSpeech();
    setSelectedRoutineId(routineId);
    setActivityIndex(0);
  }

  function handlePrevious(): void {
    stopAndResetSpeech();
    setActivityIndex((current) => Math.max(0, current - 1));
  }

  function handleNext(): void {
    stopAndResetSpeech();
    setActivityIndex((current) => Math.min(activities.length - 1, current + 1));
  }

  function handlePlaySpeech(): void {
    if (!currentActivity) {
      return;
    }
    const text = buildSpeechText(currentActivity);
    const started = speakText(text, {
      onStart: () => setSpeechStatus("speaking"),
      onEnd: () => setSpeechStatus("idle"),
      onError: () => setSpeechStatus("idle"),
    });
    if (!started) {
      setSpeechStatus("idle");
    }
  }

  function handlePauseOrResume(): void {
    if (isSpeechPaused()) {
      resumeSpeech();
      setSpeechStatus("speaking");
    } else if (isSpeechSpeaking()) {
      pauseSpeech();
      setSpeechStatus("paused");
    }
  }

  function handleStopSpeech(): void {
    stopAndResetSpeech();
  }

  return (
    <section aria-labelledby="focus-title">
      <div className="view-header">
        <div>
          <h1 id="focus-title">Modo simplificado</h1>
          <p>
            <strong>Data atual:</strong> {formatDateLongPtBr(today)}
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="secondary-button" onClick={onGoToRoutines}>
            Gerenciar rotinas
          </button>
        </div>
      </div>

      {todaysRoutines.length === 0 ? (
        <div className="empty-state" role="status">
          <h2>Nenhuma rotina para hoje</h2>
          <p>
            Não há rotinas programadas para o dia atual. Crie uma rotina ou
            ajuste os dias de uma rotina existente para usar o modo simplificado.
          </p>
          <button type="button" className="primary-button" onClick={onGoToRoutines}>
            Criar ou ajustar rotinas
          </button>
        </div>
      ) : (
        <>
          {todaysRoutines.length > 1 && (
            <div className="form-field">
              <label htmlFor="focus-routine-select">Rotina em foco</label>
              <select
                id="focus-routine-select"
                value={effectiveSelectedRoutineId ?? ""}
                onChange={(event) => handleRoutineChange(event.target.value)}
              >
                {todaysRoutines.map((routine) => (
                  <option key={routine.id} value={routine.id}>
                    {routine.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedRoutine && todaysRoutines.length === 1 && (
            <p>
              <strong>Rotina:</strong> {selectedRoutine.name}
            </p>
          )}

          {activities.length === 0 ? (
            <div className="empty-state" role="status">
              <h2>Nenhuma atividade cadastrada</h2>
              <p>
                A rotina selecionada não possui atividades. Adicione atividades
                para usar o modo simplificado.
              </p>
              <button type="button" className="primary-button" onClick={onGoToRoutines}>
                Gerenciar rotinas e atividades
              </button>
            </div>
          ) : currentActivity ? (
            <>
              <p className="focus-position" aria-live="polite">
                Atividade {safeActivityIndex + 1} de {activities.length}
              </p>

              <div className="speech-controls" aria-label="Leitura em voz alta">
                <h2>Leitura em voz alta</h2>
                {speechSupported ? (
                  <>
                    <p className="speech-status" aria-live="polite">
                      Estado da leitura:{" "}
                      <strong>
                        {speechStatus === "speaking"
                          ? "Em reprodução"
                          : speechStatus === "paused"
                            ? "Pausada"
                            : "Parada"}
                      </strong>
                    </p>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={handlePlaySpeech}
                      >
                        Ouvir atividade
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={handlePauseOrResume}
                        disabled={speechStatus === "idle"}
                      >
                        {speechStatus === "paused" ? "Retomar leitura" : "Pausar leitura"}
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={handleStopSpeech}
                        disabled={speechStatus === "idle"}
                      >
                        Interromper leitura
                      </button>
                    </div>
                    <p className="field-hint">
                      A leitura inclui o título, a descrição e as etapas da
                      atividade atual. O áudio não inicia automaticamente.
                    </p>
                  </>
                ) : (
                  <p role="status">
                    A leitura em voz alta não está disponível neste navegador.
                    Todo o conteúdo da atividade continua disponível em texto.
                  </p>
                )}
              </div>

              <article className="focus-activity" aria-labelledby="focus-activity-title">
                <h2 id="focus-activity-title">
                  {currentActivity.icon ? `${currentActivity.icon} ` : ""}
                  {currentActivity.title}
                </h2>
                {currentActivity.scheduledTime && (
                  <p>
                    <strong>Horário:</strong> {currentActivity.scheduledTime}
                  </p>
                )}
                {currentActivity.description ? (
                  <p>{currentActivity.description}</p>
                ) : (
                  <p className="muted-text">Sem descrição adicional.</p>
                )}

                <p>
                  <strong>Estado:</strong>{" "}
                  {selectedRoutine && isActivityCompleted(currentActivity, progress)
                    ? "Concluída"
                    : "Pendente"}
                </p>

                {currentActivity.subtasks.length === 0 ? (
                  <div className="form-field">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() =>
                        selectedRoutine &&
                        onToggleActivityCompletion(
                          selectedRoutine.id,
                          currentActivity.id,
                          todayDate,
                        )
                      }
                      aria-pressed={
                        selectedRoutine
                          ? isActivityCompleted(currentActivity, progress)
                          : false
                      }
                    >
                      {selectedRoutine && isActivityCompleted(currentActivity, progress)
                        ? "Marcar atividade como pendente"
                        : "Marcar atividade como concluída"}
                    </button>
                  </div>
                ) : (
                  <div className="focus-steps">
                    <h3>Etapas</h3>
                    <ul aria-label={`Etapas da atividade ${currentActivity.title}`}>
                      {[...currentActivity.subtasks]
                        .sort((a, b) => a.order - b.order)
                        .map((subtask) => {
                          const subtaskCompleted =
                            progress?.completedSubtaskIds.includes(subtask.id) ??
                            false;
                          return (
                            <li key={subtask.id} className="focus-step-item">
                              <label className="completion-label">
                                <input
                                  type="checkbox"
                                  checked={subtaskCompleted}
                                  onChange={() =>
                                    selectedRoutine &&
                                    onToggleSubtaskCompletion(
                                      selectedRoutine.id,
                                      subtask.id,
                                      todayDate,
                                    )
                                  }
                                />
                                <span>{subtask.title}</span>
                              </label>
                            </li>
                          );
                        })}
                    </ul>
                    <p className="field-hint">
                      A atividade será concluída quando todas as etapas estiverem
                      concluídas.
                    </p>
                  </div>
                )}
              </article>

              <div className="focus-controls" aria-label="Navegação entre atividades">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handlePrevious}
                  disabled={safeActivityIndex === 0}
                >
                  Atividade anterior
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleNext}
                  disabled={safeActivityIndex === activities.length - 1}
                >
                  Próxima atividade
                </button>
              </div>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
