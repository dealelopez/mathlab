import { Fragment, useState } from 'react';
import type { Exercise, Answer } from '../../../engine/types';
import { DragDropProvider } from '../../primitives/DragDropContext';
import { NumberTile, TileSlots, TileChip, tileClass, useTileDrop } from '../../primitives/NumberTiles';

/** Tira libre de decompose: ecuación + dígitos 0-9 que se tocan O arrastran. */
function DecomposeStrip({
  target,
  slots,
  selected,
  prefilledIndex,
  onSelectSlot,
  onDigit,
  onClear,
  onDropAt,
}: {
  target: number;
  slots: (number | null)[];
  selected: number;
  prefilledIndex: number;
  onSelectSlot: (index: number) => void;
  onDigit: (d: number) => void;
  onClear: () => void;
  onDropAt: (index: number, value: number) => void;
}) {
  return (
    <DragDropProvider>
      <DecomposeStripInner
        target={target}
        slots={slots}
        selected={selected}
        prefilledIndex={prefilledIndex}
        onSelectSlot={onSelectSlot}
        onDigit={onDigit}
        onClear={onClear}
        onDropAt={onDropAt}
      />
    </DragDropProvider>
  );
}

function DecomposeStripInner(props: {
  target: number;
  slots: (number | null)[];
  selected: number;
  prefilledIndex: number;
  onSelectSlot: (index: number) => void;
  onDigit: (d: number) => void;
  onClear: () => void;
  onDropAt: (index: number, value: number) => void;
}) {
  const { target, slots, selected, prefilledIndex, onSelectSlot, onDigit, onClear, onDropAt } =
    props;
  useTileDrop('dslot', onDropAt);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-center gap-2">
        <span className="text-4xl font-bold text-orange-500">{target} =</span>
        {slots.map((v, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="text-3xl font-bold text-slate-400">+</span>}
            <div
              onClick={i !== prefilledIndex ? () => onSelectSlot(i) : undefined}
              style={i !== prefilledIndex ? { cursor: 'pointer' } : undefined}
              title={i !== prefilledIndex ? 'Toca para elegir este hueco' : undefined}
            >
              <NumberTile
                kind={i === prefilledIndex ? 'fixed' : v === null ? 'empty' : 'placed'}
                value={v}
                testId="answer-slot"
                slotId={`dslot-${i}`}
                selected={i === selected && i !== prefilledIndex}
                readOnly={i === prefilledIndex}
              />
            </div>
          </Fragment>
        ))}
      </div>
      <div data-testid="decompose-strip" className="flex flex-wrap justify-center gap-2">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <TileChip
            key={d}
            prefix="strip"
            index={d}
            value={d}
            testId={`strip-${d}`}
            highlight={slots.includes(d)}
            onPlace={(_i, v) => onDigit(v)}
          />
        ))}
        <button
          data-testid="strip-clear"
          onClick={onClear}
          aria-label="Borrar"
          className={`${tileClass('option')} cursor-pointer text-2xl font-bold text-slate-900`}
        >
          ⌫
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Toca un hueco y luego un número, o arrastra el número al hueco. Toca ⌫ para borrar el
        hueco elegido.
      </p>
    </div>
  );
}

/** "N = ___ + ___": tira de dígitos o widget unificado de huecos + opciones. */
export default function DecomposeView({
  exercise,
  onAnswer,
}: {
  exercise: Exercise;
  onAnswer: (a: Answer) => void;
}) {
  const parts = exercise.setup.parts ?? (exercise.correctAnswer as number[]).length;
  const target = (exercise.correctAnswer as number[]).reduce((a, b) => a + b, 0);
  // Índice pre-rellenado en dificultades bajas (el resto los rellena el niño)
  const prefilledIndex = exercise.setup.prefilledValue != null ? 0 : -1;
  const [slots, setSlots] = useState<(number | null)[]>(() => {
    const init: (number | null)[] = Array.from({ length: parts }, () => null);
    if (exercise.setup.prefilledValue != null) init[0] = exercise.setup.prefilledValue;
    return init;
  });
  // Hueco seleccionado para la tira de dígitos (fijo hasta tocar otro).
  // Sin auto-avance: pulsar un dígito sustituye el valor del seleccionado.
  const [selected, setSelected] = useState(() => (prefilledIndex === 0 ? 1 : 0));

  const commit = (next: (number | null)[]) => {
    setSlots(next);
    onAnswer(next as number[]);
  };

  const pressDigit = (d: number) => {
    if (selected === prefilledIndex) return;
    const next = [...slots];
    next[selected] = d;
    commit(next);
  };

  const pressClear = () => {
    if (selected === prefilledIndex) return;
    const next = [...slots];
    next[selected] = null;
    commit(next);
  };

  if (exercise.answerMode === 'free') {
    return (
      <DecomposeStrip
        target={target}
        slots={slots}
        selected={selected}
        prefilledIndex={prefilledIndex}
        onSelectSlot={setSelected}
        onDigit={pressDigit}
        onClear={pressClear}
        onDropAt={(i, v) => {
          if (i === prefilledIndex) return;
          const next = [...slots];
          next[i] = v;
          commit(next);
        }}
      />
    );
  }

  const handleDropSlot = (index: number, value: number) => {
    if (index < 0 || index >= slots.length || index === prefilledIndex) return;
    const next = [...slots];
    next[index] = value;
    commit(next);
  };

  const handleClearSlot = (index: number) => {
    if (index === prefilledIndex) return;
    const next = [...slots];
    next[index] = null;
    commit(next);
  };

  return (
    <TileSlots
      prefix="dslot"
      slots={slots}
      options={exercise.setup.options ?? []}
      onDropSlot={handleDropSlot}
      onClearSlot={handleClearSlot}
      lockedIndexes={prefilledIndex >= 0 ? [prefilledIndex] : []}
      lead={<span className="text-4xl font-bold text-orange-500">{target} =</span>}
      separator={<span className="text-3xl font-bold text-slate-400">+</span>}
      hint="Arrastra un número a cada hueco o tócalo y luego toca un hueco. Toca un hueco lleno para vaciarlo."
    />
  );
}
