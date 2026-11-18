import type { DailyProgress, Routine } from "../types";
import {
  countCompletedActivities,
  findDailyProgress,
  getRoutineProgressPercent,
  isActivityCompleted,
} from "../utils/progress";
import { formatDateLongPtBr, getWeekdayFromDate } from "../utils/dates";

type HomeViewProps = {
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

export function HomeView({
  routines,
  dailyProgress,
  todayDate,
  onGoToRoutines,
  onToggleActivityCompletion,
  onToggleSubtaskCompletion,
}: HomeViewProps) {
  const today = parseLocalDate(todayDate);
  const todayWeekday = getWeekdayFromDate(today);
  const todaysRoutines = routines.filter((routine) =>
    routine.weekdays.includes(todayWeekday),
  );

  return (
    <section aria-labelledby="home-title">
      <div className="view-header">
        <div>
          <h1 id="home-title">Página inicial</h1>
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
            Não há rotinas programadas para o dia atual. Você pode criar uma
            nova rotina ou alterar os dias de uma rotina existente.
          </p>
          <div className="form-actions" style={{ justifyContent: "center" }}>
            <button type="button" className="primary-button" onClick={onGoToRoutines}>
              Criar ou ajustar rotinas
            </button>
          </div>
        </div>
      ) : (
        <div className="home-routines">
          {todaysRoutines.map((routine) => {
            const progress = findDailyProgress(
              dailyProgress,
              todayDate,
              routine.id,
            );
            const progressPercent = getRoutineProgressPercent(routine, progress);
            const completedCount = countCompletedActivities(routine, progress);
            const activities = [...routine.activities].sort(
              (a, b) => a.order - b.order,
            );

            return (
              <article key={routine.id} className="item-card routine-day-card">
                <header className="routine-day-header">
                  <h2 className="item-title">{routine.name}</h2>
                  {progressPercent === null ? (
                    <p>
                      <strong>Progresso:</strong> Nenhuma atividade cadastrada
                    </p>
                  ) : (
                    <p>
                      <strong>Progresso:</strong> {completedCount} de{" "}
                      {routine.activities.length} atividades concluídas (
                      {progressPercent}%)
                    </p>
                  )}
                </header>

                {activities.length === 0 ? (
                  <p className="muted-text">Nenhuma atividade cadastrada nesta rotina.</p>
                ) : (
                  <ul className="activity-status-list" aria-label={`Atividades da rotina ${routine.name}`}>
                    {activities.map((activity) => {
                      const completed = isActivityCompleted(activity, progress);
                      const subtasks = [...activity.subtasks].sort(
                        (a, b) => a.order - b.order,
                      );

                      return (
                        <li key={activity.id} className="activity-status-item">
                          <div className="activity-status-main">
                            {activity.subtasks.length === 0 ? (
                              <label className="completion-label">
                                <input
                                  type="checkbox"
                                  checked={completed}
                                  onChange={() =>
                                    onToggleActivityCompletion(
                                      routine.id,
                                      activity.id,
                                      todayDate,
                                    )
                                  }
                                />
                                <span>
                                  {activity.icon ? `${activity.icon} ` : ""}
                                  {activity.title}
                                </span>
                              </label>
                            ) : (
                              <p className="activity-status-title">
                                <strong>
                                  {activity.icon ? `${activity.icon} ` : ""}
                                  {activity.title}
                                </strong>
                              </p>
                            )}
                            <p className="activity-state">
                              Estado: <strong>{completed ? "Concluída" : "Pendente"}</strong>
                            </p>
                            {activity.description && <p>{activity.description}</p>}
                            {activity.scheduledTime && (
                              <p>
                                <strong>Horário:</strong> {activity.scheduledTime}
                              </p>
                            )}
                          </div>

                          {subtasks.length > 0 && (
                            <ul
                              className="subtask-status-list"
                              aria-label={`Etapas de ${activity.title}`}
                            >
                              {subtasks.map((subtask) => {
                                const subtaskCompleted =
                                  progress?.completedSubtaskIds.includes(
                                    subtask.id,
                                  ) ?? false;
                                return (
                                  <li key={subtask.id} className="subtask-status-item">
                                    <label className="completion-label">
                                      <input
                                        type="checkbox"
                                        checked={subtaskCompleted}
                                        onChange={() =>
                                          onToggleSubtaskCompletion(
                                            routine.id,
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
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      )}

    </section>
  );
}
