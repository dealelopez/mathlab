import type { ValidationResult } from '../../types';
import type { Exercise, Answer } from '../types';

/** Cada valor oculto debe coincidir posición a posición. */
export function validateSeries(exercise: Exercise, answer: Answer): ValidationResult {
  const expected = exercise.correctAnswer as number[];
  if (
    Array.isArray(answer) &&
    answer.length === expected.length &&
    answer.every((v, i) => v === expected[i])
  ) {
    return { correct: true, message: '¡Correcto!' };
  }
  return { correct: false, message: 'Revisa los números que faltan', expected };
}
