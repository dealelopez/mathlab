import { useState } from 'react';
import type { AnswerMode, DifficultyLevel, ExerciseType, Manipulative } from '../../types';
import { getAvailableLevels, getDifficultyConfig } from '../../engine/difficulty';
import Navigation from './Navigation';
import OptionGroup from './OptionGroup';
import { EXERCISE_LABELS, EXERCISES_WITH_ANSWER_MODE } from './catalog';
import type { ActivityConfig } from './types';

export interface ActivitiesPageProps {
  /** Título de la página (ej: "Rekenrek — Actividades") */
  title: string;
  /** Tipos de ejercicio entre los que elegir */
  exerciseTypes: ExerciseType[];
  /** Manipulativo del que cuelga la página (condiciona los niveles disponibles) */
  manipulative?: Manipulative;
  onStart: (config: ActivityConfig) => void;
  onBack: () => void;
}

/** Elige tipo, nivel y modo de respuesta, y lanza la sesión con "Empezar". */
export default function ActivitiesPage({
  title,
  exerciseTypes,
  manipulative,
  onStart,
  onBack,
}: ActivitiesPageProps) {
  const [exerciseType, setExerciseType] = useState<ExerciseType>(exerciseTypes[0]!);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1);
  const [answerMode, setAnswerMode] = useState<AnswerMode>('drag');

  // El rekenrek y el marco de diez no llegan a los niveles con números grandes.
  const levels = getAvailableLevels(exerciseType, manipulative);
  const level = levels.includes(difficulty) ? difficulty : levels[levels.length - 1]!;
  const [lo, hi] = getDifficultyConfig(exerciseType, level).numberRange;
  const showMode = EXERCISES_WITH_ANSWER_MODE.includes(exerciseType);

  return (
    <div className="flex flex-col gap-4">
      <Navigation title={title} onBack={onBack} />

      {exerciseTypes.length > 1 && (
        <OptionGroup
          label="Ejercicio"
          options={exerciseTypes.map((t) => ({ value: t, label: EXERCISE_LABELS[t] }))}
          value={exerciseType}
          onChange={setExerciseType}
        />
      )}

      <div className="flex flex-col gap-1">
        <OptionGroup
          label="Nivel"
          options={levels.map((l) => ({ value: l, label: String(l) }))}
          value={level}
          onChange={setDifficulty}
        />
        <p className="text-sm text-slate-600">
          Números del {lo} al {hi}
        </p>
      </div>

      {showMode && (
        <OptionGroup
          label="Respuesta"
          options={[
            { value: 'drag', label: 'Con opciones' },
            { value: 'free', label: 'Libre' },
          ]}
          value={answerMode}
          onChange={setAnswerMode}
        />
      )}

      <div>
        <button
          type="button"
          onClick={() => onStart({ exerciseType, difficulty: level, manipulative, answerMode })}
          className="min-h-11 cursor-pointer rounded-lg bg-green-600 px-6 py-2 text-lg font-bold text-white"
        >
          Empezar
        </button>
      </div>
    </div>
  );
}
