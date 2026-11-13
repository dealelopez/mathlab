import type { ReactNode } from 'react';
import type { Manipulative } from '../../types';
import { EXERCISE_LABELS, MANIPULATIVES, MANIPULATIVE_LABELS } from './catalog';
import type { Page, StandaloneExercise } from './types';

export interface HomeProps {
  onNavigate: (page: Page) => void;
}

const STANDALONE: StandaloneExercise[] = ['decompose', 'series'];

const cardButton =
  'min-h-11 cursor-pointer rounded-lg border-2 border-blue-600 px-4 py-2 text-base font-semibold text-blue-700';

function Card({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-3 rounded-xl border-2 border-slate-300 p-4"
    >
      <h3 id={id} className="text-xl font-bold">
        {title}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

/** Pantalla principal: una tarjeta por manipulativo y por ejercicio independiente. */
export default function Home({ onNavigate }: HomeProps) {
  const manipulativeCard = (m: Manipulative) => (
    <Card key={m} id={`card-${m}`} title={MANIPULATIVE_LABELS[m]}>
      <button
        type="button"
        className={cardButton}
        onClick={() => onNavigate({ type: 'sandbox', manipulative: m })}
      >
        Exploración libre
      </button>
      <button
        type="button"
        className={cardButton}
        onClick={() => onNavigate({ type: 'activities', manipulative: m })}
      >
        Actividades
      </button>
      {m === 'abacus' && (
        <button
          type="button"
          className={cardButton}
          onClick={() => onNavigate({ type: 'tutorial-abacus' })}
        >
          Tutorial
        </button>
      )}
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Mathlab</h1>

      <section aria-labelledby="home-manipulatives" className="flex flex-col gap-3">
        <h2 id="home-manipulatives" className="text-lg font-semibold text-slate-700">
          Manipulativos
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {MANIPULATIVES.map(manipulativeCard)}
        </div>
      </section>

      <section aria-labelledby="home-exercises" className="flex flex-col gap-3">
        <h2 id="home-exercises" className="text-lg font-semibold text-slate-700">
          Ejercicios
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {STANDALONE.map((t) => (
            <Card key={t} id={`card-${t}`} title={EXERCISE_LABELS[t]}>
              <button
                type="button"
                className={cardButton}
                onClick={() => onNavigate({ type: 'exercise-setup', exerciseType: t })}
              >
                Practicar
              </button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
