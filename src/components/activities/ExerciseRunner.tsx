import { useEffect, useRef, useState } from 'react';
import type {
  ExerciseType,
  DifficultyLevel,
  Manipulative,
  AnswerMode,
} from '../../types';
import type { Exercise, Answer } from '../../engine/types';
import { ExerciseEngine } from '../../engine/engine';
import ActivityShell from './ActivityShell';
import { TileSlots } from '../primitives/NumberTiles';
import ManipulativeView from './views/ManipulativeView';
import DecomposeView from './views/DecomposeView';
import SeriesView from './views/SeriesView';
import IdentifyFree from './views/IdentifyFree';
import PlacementView from './views/PlacementView';
import JumpsView from './views/JumpsView';

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

  // Reinicia la sesión solo cuando la configuración CAMBIA. El primer ejercicio ya
  // se genera en el inicializador de useState, así que al montar no hay que hacer nada
  // (antes se generaba un segundo ejercicio y el primero quedaba fuera del historial).
  // Las dependencias son solo `configKey`: el resto de valores están contenidos en ella.
  const lastConfigKey = useRef(configKey);
  useEffect(() => {
    if (lastConfigKey.current === configKey) return;
    lastConfigKey.current = configKey;
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
    // identify sin respuesta: avisar en vez de validar un 0 inventado.
    // En represent el 0 es una respuesta legítima (el manipulativo a cero).
    if (current.type === 'identify' && userAnswer === null) {
      setFeedback('incorrect');
      setFeedbackMessage('Escribe tu respuesta para comprobar');
      return;
    }
    // sumas y restas responden con la lista de aterrizajes: sin saltos, avisar sin validar.
    if (current.type === 'add' || current.type === 'subtract') {
      const jumps = userAnswer as number[] | null;
      if (!Array.isArray(jumps) || jumps.length === 0) {
        setFeedback('incorrect');
        setFeedbackMessage('Haz al menos un salto para comprobar');
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
            locked={feedback === 'correct'}
            onAnswer={handleAnswer}
            onAutoCheck={(a) => check(a)}
          />
        )}
        {(current.type === 'add' || current.type === 'subtract') && (
          <JumpsView
            key={current.id}
            exercise={current}
            locked={feedback === 'correct'}
            onAnswer={handleAnswer}
          />
        )}
      </ActivityShell>
    </div>
  );
}
