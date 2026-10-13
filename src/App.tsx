import { useState } from 'react';
import Rekenrek from './components/manipulatives/Rekenrek';

// Demo temporal de la tarea 04. Se sustituye en la tarea 15 con la navegación real.
export default function App() {
  const [rowCount, setRowCount] = useState(2);
  const [values, setValues] = useState<number[]>([7, 3]);

  const changeRows = (n: number) => {
    setRowCount(n);
    setValues((prev) =>
      Array.from({ length: n }, (_, i) => (i < prev.length ? prev[i]! : 0)),
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Mathlab</h1>
      <p>Demo temporal task-04: Rekenrek.</p>

      <div className="mt-4 flex gap-2">
        {[1, 2, 5, 10].map((n) => (
          <button
            key={n}
            onClick={() => changeRows(n)}
            className={`rounded border px-3 py-1 ${rowCount === n ? 'bg-amber-200 font-bold' : ''}`}
          >
            {n} {n === 1 ? 'fila' : 'filas'}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <Rekenrek
          rows={rowCount}
          value={values}
          onChange={(v) => setValues(v)}
        />
      </div>
    </div>
  );
}
