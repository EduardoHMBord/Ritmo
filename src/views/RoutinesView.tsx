import { useState, type FormEvent } from "react";
import type { Routine, Weekday } from "../types";
import { hasAtLeastOneWeekday, hasNonEmptyText } from "../utils/validation";
import { WEEKDAY_OPTIONS, formatWeekdays } from "../utils/weekdays";

type RoutineFormValues = {
  name: string;
  description: string;
  weekdays: Weekday[];
};

type RoutineFormErrors = {
  name?: string;
  weekdays?: string;
};

type RoutinesViewProps = {
  routines: Routine[];
  onCreateRoutine: (input: RoutineFormValues) => void;
  onUpdateRoutine: (routineId: string, input: RoutineFormValues) => void;
  onDeleteRoutine: (routineId: string) => void;
  onOpenRoutine: (routineId: string) => void;
};

const EMPTY_FORM: RoutineFormValues = {
  name: "",
  description: "",
  weekdays: [],
};

function validateRoutineForm(values: RoutineFormValues): RoutineFormErrors {
  const errors: RoutineFormErrors = {};

  if (!hasNonEmptyText(values.name)) {
    errors.name = "Informe um nome para a rotina.";
  }

  if (!hasAtLeastOneWeekday(values.weekdays)) {
    errors.weekdays = "Selecione pelo menos um dia da semana.";
  }

  return errors;
}

export function RoutinesView({
  routines,
  onCreateRoutine,
  onUpdateRoutine,
  onDeleteRoutine,
  onOpenRoutine,
}: RoutinesViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [values, setValues] = useState<RoutineFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<RoutineFormErrors>({});

  const isEditing = editingRoutineId !== null;

  function resetForm(): void {
    setValues(EMPTY_FORM);
    setErrors({});
    setEditingRoutineId(null);
    setIsFormOpen(false);
  }

  function startCreate(): void {
    setValues(EMPTY_FORM);
    setErrors({});
    setEditingRoutineId(null);
    setIsFormOpen(true);
  }

  function startEdit(routine: Routine): void {
    setValues({
      name: routine.name,
      description: routine.description ?? "",
      weekdays: [...routine.weekdays],
    });
    setErrors({});
    setEditingRoutineId(routine.id);
    setIsFormOpen(true);
  }

  function handleWeekdayToggle(weekday: Weekday, checked: boolean): void {
    setValues((current) => {
      const weekdays = checked
        ? [...current.weekdays, weekday]
        : current.weekdays.filter((item) => item !== weekday);
      return { ...current, weekdays };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const nextErrors = validateRoutineForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (editingRoutineId) {
      onUpdateRoutine(editingRoutineId, values);
    } else {
      onCreateRoutine(values);
    }

    resetForm();
  }

  function handleDelete(routine: Routine): void {
    const confirmed = window.confirm(
      `Excluir a rotina "${routine.name}"? As atividades e etapas dessa rotina também serão removidas.`,
    );
    if (confirmed) {
      onDeleteRoutine(routine.id);
      if (editingRoutineId === routine.id) {
        resetForm();
      }
    }
  }

  return (
    <section aria-labelledby="routines-title">
      <div className="view-header">
        <h1 id="routines-title">Gerenciamento de rotinas</h1>
        {!isFormOpen && (
          <button type="button" className="primary-button" onClick={startCreate}>
            Criar rotina
          </button>
        )}
      </div>

      {isFormOpen && (
        <form className="card-form" onSubmit={handleSubmit} noValidate>
          <h2>{isEditing ? "Editar rotina" : "Nova rotina"}</h2>

          <div className="form-field">
            <label htmlFor="routine-name">Nome da rotina</label>
            <input
              id="routine-name"
              name="name"
              type="text"
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({ ...current, name: event.target.value }))
              }
              aria-invalid={errors.name ? "true" : undefined}
              aria-describedby={errors.name ? "routine-name-error" : undefined}
              autoComplete="off"
              required
            />
            {errors.name && (
              <p id="routine-name-error" className="field-error" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="routine-description">Descrição (opcional)</label>
            <textarea
              id="routine-description"
              name="description"
              value={values.description}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={3}
            />
          </div>

          <fieldset
            className="form-field"
            aria-describedby={errors.weekdays ? "routine-weekdays-error" : undefined}
          >
            <legend>Dias da semana</legend>
            <p className="field-hint">Selecione pelo menos um dia.</p>
            <div className="checkbox-grid">
              {WEEKDAY_OPTIONS.map((option) => {
                const checked = values.weekdays.includes(option.value);
                return (
                  <label key={option.value} className="checkbox-item">
                    <input
                      type="checkbox"
                      name="weekdays"
                      value={option.value}
                      checked={checked}
                      onChange={(event) =>
                        handleWeekdayToggle(option.value, event.target.checked)
                      }
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>
            {errors.weekdays && (
              <p id="routine-weekdays-error" className="field-error" role="alert">
                {errors.weekdays}
              </p>
            )}
          </fieldset>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              {isEditing ? "Salvar alterações" : "Salvar rotina"}
            </button>
            <button type="button" className="secondary-button" onClick={resetForm}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {routines.length === 0 ? (
        <div className="empty-state" role="status">
          <h2>Nenhuma rotina cadastrada</h2>
          <p>Crie uma rotina para organizar suas atividades por dia da semana.</p>
          {!isFormOpen && (
            <button type="button" className="primary-button" onClick={startCreate}>
              Criar rotina
            </button>
          )}
        </div>
      ) : (
        <ul className="item-list" aria-label="Lista de rotinas">
          {routines.map((routine) => (
            <li key={routine.id} className="item-card">
              <div className="item-card-content">
                <h2 className="item-title">{routine.name}</h2>
                {routine.description && <p>{routine.description}</p>}
                <p>
                  <strong>Dias:</strong> {formatWeekdays(routine.weekdays)}
                </p>
                <p>
                  <strong>Atividades:</strong> {routine.activities.length}
                </p>
              </div>
              <div className="item-actions" aria-label={`Ações da rotina ${routine.name}`}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onOpenRoutine(routine.id)}
                >
                  Abrir atividades
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => startEdit(routine)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => handleDelete(routine)}
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
