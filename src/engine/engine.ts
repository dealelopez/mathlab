import type { ExerciseType, DifficultyLevel, Manipulative, AnswerMode, ValidationResult } from '../types';
import type { Exercise, Answer } from './types';
import { generateRepresent } from './generators/represent';
import { generateIdentify } from './generators/identify';
import { generateDecompose } from './generators/decompose';
import { generateSeries } from './generators/series';
import { generatePlacement } from './generators/placement';
import { validateRepresent } from './validators/represent';
import { validateIdentify } from './validators/identify';
import { validateDecompose } from './validators/decompose';
import { validateSeries } from './validators/series';
import { validatePlacement } from './validators/placement';

const GENERATORS: Record<
  ExerciseType,
  (difficulty: DifficultyLevel, manipulative?: Manipulative, answerMode?: AnswerMode) => Exercise
> = {
  represent: generateRepresent,
  identify: generateIdentify,
  decompose: generateDecompose,
  series: generateSeries,
  placement: generatePlacement,
};

const VALIDATORS: Record<ExerciseType, (exercise: Exercise, answer: Answer) => ValidationResult> = {
  represent: validateRepresent,
  identify: validateIdentify,
  decompose: validateDecompose,
  series: validateSeries,
  placement: validatePlacement,
};

/**
 * Candidatos que se generan como máximo en cada llamada. Con pocas combinaciones posibles
 * (p. ej. representar con números 1-5) hacen falta bastantes para encontrar la que aún no
 * ha salido. Las combinaciones no son equiprobables (en descomposición nivel 1 alguna sale
 * un 6 % de las veces), así que se generan 300: la probabilidad de no hallar la que falta
 * es del orden de 0,94^300 (menos de una entre cien millones).
 */
const MAX_ATTEMPTS = 300;

/**
 * ExerciseEngine — genera ejercicios sin repetir los recientes
 * (por deduplicationKey) y valida respuestas.
 */
export class ExerciseEngine {
  /** Historial de deduplicationKeys recientes */
  private history: string[] = [];

  /** Tamaño máximo del historial */
  private readonly maxHistory: number;

  constructor(maxHistory = 20) {
    this.maxHistory = maxHistory;
  }

  /**
   * Genera un ejercicio aleatorio sin repetir los recientes (por deduplicationKey).
   *
   * - Si algún candidato no está en el historial, se devuelve el primero que no esté.
   * - Si todos los candidatos ya salieron (hay menos combinaciones que ejercicios), se
   *   devuelve el que salió **hace más tiempo**. Así se agotan todas las combinaciones
   *   antes de repetir y nunca sale el mismo ejercicio dos veces seguidas (salvo que solo
   *   exista una combinación posible).
   */
  generate(
    type: ExerciseType,
    difficulty: DifficultyLevel,
    manipulative?: Manipulative,
    answerMode?: AnswerMode,
  ): Exercise {
    const generator = GENERATORS[type];
    let chosen: Exercise | null = null;
    let chosenLastSeen = Infinity;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const candidate = generator(difficulty, manipulative, answerMode);
      // Índice de la última vez que salió (-1 = no está en el historial).
      const lastSeen = this.history.lastIndexOf(candidate.deduplicationKey);
      if (lastSeen === -1) {
        chosen = candidate;
        break;
      }
      // Menor índice = salió hace más tiempo.
      if (lastSeen < chosenLastSeen) {
        chosen = candidate;
        chosenLastSeen = lastSeen;
      }
    }
    const exercise = chosen!;
    this.history.push(exercise.deduplicationKey);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
    return exercise;
  }

  /** Valida una respuesta con el validador de su tipo. */
  validate(exercise: Exercise, answer: Answer): ValidationResult {
    return VALIDATORS[exercise.type](exercise, answer);
  }

  /** Limpia el historial */
  reset(): void {
    this.history = [];
  }
}
