import type { AnswerMode, DifficultyLevel, ExerciseType, Manipulative } from '../../types';

/** Configuración con la que arranca una sesión de ejercicios. */
export interface ActivityConfig {
  exerciseType: ExerciseType;
  difficulty: DifficultyLevel;
  manipulative?: Manipulative;
  answerMode: AnswerMode;
}

/** Tipos de ejercicio que no dependen de un manipulativo y tienen su propia tarjeta en Home. */
export type StandaloneExercise = 'decompose' | 'series';

/** Páginas de la app. La navegación es por estado React, sin router ni URLs. */
export type Page =
  | { type: 'home' }
  | { type: 'sandbox'; manipulative: Manipulative }
  | { type: 'activities'; manipulative: Manipulative }
  | { type: 'exercise-setup'; exerciseType: StandaloneExercise }
  | { type: 'activity-session'; config: ActivityConfig; backTo: Page }
  | { type: 'tutorial-abacus' };
