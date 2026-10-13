import { useEffect, useState } from 'react';
import Abacus, { type AbacusColumn } from '../manipulatives/Abacus';

export interface AbacusTutorialProps {
  /** Callback al completar el tutorial */
  onComplete: () => void;
  /** Callback para volver atrás / salir del tutorial */
  onBack: () => void;
}

interface TutorialStep {
  type: 'info' | 'exercise';
  title: string;
  description: string;
  columns: AbacusColumn[];
  highlightColumn: number;
  readOnly: boolean;
  /** Valor inicial del ábaco al entrar en el paso */
  initialValue: number;
  /** Si está definido, el ábaco anima desde initialValue hasta este valor (pasos info) */
  animateTo?: number;
  /** Respuesta esperada (solo pasos exercise) */
  target?: number;
}

const U: AbacusColumn = { label: 'U', color: '#EF4444' };
const D: AbacusColumn = { label: 'D', color: '#10B981' };
const C: AbacusColumn = { label: 'C', color: '#3B82F6' };

const STEPS: TutorialStep[] = [
  {
    type: 'info',
    title: 'Esto es un ábaco',
    description:
      'Un ábaco tiene filas de 10 cuentas. Cada fila tiene una etiqueta: U son las unidades. Mueve las cuentas para formar números.',
    columns: [U],
    highlightColumn: -1,
    readOnly: true,
    initialValue: 0,
  },
  {
    type: 'info',
    title: 'Las unidades',
    description:
      'Cada cuenta de esta fila vale 1. Si mueves 3 cuentas, el número es 3.',
    columns: [U],
    highlightColumn: 0,
    readOnly: true,
    initialValue: 0,
    animateTo: 3,
  },
  {
    type: 'exercise',
    title: 'Prueba: mueve 3 cuentas en las unidades',
    description: 'Toca las cuentas para mover 3 a la izquierda. El número debe ser 3.',
    columns: [U],
    highlightColumn: 0,
    readOnly: false,
    initialValue: 0,
    target: 3,
  },
  {
    type: 'info',
    title: 'Las decenas',
    description:
      'Cada cuenta de esta fila vale 10. Una cuenta de las decenas = 10 unidades.',
    columns: [D, U],
    highlightColumn: 0,
    readOnly: true,
    initialValue: 0,
    animateTo: 10,
  },
  {
    type: 'exercise',
    title: 'Muestra el número 25',
    description: 'Usa las decenas y las unidades para formar el 25.',
    columns: [D, U],
    highlightColumn: -1,
    readOnly: false,
    initialValue: 0,
    target: 25,
  },
  {
    type: 'info',
    title: 'Las centenas',
    description: 'Cada cuenta de esta fila vale 100. Una centena = 10 decenas.',
    columns: [C, D, U],
    highlightColumn: 0,
    readOnly: true,
    initialValue: 0,
    animateTo: 100,
  },
  {
    type: 'exercise',
    title: 'Ahora solo: muestra el 142',
    description: 'Sin ayuda: usa las tres filas para formar el 142.',
    columns: [C, D, U],
    highlightColumn: -1,
    readOnly: false,
    initialValue: 0,
    target: 142,
  },
];

/** Tutorial interactivo de 7 pasos para aprender a usar el ábaco. */
export default function AbacusTutorial({ onComplete, onBack }: AbacusTutorialProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [abacusValue, setAbacusValue] = useState(STEPS[0]!.initialValue);

  const step = STEPS[stepIndex]!;
  const isLast = stepIndex === STEPS.length - 1;
  const correct = step.type === 'info' || abacusValue === step.target;

  // Al entrar en un paso: valor inicial + animación en pasos info.
  useEffect(() => {
    setAbacusValue(step.initialValue);
    if (step.animateTo === undefined) return;
    const t = setTimeout(() => setAbacusValue(step.animateTo!), 500);
    return () => clearTimeout(t);
  }, [stepIndex, step.initialValue, step.animateTo]);

  const goNext = () => {
    if (!correct) return;
    if (isLast) onComplete();
    else setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  return (
    <div className="max-w-md rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="cursor-pointer text-sm text-slate-600 underline">
          Volver
        </button>
        <div data-testid="tutorial-progress" className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              data-testid={`progress-dot-${i + 1}`}
              aria-current={i === stepIndex ? 'step' : undefined}
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                i === stepIndex ? 'bg-blue-600' : i < stepIndex ? 'bg-blue-300' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm tabular-nums">
          {stepIndex + 1} / {STEPS.length}
        </span>
      </div>

      <h2 data-testid="tutorial-title" className="mt-3 text-xl font-bold">
        {step.title}
      </h2>
      <p className="mt-1 text-slate-700">{step.description}</p>

      <div className="mt-3">
        <Abacus
          columns={step.columns}
          value={abacusValue}
          onChange={setAbacusValue}
          readOnly={step.readOnly}
          highlightColumn={step.highlightColumn}
        />
      </div>

      {step.type === 'exercise' && correct && (
        <p className="mt-2 font-semibold text-green-700">¡Correcto!</p>
      )}

      <div className="mt-4 flex justify-between">
        <button
          onClick={goBack}
          disabled={stepIndex === 0}
          className="cursor-pointer rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          onClick={goNext}
          disabled={!correct}
          className="cursor-pointer rounded bg-blue-600 px-3 py-1 text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
