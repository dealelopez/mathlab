import { useState } from 'react';
import Abacus from './components/manipulatives/Abacus';
import AbacusTutorial from './components/tutorial/AbacusTutorial';

// Demo temporal de la tarea 05. Se sustituye en la tarea 15 con la navegación real.
export default function App() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [number, setNumber] = useState(347);
  const [done, setDone] = useState(false);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Mathlab</h1>
      <p>Demo temporal task-05: Ábaco + tutorial.</p>

      <div className="mt-4">
        <button
          onClick={() => {
            setShowTutorial((s) => !s);
            setDone(false);
          }}
          className="rounded bg-blue-600 px-3 py-1 text-white"
        >
          {showTutorial ? 'Ver ábaco libre' : 'Abrir tutorial'}
        </button>
      </div>

      <div className="mt-4">
        {showTutorial ? (
          done ? (
            <div>
              <p className="font-semibold text-green-700">¡Tutorial completado!</p>
              <button
                onClick={() => {
                  setDone(false);
                  setShowTutorial(false);
                }}
                className="mt-2 rounded border px-3 py-1"
              >
                Volver al ábaco
              </button>
            </div>
          ) : (
            <AbacusTutorial
              onComplete={() => setDone(true)}
              onBack={() => setShowTutorial(false)}
            />
          )
        ) : (
          <div>
            <Abacus
              columns={[
                { label: 'C', color: '#3B82F6' },
                { label: 'D', color: '#10B981' },
                { label: 'U', color: '#EF4444' },
              ]}
              value={number}
              onChange={setNumber}
            />
            <p className="mt-2 font-mono text-sm">número: {number}</p>
          </div>
        )}
      </div>
    </div>
  );
}
