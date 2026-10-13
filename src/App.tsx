import { useState } from 'react';
import TenFrame from './components/manipulatives/TenFrame';

// Demo temporal de la tarea 06. Se sustituye en la tarea 15 con la navegación real.
export default function App() {
  const [frameCount, setFrameCount] = useState<1 | 2>(1);
  const [value, setValue] = useState(7);

  const changeFrames = (n: 1 | 2) => {
    setFrameCount(n);
    setValue((v) => Math.min(v, n * 10));
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Mathlab</h1>
      <p>Demo temporal task-06: TenFrame.</p>

      <div className="mt-4 flex gap-2">
        {([1, 2] as const).map((n) => (
          <button
            key={n}
            onClick={() => changeFrames(n)}
            className={`cursor-pointer rounded border px-3 py-1 ${frameCount === n ? 'bg-indigo-200 font-bold' : ''}`}
          >
            {n} {n === 1 ? 'marco (hasta 10)' : 'marcos (hasta 20)'}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <TenFrame frames={frameCount} value={value} onChange={setValue} />
      </div>
    </div>
  );
}
