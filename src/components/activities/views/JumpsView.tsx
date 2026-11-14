import { useState } from 'react';
import type { Exercise, Answer } from '../../../engine/types';
import NumberLine from '../../manipulatives/NumberLine';

/**
 * T23-B2: vista de sumas y restas con saltos sobre la recta.
 *
 * El niño descompone la operación en los saltos que quiera (botones de tamaño
 * fijo) hasta llegar al resultado. Cada salto añade un arco; cualquier camino
 * que termine en el resultado vale. Regla de producto 6.1: el marcador de la
 * posición actual no lleva número; el niño lo lee en la recta.
 */
export default function JumpsView({
  exercise,
  locked,
  onAnswer,
}: {
  exercise: Exercise;
  /** true tras acertar: todos los botones se desactivan. Tras fallar se puede corregir. */
  locked: boolean;
  onAnswer: (a: Answer) => void;
}) {
  const isAdd = exercise.type === 'add';
  const sign = isAdd ? '+' : '−';
  const sense = isAdd ? 1 : -1;
  const operands = exercise.setup.operands ?? [0, 1];
  const start = operands[0]!;
  const [lo, hi] = exercise.setup.numberLineRange ?? [0, 10];
  const [positions, setPositions] = useState<number[]>([]);
  const current = positions[positions.length - 1] ?? start;

  const push = (next: number[]) => {
    setPositions(next);
    onAnswer(next);
  };

  const jump = (size: number) => push([...positions, current + sense * size]);

  const jumps = positions.map((to, i) => {
    const from = i === 0 ? start : positions[i - 1]!;
    return { from, to, color: '#6366F1', label: `${sign}${Math.abs(to - from)}` };
  });

  const markers = [
    { position: start, color: '#3B82F6', label: String(start) },
    // Sin label a propósito (6.1): el resultado no se muestra.
    ...(positions.length > 0 ? [{ position: current, color: '#EF4444' }] : []),
  ];

  const btnClass =
    'min-h-11 min-w-11 cursor-pointer rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-base font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="flex flex-col items-center gap-4">
      <NumberLine
        min={lo}
        max={hi}
        step={exercise.setup.numberLineStep ?? 1}
        showNumbers={exercise.setup.visibleNumbers ?? true}
        height={110}
        jumps={jumps}
        markers={markers}
      />
      <div className="flex flex-wrap items-center justify-center gap-2">
        {(exercise.setup.jumpSizes ?? []).map((size) => {
          const next = current + sense * size;
          return (
            <button
              key={size}
              type="button"
              data-testid={`jump-btn-${size}`}
              disabled={locked || next < lo || next > hi}
              onClick={() => jump(size)}
              className={btnClass}
            >
              {sign}
              {size}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          data-testid="jump-undo"
          disabled={locked || positions.length === 0}
          onClick={() => push(positions.slice(0, -1))}
          className={btnClass}
        >
          Deshacer
        </button>
        <button
          type="button"
          data-testid="jump-clear"
          disabled={locked}
          onClick={() => push([])}
          className={btnClass}
        >
          Empezar de nuevo
        </button>
      </div>
    </div>
  );
}
