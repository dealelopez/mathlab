import { useState } from 'react';
import BeadRow from './components/primitives/BeadRow';

// Demo temporal de la tarea 03. Se sustituye en la tarea 15 con la navegación real.
export default function App() {
  const [rekenrek, setRekenrek] = useState(5);
  const [abaco, setAbaco] = useState(7);
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Mathlab</h1>
      <p>Demo temporal task-03: BeadRow.</p>

      <div className="mt-4">
        <h2 className="font-semibold">Rekenrek (5 rojas + 5 blancas)</h2>
        <BeadRow value={rekenrek} onChange={setRekenrek} colorSplit={5} colors={['#EF4444', '#FAFAFA']} />
        <p className="font-mono text-sm">value: {rekenrek}</p>
      </div>

      <div className="mt-4">
        <h2 className="font-semibold">Ábaco (10 azules)</h2>
        <BeadRow value={abaco} onChange={setAbaco} colorSplit={10} colors={['#3B82F6']} />
        <p className="font-mono text-sm">value: {abaco}</p>
      </div>
    </div>
  );
}
