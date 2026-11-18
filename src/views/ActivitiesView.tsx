import { useState, type FormEvent } from "react";
import type { Activity, Routine } from "../types";
import { hasNonEmptyText } from "../utils/validation";
import { formatWeekdays } from "../utils/weekdays";

type ActivityFormValues = {
  title: string;
  description: string;
  scheduledTime: string;
  icon: string;
};

type ActivityFormErrors = {
  title?: string;
};

type ActivitiesViewProps = {
  selectedRoutine: Routine | null;
  onGoToRoutines: () => void;
  onCreateActivity: (routineId: string, input: ActivityFormValues) => void;
  onUpdateActivity: (
    routineId: string,
    activityId: string,
    input: ActivityFormValues,
  ) => void;
  onDeleteActivity: (routineId: string, activityId: string) => void;
  onMoveActivity: (
    routineId: string,
    activityId: string,
    direction: "up" | "down",
  ) => void;
  onCreateSubtask: (
    routineId: string,
    activityId: string,
    title: string,
  ) => void;
  onUpdateSubtask: (
    routineId: string,
    activityId: string,
    subtaskId: string,
    title: string,
  ) => void;
  onDeleteSubtask: (
    routineId: string,
    activityId: string,
    subtaskId: string,
  ) => void;
  onMoveSubtask: (
    routineId: string,
    activityId: string,
    subtaskId: string,
    direction: "up" | "down",
  ) => void;
};

const EMPTY_ACTIVITY_FORM: ActivityFormValues = {
  title: "",
  description: "",
  scheduledTime: "",
  icon: "",
};

function validateActivityForm(values: ActivityFormValues): ActivityFormErrors {
  const errors: ActivityFormErrors = {};
  if (!hasNonEmptyText(values.title)) {
    errors.title = "Informe um título para a atividade.";
  }
  return errors;
}

