import { useState } from 'react';
import ExerciseRunner from './components/activities/ExerciseRunner';

// Demo temporal de la tarea 10. Se sustituye en la tarea 15 con la navegación real.
export default function App() {
  const [done, setDone] = useState(false);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Mathlab</h1>
      <p>Demo temporal task-10: sesión de ejercicios.</p>

      <div className="mt-4">
        {done ? (
          <div>
            <p className="font-semibold text-green-700">¡Sesión completada!</p>
            <button
              onClick={() => setDone(false)}
              className="mt-2 cursor-pointer rounded border px-3 py-1"
            >
              Empezar de nuevo
            </button>
          </div>
        ) : (
          <ExerciseRunner
            key={String(done)}
            exerciseType="represent"
            difficulty={2}
            exerciseCount={3}
            onComplete={() => setDone(true)}
            onBack={() => {}}
          />
        )}
      </div>
    </div>
  );
}
