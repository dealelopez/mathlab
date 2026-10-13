import type { ReactNode } from 'react';
import FeedbackBanner from './FeedbackBanner';

export interface ActivityShellProps {
  /** Texto de instrucción para el niño */
  instruction: string;
  /** El manipulativo o ejercicio (se renderiza en el centro) */
  children: ReactNode;
  /** Callback al pulsar "Comprobar" */
  onCheck: () => void;
  /** Tipo de feedback actual (null = no mostrar) */
  feedback: 'correct' | 'incorrect' | null;
  /** Mensaje de feedback */
  feedbackMessage?: string;
  /** Callback para pasar al siguiente ejercicio */
  onNext: () => void;
  /** Pista opcional (se muestra con el feedback incorrecto) */
  hint?: string;
  /** Número de ejercicio actual (para progreso) */
  exerciseNumber: number;
  /** Total de ejercicios en la sesión */
  totalExercises: number;
  /** Mostrar botón comprobar (default true). En false, la validación es automática */
  showCheckButton?: boolean;
}

/**
 * ActivityShell — contenedor genérico de actividades guiadas.
 * No sabe qué manipulativo contiene: instrucción, comprobar, feedback y progreso.
 */
export default function ActivityShell({
  instruction,
  children,
  onCheck,
  feedback,
  feedbackMessage,
  onNext,
  hint,
  exerciseNumber,
  totalExercises,
  showCheckButton = true,
}: ActivityShellProps) {
  const showCheck = showCheckButton && feedback !== 'correct';

  return (
    <div className="flex max-w-2xl flex-col gap-4 rounded-xl border p-4">
      <p data-testid="activity-instruction" className="text-xl font-semibold">
        {instruction}
      </p>

      <div className="flex-grow">{children}</div>

      <div className="flex items-center justify-between">
        <div>
          {showCheck && (
            <button
              onClick={onCheck}
              className="cursor-pointer rounded-lg bg-blue-600 px-5 py-2 text-lg font-bold text-white"
            >
              Comprobar
            </button>
          )}
        </div>
        <span data-testid="activity-progress" className="text-sm tabular-nums text-slate-600">
          {exerciseNumber} / {totalExercises}
        </span>
      </div>

      {feedback !== null && (
        <div className="flex flex-col gap-2">
          <FeedbackBanner
            type={feedback}
            message={feedbackMessage ?? (feedback === 'correct' ? '¡Bien hecho!' : 'Casi... ¡inténtalo de nuevo!')}
          />
          {feedback === 'incorrect' && hint && (
            <FeedbackBanner type="hint" message={hint} testId="feedback-hint" />
          )}
          <div>
            <button
              onClick={onNext}
              className="cursor-pointer rounded-lg bg-green-600 px-5 py-2 text-lg font-bold text-white"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