export function ActivitiesView({
  selectedRoutine,
  onGoToRoutines,
  onCreateActivity,
  onUpdateActivity,
  onDeleteActivity,
  onMoveActivity,
  onCreateSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onMoveSubtask,
}: ActivitiesViewProps) {
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(
    null,
  );
  const [activityValues, setActivityValues] =
    useState<ActivityFormValues>(EMPTY_ACTIVITY_FORM);
  const [activityErrors, setActivityErrors] = useState<ActivityFormErrors>({});
  const [newSubtaskTitles, setNewSubtaskTitles] = useState<
    Record<string, string>
  >({});
  const [editingSubtask, setEditingSubtask] = useState<{
    activityId: string;
    subtaskId: string;
    title: string;
  } | null>(null);

  if (!selectedRoutine) {
    return (
      <section aria-labelledby="activities-title">
        <h1 id="activities-title">Gerenciamento de atividades</h1>
        <div className="empty-state" role="status">
          <h2>Nenhuma rotina selecionada</h2>
          <p>
            Para gerenciar atividades e etapas, abra uma rotina na área de
            gerenciamento de rotinas.
          </p>
          <button type="button" className="primary-button" onClick={onGoToRoutines}>
            Ir para rotinas
          </button>
        </div>
      </section>
    );
  }

  const routineId = selectedRoutine.id;
  const activities = [...selectedRoutine.activities].sort(
    (a, b) => a.order - b.order,
  );

  function resetActivityForm(): void {
    setIsActivityFormOpen(false);
    setEditingActivityId(null);
    setActivityValues(EMPTY_ACTIVITY_FORM);
    setActivityErrors({});
  }

  function startCreateActivity(): void {
    setIsActivityFormOpen(true);
    setEditingActivityId(null);
    setActivityValues(EMPTY_ACTIVITY_FORM);
    setActivityErrors({});
  }

  function startEditActivity(activity: Activity): void {
    setIsActivityFormOpen(true);
    setEditingActivityId(activity.id);
    setActivityValues({
      title: activity.title,
      description: activity.description ?? "",
      scheduledTime: activity.scheduledTime ?? "",
      icon: activity.icon ?? "",
    });
    setActivityErrors({});
  }

  function handleActivitySubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const nextErrors = validateActivityForm(activityValues);
    setActivityErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (editingActivityId) {
      onUpdateActivity(routineId, editingActivityId, activityValues);
    } else {
      onCreateActivity(routineId, activityValues);
    }

    resetActivityForm();
  }

  function handleDeleteActivity(activity: Activity): void {
    const confirmed = window.confirm(
      `Excluir a atividade "${activity.title}"? As etapas dessa atividade também serão removidas.`,
    );
    if (confirmed) {
      onDeleteActivity(routineId, activity.id);
      if (editingActivityId === activity.id) {
        resetActivityForm();
      }
      if (editingSubtask?.activityId === activity.id) {
        setEditingSubtask(null);
      }
    }
  }

  function handleAddSubtask(
    event: FormEvent<HTMLFormElement>,
    activityId: string,
  ): void {
    event.preventDefault();
    const title = newSubtaskTitles[activityId] ?? "";
    if (!hasNonEmptyText(title)) {
      return;
    }
    onCreateSubtask(routineId, activityId, title);
    setNewSubtaskTitles((current) => ({ ...current, [activityId]: "" }));
  }

  function startEditSubtask(
    activityId: string,
    subtaskId: string,
    title: string,
  ): void {
    setEditingSubtask({ activityId, subtaskId, title });
  }

  function handleSaveSubtaskEdit(): void {
    if (!editingSubtask) {
      return;
    }
    if (!hasNonEmptyText(editingSubtask.title)) {
      return;
    }
    onUpdateSubtask(
      routineId,
      editingSubtask.activityId,
      editingSubtask.subtaskId,
      editingSubtask.title,
    );
    setEditingSubtask(null);
  }

  function handleDeleteSubtask(
    activityId: string,
    subtaskId: string,
    subtaskTitle: string,
  ): void {
    const confirmed = window.confirm(`Excluir a etapa "${subtaskTitle}"?`);
    if (confirmed) {
      onDeleteSubtask(routineId, activityId, subtaskId);
      if (editingSubtask?.subtaskId === subtaskId) {
        setEditingSubtask(null);
      }
    }
  }

  return (
    <section aria-labelledby="activities-title">
      <div className="view-header">
        <div>
          <h1 id="activities-title">Atividades da rotina</h1>
          <p className="view-subtitle">
            <strong>Rotina:</strong> {selectedRoutine.name}
          </p>
          <p className="view-subtitle">
            <strong>Dias:</strong> {formatWeekdays(selectedRoutine.weekdays)}
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="secondary-button" onClick={onGoToRoutines}>
            Voltar para rotinas
          </button>
          {!isActivityFormOpen && (
            <button
              type="button"
              className="primary-button"
              onClick={startCreateActivity}
            >
              Adicionar atividade
            </button>
          )}
        </div>
      </div>

      {isActivityFormOpen && (
        <form className="card-form" onSubmit={handleActivitySubmit} noValidate>
          <h2>{editingActivityId ? "Editar atividade" : "Nova atividade"}</h2>

          <div className="form-field">
            <label htmlFor="activity-title">Título da atividade</label>
            <input
              id="activity-title"
              name="title"
              type="text"
              value={activityValues.title}
              onChange={(event) =>
                setActivityValues((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              aria-invalid={activityErrors.title ? "true" : undefined}
              aria-describedby={
                activityErrors.title ? "activity-title-error" : undefined
              }
              autoComplete="off"
              required
            />
            {activityErrors.title && (
              <p id="activity-title-error" className="field-error" role="alert">
                {activityErrors.title}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="activity-description">Descrição (opcional)</label>
            <textarea
              id="activity-description"
              name="description"
              rows={3}
              value={activityValues.description}
              onChange={(event) =>
                setActivityValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="activity-time">Horário (opcional)</label>
              <input
                id="activity-time"
                name="scheduledTime"
                type="time"
                value={activityValues.scheduledTime}
                onChange={(event) =>
                  setActivityValues((current) => ({
                    ...current,
                    scheduledTime: event.target.value,
                  }))
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="activity-icon">Ícone (opcional)</label>
              <input
                id="activity-icon"
                name="icon"
                type="text"
                value={activityValues.icon}
                onChange={(event) =>
                  setActivityValues((current) => ({
                    ...current,
                    icon: event.target.value,
                  }))
                }
                placeholder="Ex.: 📚, escovar dentes"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              {editingActivityId ? "Salvar alterações" : "Salvar atividade"}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={resetActivityForm}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {activities.length === 0 ? (
        <div className="empty-state" role="status">
          <h2>Nenhuma atividade cadastrada</h2>
          <p>Adicione atividades para montar esta rotina.</p>
          {!isActivityFormOpen && (
            <button
              type="button"
              className="primary-button"
              onClick={startCreateActivity}
            >
              Adicionar atividade
            </button>
          )}
        </div>
      ) : (
        <ol className="item-list" aria-label="Lista de atividades">
          {activities.map((activity, index) => {
            const isFirst = index === 0;
            const isLast = index === activities.length - 1;
            const subtasks = [...activity.subtasks].sort(
              (a, b) => a.order - b.order,
            );

            return (
              <li key={activity.id} className="item-card">
                <div className="item-card-content">
                  <h2 className="item-title">
                    {activity.icon ? `${activity.icon} ` : ""}
                    {activity.title}
                  </h2>
                  {activity.description && <p>{activity.description}</p>}
                  {activity.scheduledTime && (
                    <p>
                      <strong>Horário:</strong> {activity.scheduledTime}
                    </p>
                  )}
                </div>

                <div
                  className="item-actions"
                  aria-label={`Ações da atividade ${activity.title}`}
                >
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => onMoveActivity(routineId, activity.id, "up")}
                    disabled={isFirst}
                    aria-label={`Mover atividade ${activity.title} para cima`}
                  >
                    Mover para cima
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => onMoveActivity(routineId, activity.id, "down")}
                    disabled={isLast}
                    aria-label={`Mover atividade ${activity.title} para baixo`}
                  >
                    Mover para baixo
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => startEditActivity(activity)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => handleDeleteActivity(activity)}
                  >
                    Excluir
                  </button>
                </div>

                <div className="subtasks-section">
                  <h3>Etapas</h3>

                  {subtasks.length === 0 ? (
                    <p className="muted-text">Nenhuma etapa cadastrada.</p>
                  ) : (
                    <ol className="subtask-list" aria-label={`Etapas de ${activity.title}`}>
                      {subtasks.map((subtask, subtaskIndex) => {
                        const isFirstSubtask = subtaskIndex === 0;
                        const isLastSubtask = subtaskIndex === subtasks.length - 1;
                        const isEditingThisSubtask =
                          editingSubtask?.activityId === activity.id &&
                          editingSubtask?.subtaskId === subtask.id;

                        return (
                          <li key={subtask.id} className="subtask-item">
                            {isEditingThisSubtask ? (
                              <div className="subtask-edit-row">
                                <label
                                  htmlFor={`edit-subtask-${subtask.id}`}
                                  className="sr-only"
                                >
                                  Editar etapa
                                </label>
                                <input
                                  id={`edit-subtask-${subtask.id}`}
                                  type="text"
                                  value={editingSubtask.title}
                                  onChange={(event) =>
                                    setEditingSubtask((current) =>
                                      current
                                        ? { ...current, title: event.target.value }
                                        : current,
                                    )
                                  }
                                />
                                <button
                                  type="button"
                                  className="secondary-button"
                                  onClick={handleSaveSubtaskEdit}
                                >
                                  Salvar
                                </button>
                                <button
                                  type="button"
                                  className="secondary-button"
                                  onClick={() => setEditingSubtask(null)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="subtask-title">{subtask.title}</span>
                                <div
                                  className="subtask-actions"
                                  aria-label={`Ações da etapa ${subtask.title}`}
                                >
                                  <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                      onMoveSubtask(
                                        routineId,
                                        activity.id,
                                        subtask.id,
                                        "up",
                                      )
                                    }
                                    disabled={isFirstSubtask}
                                    aria-label={`Mover etapa ${subtask.title} para cima`}
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                      onMoveSubtask(
                                        routineId,
                                        activity.id,
                                        subtask.id,
                                        "down",
                                      )
                                    }
                                    disabled={isLastSubtask}
                                    aria-label={`Mover etapa ${subtask.title} para baixo`}
                                  >
                                    ↓
                                  </button>
                                  <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                      startEditSubtask(
                                        activity.id,
                                        subtask.id,
                                        subtask.title,
                                      )
                                    }
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    className="danger-button"
                                    onClick={() =>
                                      handleDeleteSubtask(
                                        activity.id,
                                        subtask.id,
                                        subtask.title,
                                      )
                                    }
                                  >
                                    Excluir
                                  </button>
                                </div>
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  )}

                  <form
                    className="subtask-add-form"
                    onSubmit={(event) => handleAddSubtask(event, activity.id)}
                  >
                    <label htmlFor={`new-subtask-${activity.id}`}>
                      Nova etapa
                    </label>
                    <div className="subtask-add-row">
                      <input
                        id={`new-subtask-${activity.id}`}
                        type="text"
                        value={newSubtaskTitles[activity.id] ?? ""}
                        onChange={(event) =>
                          setNewSubtaskTitles((current) => ({
                            ...current,
                            [activity.id]: event.target.value,
                          }))
                        }
                        autoComplete="off"
                      />
                      <button type="submit" className="secondary-button">
                        Adicionar etapa
                      </button>
                    </div>
                  </form>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
