import { useState } from 'react';
import type { Answer } from '../../../engine/types';
import { TileSlots } from '../../primitives/NumberTiles';

/** Identify libre: un hueco por cifra + dígitos 0-9 reutilizables.
 *  Mismo componente y gestos que decompose (tocar hueco + número, sustituir). */
export default function IdentifyFree({
  digitCount,
  onAnswer,
}: {
  digitCount: number;
  onAnswer: (a: Answer | null) => void;
}) {
  const [digits, setDigits] = useState<(number | null)[]>(() =>
    Array.from({ length: Math.max(1, Math.min(3, digitCount)) }, () => null),
  );

  const commit = (next: (number | null)[]) => {
    setDigits(next);
    onAnswer(
      next.every((d): d is number => typeof d === 'number') ? Number(next.join('')) : null,
    );
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-lg font-semibold">Tu respuesta:</span>
      <TileSlots
        prefix="islot"
        slots={digits}
        options={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
        reusableOptions
        onDropSlot={(i, v) => {
          const next = [...digits];
          next[i] = v;
          commit(next);
        }}
        onClearSlot={(i) => {
          const next = [...digits];
          next[i] = null;
          commit(next);
        }}
        hint="Toca un hueco y luego un número."
      />
    </div>
  );
}
