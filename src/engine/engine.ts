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

/** Intentos de regeneración antes de aceptar un duplicado. */
const MAX_ATTEMPTS = 10;

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
   * Genera un ejercicio aleatorio. Si su deduplicationKey está en el
   * historial reciente, regenera (máx. 10 intentos).
   */
  generate(
    type: ExerciseType,
    difficulty: DifficultyLevel,
    manipulative?: Manipulative,
    answerMode?: AnswerMode,
  ): Exercise {
    const generator = GENERATORS[type];
    let exercise = generator(difficulty, manipulative, answerMode);
    for (let i = 0; i < MAX_ATTEMPTS && this.history.includes(exercise.deduplicationKey); i++) {
      exercise = generator(difficulty, manipulative, answerMode);
    }
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
