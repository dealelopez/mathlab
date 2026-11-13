import { useState } from 'react';
import type { Exercise, Answer } from '../../../engine/types';
import NumberLine from '../../manipulatives/NumberLine';

/** "Coloca el N en la recta": validación automática al colocar. */
export default function PlacementView({
  exercise,
  locked,
  onAnswer,
  onAutoCheck,
}: {
  exercise: Exercise;
  /** true tras acertar: la recta deja de aceptar toques. Tras fallar se puede reintentar. */
  locked: boolean;
  onAnswer: (a: Answer) => void;
  onAutoCheck: (a: Answer) => void;
}) {
  const [lo, hi] = exercise.setup.numberLineRange ?? [0, 10];
  const [pos, setPos] = useState<number | null>(null);

  return (
    <NumberLine
      min={lo}
      max={hi}
      showNumbers={exercise.setup.visibleNumbers ?? true}
      interactive="place"
      readOnly={locked}
      markers={pos === null ? [] : [{ position: pos, color: '#EF4444', label: String(pos) }]}
      onPlaceMarker={(p) => {
        setPos(p);
        onAnswer(p);
        onAutoCheck(p);
      }}
    />
  );
}
