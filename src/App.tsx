import { useEffect, useState } from 'react';
import { DragDropProvider, useDragDrop } from './components/primitives/DragDropContext';
import AnswerChip from './components/primitives/AnswerChip';
import AnswerSlot from './components/primitives/AnswerSlot';

const CHIPS = [
  { id: 'chip-3', value: 3 },
  { id: 'chip-5', value: 5 },
  { id: 'chip-8', value: 8 },
];

/** Demo drag: registra el onDrop del contexto y pinta slots usados. */
function DragDemo() {
  const { setOnDrop } = useDragDrop();
  const [slots, setSlots] = useState<(number | null)[]>([null, null]);

  useEffect(() => {
    setOnDrop((slotId, value) => {
      const idx = Number(slotId);
      if (Number.isInteger(idx) && idx >= 0 && idx < 2) {
        setSlots((prev) => {
          const next = [...prev];
          next[idx] = value;
          return next;
        });
      }
    });
    return () => setOnDrop(null);
  }, [setOnDrop]);

  return (
    <div>
      <div className="flex gap-2">
        {CHIPS.map((c) => (
          <AnswerChip key={c.id} id={c.id} value={c.value} used={slots.includes(c.value)} />
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        {slots.map((v, i) => (
          <AnswerSlot
            key={i}
            id={String(i)}
            value={v}
            onChange={(nv) =>
              setSlots((prev) => {
                const next = [...prev];
                next[i] = nv;
                return next;
              })
            }
            mode="drag-target"
          />
        ))}
      </div>
      <button
        onClick={() => setSlots([null, null])}
        className="mt-3 cursor-pointer rounded border px-3 py-1"
      >
        Limpiar
      </button>
    </div>
  );
}

// Demo temporal de la tarea 08. Se sustituye en la tarea 15 con la navegación real.
export default function App() {
  const [free, setFree] = useState<number | null>(null);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Mathlab</h1>
      <p>Demo temporal task-08: respuesta (chips + slots + pad).</p>

      <DragDropProvider>
        <div className="mt-4">
          <h2 className="font-semibold">Arrastra chips a los huecos</h2>
          <DragDemo />
        </div>
      </DragDropProvider>

      <div className="mt-6">
        <h2 className="font-semibold">Hueco libre con teclado</h2>
        <AnswerSlot id="free" value={free} onChange={setFree} mode="input" />
      </div>
    </div>
  );
}
