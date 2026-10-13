import Bead from './components/primitives/Bead';
import { usePointerDrag } from './hooks/usePointerDrag';

// Demo temporal de la tarea 02. Se sustituye en la tarea 15 con la navegación real.
export default function App() {
  const { isDragging, delta, handlePointerDown } = usePointerDrag({ axis: 'both' });
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Mathlab</h1>
      <p>Demo temporal task-02: Beads + drag.</p>

      <svg width={320} height={80} className="mt-4 border">
        <Bead cx={30} cy={40} r={14} color="#e53e3e" active />
        <Bead cx={70} cy={40} r={14} color="#e53e3e" />
        <Bead cx={110} cy={40} r={14} color="#ffffff" onClick={() => {}} />
      </svg>

      <div
        onPointerDown={handlePointerDown}
        style={{ touchAction: 'none' }}
        className="mt-4 inline-block cursor-grab border px-4 py-2 select-none"
      >
        {isDragging ? 'Arrastrando…' : 'Arrástrame (mouse o touch)'}
      </div>
      <p className="mt-2 font-mono text-sm">
        delta: x={delta.x}, y={delta.y}
      </p>
    </div>
  );
}
