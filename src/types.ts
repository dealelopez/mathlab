/** Manipulativos disponibles */
export type Manipulative = 'rekenrek' | 'abacus' | 'tenframe' | 'numberline';

/** Tipos de ejercicio */
export type ExerciseType = 'represent' | 'identify' | 'decompose' | 'series' | 'placement';

/** Niveles de dificultad: 1 (más fácil) a 5 (más difícil) */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

/** Modos de respuesta en ejercicios */
export type AnswerMode = 'drag' | 'free';

/** Resultado de la validación de un ejercicio */
export interface ValidationResult {
  correct: boolean;
  message: string;
  expected?: unknown; // Valor esperado (para hints)
}
