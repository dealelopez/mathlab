import type { ExerciseType, Manipulative } from '../../types';

/** Orden en que se muestran los manipulativos en Home. */
export const MANIPULATIVES: Manipulative[] = ['rekenrek', 'abacus', 'tenframe', 'numberline'];

export const MANIPULATIVE_LABELS: Record<Manipulative, string> = {
  rekenrek: 'Rekenrek',
  abacus: 'Ábaco',
  tenframe: 'Marco de diez',
  numberline: 'Recta numérica',
};

export const EXERCISE_LABELS: Record<ExerciseType, string> = {
  represent: 'Representar',
  identify: 'Identificar',
  decompose: 'Descomposición',
  series: 'Series',
  placement: 'Colocar en la recta',
};

/** Ejercicios que ofrece cada manipulativo en su página de actividades. */
export const MANIPULATIVE_EXERCISES: Record<Manipulative, ExerciseType[]> = {
  rekenrek: ['represent', 'identify'],
  abacus: ['represent', 'identify'],
  tenframe: ['represent', 'identify'],
  numberline: ['identify', 'placement'],
};

/** Ejercicios cuyo generador usa el modo de respuesta (con opciones / libre). */
export const EXERCISES_WITH_ANSWER_MODE: ExerciseType[] = ['identify', 'decompose', 'series'];
