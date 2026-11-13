import { useState } from 'react';
import type { Exercise, Answer } from '../../../engine/types';
import { visibleNumbersFor } from '../../../engine/generators/placement';
import Rekenrek from '../../manipulatives/Rekenrek';
import Abacus from '../../manipulatives/Abacus';
import { toAbacusColumns } from '../../manipulatives/abacusColumns';
import TenFrame from '../../manipulatives/TenFrame';
import NumberLine from '../../manipulatives/NumberLine';

interface ManipulativeConfig {
  rekenrekRows?: number;
  abacusColumns?: string[];
  tenFrameCount?: number;
  numberLineRange?: [number, number];
}

/** Renderiza el manipulativo de represent/identify desde el setup. */
export default function ManipulativeView({
  exercise,
  onAnswer,
}: {
  exercise: Exercise;
  onAnswer: (a: Answer) => void;
}) {
  const cfg = (exercise.setup.manipulativeConfig ?? {}) as ManipulativeConfig;
  const readOnly = exercise.setup.readOnly ?? false;
  const [val, setVal] = useState<number>(exercise.setup.initialValue ?? 0);
  const manipulative = exercise.setup.manipulative ?? exercise.manipulative;
  // En identify el valor mostrado ES la respuesta: el niño debe contarlo en las cuentas,
  // fichas o marcas, así que no se escribe el número (total, cifras ni valor).
  // En represent sí se muestra el valor que el niño va construyendo.
  const showValue = exercise.type !== 'identify';

  const commit = (v: number) => {
    setVal(v);
    onAnswer(v);
  };

  if (manipulative === 'rekenrek') {
    return (
      <Rekenrek
        rows={cfg.rekenrekRows ?? 2}
        value={val}
        onChange={(_values, total) => commit(total)}
        readOnly={readOnly}
        showTotal={showValue}
      />
    );
  }
  if (manipulative === 'abacus') {
    return (
      <Abacus
        columns={toAbacusColumns(cfg.abacusColumns ?? ['U'])}
        value={val}
        onChange={commit}
        readOnly={readOnly}
        showNumber={showValue}
      />
    );
  }
  if (manipulative === 'tenframe') {
    return (
      <TenFrame
        frames={cfg.tenFrameCount ?? 1}
        value={val}
        onChange={commit}
        readOnly={readOnly}
        showValue={showValue}
      />
    );
  }
  // numberline (identify): marcador fijo de solo lectura, con rótulos graduados
  const [lo, hi] = cfg.numberLineRange ?? [0, 10];
  return (
    <NumberLine
      min={lo}
      max={hi}
      showNumbers={visibleNumbersFor(lo, hi)}
      markers={[{ position: exercise.setup.initialValue ?? 0, color: '#3B82F6' }]}
    />
  );
}
