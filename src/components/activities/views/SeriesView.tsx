import { Fragment, useState } from 'react';
import type { Exercise, Answer } from '../../../engine/types';
import AnswerSlot from '../../primitives/AnswerSlot';
import { TileSlots } from '../../primitives/NumberTiles';

/** "Completa la serie": huecos en línea + widget unificado (drag o tira). */
export default function SeriesView({
  exercise,
  onAnswer,
}: {
  exercise: Exercise;
  onAnswer: (a: Answer) => void;
}) {
  const visibleValues = exercise.setup.visibleValues ?? [];
  const hiddenCount = (exercise.correctAnswer as number[]).length;
  const [hiddenAnswers, setHiddenAnswers] = useState<(number | null)[]>(
    Array.from({ length: hiddenCount }, () => null),
  );

  const commit = (next: (number | null)[]) => {
    setHiddenAnswers(next);
    onAnswer(next as number[]);
  };

  if (exercise.answerMode === 'free') {
    let k = -1;
    return (
      <div className="flex flex-wrap items-center gap-2">
        {visibleValues.map((v, i) =>
          v !== null ? (
            <span
              key={i}
              className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-2xl font-bold tabular-nums"
            >
              {v}
            </span>
          ) : (
            (() => {
              k++;
              const idx = k;
              return (
                <AnswerSlot
                  key={i}
                  id={`sslot-${idx}`}
                  value={hiddenAnswers[idx] ?? null}
                  onChange={(nv) => {
                    const next = [...hiddenAnswers];
                    next[idx] = nv;
                    commit(next);
                  }}
                  mode="input"
                />
              );
            })()
          ),
        )}
      </div>
    );
  }

  const handleDropSlot = (hiddenIndex: number, value: number) => {
    if (hiddenIndex < 0 || hiddenIndex >= hiddenAnswers.length) return;
    const next = [...hiddenAnswers];
    next[hiddenIndex] = value;
    commit(next);
  };

  return (
    <TileSlots
      prefix="sslot"
      slots={hiddenAnswers}
      options={exercise.setup.options ?? []}
      onDropSlot={handleDropSlot}
      hint="Arrastra un número a cada hueco o tócalo y luego toca un hueco."
      renderSlots={(slotNodes) => {
        let hiddenSeen = -1;
        return (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {visibleValues.map((v, i) =>
              v !== null ? (
                <span
                  key={`vis-${i}`}
                  className="flex h-[84px] w-16 items-center justify-center rounded-xl border-2 border-slate-300 bg-slate-50 text-2xl font-bold tabular-nums"
                >
                  {v}
                </span>
              ) : (
                <Fragment key={`hid-${i}`}>{slotNodes[++hiddenSeen]}</Fragment>
              ),
            )}
          </div>
        );
      }}
    />
  );
}
