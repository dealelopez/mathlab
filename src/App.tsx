import { useState } from 'react';
import NumberLine from './components/manipulatives/NumberLine';

// Demo temporal de la tarea 07. Se sustituye en la tarea 15 con la navegación real.
export default function App() {
  const [marker, setMarker] = useState(7);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Mathlab</h1>
      <p>Demo temporal task-07: recta numérica.</p>

      <div className="mt-4">
        <NumberLine
          min={0}
          max={20}
          step={1}
          interactive="place"
          markers={[{ position: marker, color: '#EF4444', label: String(marker) }]}
          onPlaceMarker={setMarker}
          jumps={[
            { from: 3, to: 6, color: '#3B82F6' },
            { from: 6, to: 10, color: '#10B981' },
          ]}
        />
        <p className="mt-2 font-mono text-sm">marcador: {marker}</p>
        <button
          onClick={() => setMarker(7)}
          className="mt-2 cursor-pointer rounded border px-3 py-1"
        >
          Restablecer
        </button>
      </div>
    </div>
  );
}
