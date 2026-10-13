import { useState } from 'react';
import ExerciseRunner from './components/activities/ExerciseRunner';
import type { ExerciseType, DifficultyLevel, Manipulative, AnswerMode } from './types';

const TYPES: { value: ExerciseType; label: string }[] = [
  { value: 'represent', label: 'Representar' },
  { value: 'identify', label: 'Identificar' },
];

const MODES: { value: AnswerMode; label: string }[] = [
  { value: 'free', label: 'Libre' },
  { value: 'drag', label: 'Con opciones' },
];

const MANIPULATIVES: { value: Manipulative; label: string; for: ExerciseType[] }[] = [
  { value: 'rekenrek', label: 'Rekenrek', for: ['represent', 'identify'] },
  { value: 'abacus', label: 'Ábaco', for: ['represent', 'identify'] },
  { value: 'tenframe', label: 'Marco de diez', for: ['represent', 'identify'] },
  { value: 'numberline', label: 'Recta numérica', for: ['identify'] },
];

// Demo temporal de la tarea 11. Se sustituye en la tarea 15 con la navegación real.
export default function App() {
  const [type, setType] = useState<ExerciseType>('represent');
  const [manipulative, setManipulative] = useState<Manipulative>('rekenrek');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(2);
  const [mode, setMode] = useState<AnswerMode>('free');
  const [done, setDone] = useState(false);
  const [runId, setRunId] = useState(0);

  const validManipulatives = MANIPULATIVES.filter((m) => m.for.includes(type));
  const safeManipulative = validManipulatives.some((m) => m.value === manipulative)
    ? manipulative
    : validManipulatives[0]!.value;

  const restart = () => {
    setDone(false);
    setRunId((n) => n + 1);
  };

  const select = 'cursor-pointer rounded border px-2 py-1';

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Mathlab</h1>
      <p>Demo temporal task-11: representar e identificar.</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          aria-label="Tipo"
          value={type}
          onChange={(e) => {
            setType(e.target.value as ExerciseType);
            restart();
          }}
          className={select}
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Manipulativo"
          value={safeManipulative}
          onChange={(e) => {
            setManipulative(e.target.value as Manipulative);
            restart();
          }}
          className={select}
        >
          {validManipulatives.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Dificultad"
          value={difficulty}
          onChange={(e) => {
            setDifficulty(Number(e.target.value) as DifficultyLevel);
            restart();
          }}
          className={select}
        >
          {[1, 2, 3, 4, 5].map((d) => (
            <option key={d} value={d}>
              Nivel {d}
            </option>
          ))}
        </select>
        <select
          aria-label="Modo"
          value={mode}
          onChange={(e) => {
            setMode(e.target.value as AnswerMode);
            restart();
          }}
          className={select}
        >
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        {done ? (
          <div>
            <p className="font-semibold text-green-700">¡Sesión completada!</p>
            <button
              onClick={restart}
              className="mt-2 cursor-pointer rounded border px-3 py-1"
            >
              Empezar de nuevo
            </button>
          </div>
        ) : (
          <ExerciseRunner
            key={`${type}-${safeManipulative}-${difficulty}-${mode}-${runId}`}
            exerciseType={type}
            difficulty={difficulty}
            manipulative={safeManipulative}
            answerMode={mode}
            exerciseCount={3}
            onComplete={() => setDone(true)}
          />
        )}
      </div>
    </div>
  );
}
