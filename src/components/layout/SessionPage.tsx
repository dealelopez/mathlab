import { useState } from 'react';
import ExerciseRunner from '../activities/ExerciseRunner';
import type { ActivityConfig } from './types';

export interface SessionPageProps {
  config: ActivityConfig;
  /** Vuelve a la página desde la que se lanzó la sesión */
  onBack: () => void;
}

/** Sesión de ejercicios. Al terminar ofrece repetir o volver. */
export default function SessionPage({ config, onBack }: SessionPageProps) {
  const [done, setDone] = useState(false);
  const [runId, setRunId] = useState(0);

  if (done) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-2xl font-bold text-green-700">¡Sesión completada!</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setDone(false);
              setRunId((n) => n + 1);
            }}
            className="min-h-11 cursor-pointer rounded-lg bg-blue-600 px-5 py-2 text-lg font-bold text-white"
          >
            Repetir
          </button>
          <button
            type="button"
            onClick={onBack}
            className="min-h-11 cursor-pointer rounded-lg border-2 border-slate-300 bg-white px-5 py-2 text-lg font-bold"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <ExerciseRunner
      key={runId}
      {...config}
      onComplete={() => setDone(true)}
      onBack={onBack}
    />
  );
}
