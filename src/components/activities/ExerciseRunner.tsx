import { Fragment, useEffect, useState } from 'react';
import type {
  ExerciseType,
  DifficultyLevel,
  Manipulative,
  AnswerMode,
} from '../../types';
import type { Exercise, Answer } from '../../engine/types';
import { ExerciseEngine } from '../../engine/engine';
import { visibleNumbersFor } from '../../engine/generators/placement';
import ActivityShell from './ActivityShell';
import Rekenrek from '../manipulatives/Rekenrek';
import Abacus, { type AbacusColumn } from '../manipulatives/Abacus';
import TenFrame from '../manipulatives/TenFrame';
import NumberLine from '../manipulatives/NumberLine';
import AnswerSlot from '../primitives/AnswerSlot';
import { DragDropProvider } from '../primitives/DragDropContext';
import { NumberTile, TileSlots, TileChip, tileClass, useTileDrop } from '../primitives/NumberTiles';

export interface ExerciseRunnerProps {
  /** Tipo de ejercicio */
  exerciseType: ExerciseType;
  /** Nivel de dificultad */
  difficulty: DifficultyLevel;
  /** Manipulativo (si aplica) */
  manipulative?: Manipulative;
  /** Modo de respuesta (drag o free) */
  answerMode?: AnswerMode;
  /** Número de ejercicios por sesión (default 10) */
  exerciseCount?: number;
  /** Callback al completar todos los ejercicios */
  onComplete?: () => void;
  /** Callback para volver */
  onBack?: () => void;
}

const COLUMN_COLORS: Record<string, string> = {
  C: '#3B82F6',
  D: '#10B981',
  U: '#EF4444',
};

interface ManipulativeConfig {
  rekenrekRows?: number;
  abacusColumns?: string[];
  tenFrameCount?: number;
  numberLineRange?: [number, number];
}

function toAbacusColumns(labels: string[]): AbacusColumn[] {
  return labels.map((label) => ({ label, color: COLUMN_COLORS[label] ?? '#6366F1' }));
}

/** Renderiza el manipulativo de represent/identify desde el setup. */
function ManipulativeView({
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
function DecomposeView({
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

/** "Completa la serie": huecos en línea + widget unificado (drag o tira). */
function SeriesView({
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

/** Identify libre: un hueco por cifra + dígitos 0-9 reutilizables.
 *  Mismo componente y gestos que decompose (tocar hueco + número, sustituir). */
function IdentifyFree({
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

/** "Coloca el N en la recta": validación automática al colocar. */
function PlacementView({
  exercise,
  onAnswer,
  onAutoCheck,
}: {
  exercise: Exercise;
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
      markers={pos === null ? [] : [{ position: pos, color: '#EF4444', label: String(pos) }]}
      onPlaceMarker={(p) => {
        setPos(p);
        onAnswer(p);
        onAutoCheck(p);
      }}
    />
  );
}

/**
 * ExerciseRunner — puente entre el engine (datos) y la UI.
 * Genera ejercicios, renderiza el mapper correspondiente,
 * valida al comprobar y avanza la sesión.
 */
export default function ExerciseRunner({
  exerciseType,
  difficulty,
  manipulative,
  answerMode,
  exerciseCount = 10,
  onComplete,
  onBack,
}: ExerciseRunnerProps) {
  const [engine] = useState(() => new ExerciseEngine());
  const [current, setCurrent] = useState<Exercise>(() =>
    engine.generate(exerciseType, difficulty, manipulative, answerMode),
  );
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | undefined>(undefined);
  const [userAnswer, setUserAnswer] = useState<Answer | null>(null);

  const configKey = `${exerciseType}|${difficulty}|${manipulative ?? ''}|${answerMode ?? ''}`;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    engine.reset();
    setCurrent(engine.generate(exerciseType, difficulty, manipulative, answerMode));
    setIndex(0);
    setFeedback(null);
    setFeedbackMessage(undefined);
    setUserAnswer(null);
  }, [configKey]);

  const handleAnswer = (a: Answer | null) => {
    setUserAnswer(a);
    if (feedback === 'incorrect') {
      setFeedback(null);
      setFeedbackMessage(undefined);
    }
  };

  const check = (answer: Answer) => {
    const result = engine.validate(current, answer);
    setFeedback(result.correct ? 'correct' : 'incorrect');
    setFeedbackMessage(result.message);
  };

  const handleCheck = () => {
    // decompose/series responden con un array por hueco: si falta alguno,
    // avisar sin llamar al validador.
    if (current.type === 'decompose' || current.type === 'series') {
      const parts = userAnswer as (number | null)[] | null;
      if (parts === null || parts.some((p) => typeof p !== 'number')) {
        setFeedback('incorrect');
        setFeedbackMessage('Rellena todos los huecos para comprobar');
        return;
      }
    }
    check((userAnswer ?? 0) as Answer);
  };

  const handleNext = () => {
    if (index + 1 >= exerciseCount) {
      onComplete?.();
      return;
    }
    setCurrent(engine.generate(exerciseType, difficulty, manipulative, answerMode));
    setIndex((i) => i + 1);
    setFeedback(null);
    setFeedbackMessage(undefined);
    setUserAnswer(null);
  };

  const isPlacement = current.type === 'placement';

  return (
    <div className="flex flex-col gap-2">
      {onBack && (
        <div>
          <button
            onClick={onBack}
            className="cursor-pointer text-sm text-slate-600 underline"
          >
            Volver
          </button>
        </div>
      )}
      <ActivityShell
        instruction={current.instruction}
        onCheck={handleCheck}
        feedback={feedback}
        feedbackMessage={feedbackMessage}
        onNext={handleNext}
        hint={current.hints?.[0]}
        exerciseNumber={index + 1}
        totalExercises={exerciseCount}
        showCheckButton={!isPlacement}
      >
        {current.type === 'represent' && (
          <ManipulativeView key={current.id} exercise={current} onAnswer={handleAnswer} />
        )}
        {current.type === 'identify' && (
          <div className="flex flex-col items-center gap-4">
            <ManipulativeView key={current.id} exercise={current} onAnswer={() => {}} />
            {current.answerMode === 'drag' && (current.setup.options?.length ?? 0) > 0 ? (
              <TileSlots
                key={`drag-${current.id}`}
                prefix="islot"
                slots={[typeof userAnswer === 'number' ? userAnswer : null]}
                options={current.setup.options ?? []}
                onDropSlot={(_i, v) => handleAnswer(v)}
                onClearSlot={() => handleAnswer(null)}
                hint="Arrastra el número correcto al hueco o tócalo."
              />
            ) : (
              <IdentifyFree
                key={`free-${current.id}`}
                digitCount={String(current.setup.initialValue ?? 0).length}
                onAnswer={handleAnswer}
              />
            )}
          </div>
        )}
        {current.type === 'decompose' && (
          <DecomposeView key={current.id} exercise={current} onAnswer={handleAnswer} />
        )}
        {current.type === 'series' && (
          <SeriesView key={current.id} exercise={current} onAnswer={handleAnswer} />
        )}
        {isPlacement && (
          <PlacementView
            key={current.id}
            exercise={current}
            onAnswer={handleAnswer}
            onAutoCheck={(a) => check(a)}
          />
        )}
      </ActivityShell>
    </div>
  );
}
