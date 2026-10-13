import { useEffect, useState } from 'react';
import type {
  ExerciseType,
  DifficultyLevel,
  Manipulative,
  AnswerMode,
} from '../../types';
import type { Exercise, Answer } from '../../engine/types';
import { ExerciseEngine } from '../../engine/engine';
import ActivityShell from './ActivityShell';
import Rekenrek from '../manipulatives/Rekenrek';
import Abacus, { type AbacusColumn } from '../manipulatives/Abacus';
import TenFrame from '../manipulatives/TenFrame';
import NumberLine from '../manipulatives/NumberLine';
import AnswerSlot from '../primitives/AnswerSlot';
import AnswerChip from '../primitives/AnswerChip';
import DigitAnswer from '../primitives/DigitAnswer';
import { DragDropProvider, useDragDrop } from '../primitives/DragDropContext';

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
  // numberline (identify): marcador fijo de solo lectura
  const [lo, hi] = cfg.numberLineRange ?? [0, 10];
  return (
    <NumberLine
      min={lo}
      max={hi}
      markers={[{ position: exercise.setup.initialValue ?? 0, color: '#3B82F6' }]}
    />
  );
}

/** Interior del modo drag de decompose (necesita el contexto). */
function DecomposeDragInner({
  options,
  slots,
  usedIds,
  onDropSlot,
  onClearSlot,
}: {
  options: number[];
  slots: (number | null)[];
  usedIds: string[];
  onDropSlot: (index: number, value: number) => void;
  onClearSlot: (index: number) => void;
}) {
  const { setOnDrop } = useDragDrop();

  useEffect(() => {
    setOnDrop((slotId, value) => {
      const m = /^dslot-(\d+)$/.exec(slotId);
      if (m) onDropSlot(Number(m[1]), value);
    });
    return () => setOnDrop(null);
  }, [setOnDrop, onDropSlot]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {slots.map((v, i) => (
          <div
            key={i}
            onClick={v !== null ? () => onClearSlot(i) : undefined}
            style={v !== null ? { cursor: 'pointer' } : undefined}
            title={v !== null ? 'Toca para quitar' : undefined}
          >
            <AnswerSlot id={`dslot-${i}`} value={v} onChange={() => {}} mode="drag-target" />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt, i) => (
          <AnswerChip
            key={`chip-${i}`}
            id={`chip-${i}`}
            value={opt}
            used={usedIds.includes(`chip-${i}`)}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500">Arrastra un número a cada hueco. Toca un hueco lleno para vaciarlo.</p>
    </div>
  );
}

/** "N = ___ + ___": slots por arrastre o por teclado. */
function DecomposeView({
  exercise,
  onAnswer,
}: {
  exercise: Exercise;
  onAnswer: (a: Answer) => void;
}) {
  const parts = exercise.setup.parts ?? (exercise.correctAnswer as number[]).length;
  const target = (exercise.correctAnswer as number[]).reduce((a, b) => a + b, 0);
  const [slots, setSlots] = useState<(number | null)[]>(() => {
    const init: (number | null)[] = Array.from({ length: parts }, () => null);
    if (exercise.setup.prefilledValue != null) init[0] = exercise.setup.prefilledValue;
    return init;
  });
  const [usedIds, setUsedIds] = useState<string[]>([]);

  const commit = (next: (number | null)[]) => {
    setSlots(next);
    onAnswer(next as number[]);
  };

  if (exercise.answerMode === 'free') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{target} =</span>
        {slots.map((v, i) => (
          <AnswerSlot
            key={i}
            id={`dslot-${i}`}
            value={v}
            onChange={(nv) => {
              const next = [...slots];
              next[i] = nv;
              commit(next);
            }}
            mode="input"
          />
        ))}
      </div>
    );
  }

  const handleDropSlot = (index: number, value: number) => {
    if (index < 0 || index >= slots.length) return;
    // Marca usado el primer chip libre con ese valor
    const options = exercise.setup.options ?? [];
    const chipIdx = options.findIndex(
      (opt, i) => opt === value && !usedIds.includes(`chip-${i}`),
    );
    if (chipIdx >= 0) setUsedIds((prev) => [...prev, `chip-${chipIdx}`]);
    const next = [...slots];
    next[index] = value;
    commit(next);
  };

  const handleClearSlot = (index: number) => {
    const prev = slots[index];
    const next = [...slots];
    next[index] = null;
    commit(next);
    // Libera un chip usado con ese valor
    if (prev !== null) {
      const options = exercise.setup.options ?? [];
      const usedIdx = options.findIndex(
        (opt, i) => opt === prev && usedIds.includes(`chip-${i}`),
      );
      if (usedIdx >= 0) {
        const id = `chip-${usedIdx}`;
        setUsedIds((ids) => ids.filter((x) => x !== id));
      }
    }
  };

  return (
    <DragDropProvider>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{target} =</span>
        <DecomposeDragInner
          options={exercise.setup.options ?? []}
          slots={slots}
          usedIds={usedIds}
          onDropSlot={handleDropSlot}
          onClearSlot={handleClearSlot}
        />
      </div>
    </DragDropProvider>
  );
}

/** Interior del modo drag de series (necesita el contexto). */
function SeriesDragInner({
  visibleValues,
  hiddenAnswers,
  options,
  usedIds,
  onDropSlot,
}: {
  visibleValues: (number | null)[];
  hiddenAnswers: (number | null)[];
  options: number[];
  usedIds: string[];
  onDropSlot: (hiddenIndex: number, value: number) => void;
}) {
  const { setOnDrop } = useDragDrop();

  useEffect(() => {
    setOnDrop((slotId, value) => {
      const m = /^sslot-(\d+)$/.exec(slotId);
      if (m) onDropSlot(Number(m[1]), value);
    });
    return () => setOnDrop(null);
  }, [setOnDrop, onDropSlot]);

  let hiddenSeen = -1;
  return (
    <div className="flex flex-col gap-3">
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
              hiddenSeen++;
              const k = hiddenSeen;
              return (
                <AnswerSlot
                  key={i}
                  id={`sslot-${k}`}
                  value={hiddenAnswers[k] ?? null}
                  onChange={() => {}}
                  mode="drag-target"
                />
              );
            })()
          ),
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt, i) => (
          <AnswerChip
            key={`chip-${i}`}
            id={`chip-${i}`}
            value={opt}
            used={usedIds.includes(`chip-${i}`)}
          />
        ))}
      </div>
    </div>
  );
}

/** "Completa la serie": huecos en línea + chips o teclado. */
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
  const [usedIds, setUsedIds] = useState<string[]>([]);

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
    const options = exercise.setup.options ?? [];
    const chipIdx = options.findIndex(
      (opt, i) => opt === value && !usedIds.includes(`chip-${i}`),
    );
    if (chipIdx >= 0) setUsedIds((prev) => [...prev, `chip-${chipIdx}`]);
    const next = [...hiddenAnswers];
    next[hiddenIndex] = value;
    commit(next);
  };

  return (
    <DragDropProvider>
      <SeriesDragInner
        visibleValues={visibleValues}
        hiddenAnswers={hiddenAnswers}
        options={exercise.setup.options ?? []}
        usedIds={usedIds}
        onDropSlot={handleDropSlot}
      />
    </DragDropProvider>
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

  const handleCheck = () => check((userAnswer ?? 0) as Answer);

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
            <div className="flex flex-col items-center gap-2">
              <span className="text-lg font-semibold">Tu respuesta:</span>
              <DigitAnswer
                value={typeof userAnswer === 'number' ? userAnswer : null}
                onChange={handleAnswer}
                maxDigits={3}
                digitCount={String(current.setup.initialValue ?? 0).length}
              />
            </div>
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
