import type { ValidationResult } from '../../types';
import type { Exercise, Answer } from '../types';

/** El número debe coincidir exactamente con el esperado. */
export function validateRepresent(exercise: Exercise, answer: Answer): ValidationResult {
  const expected = exercise.correctAnswer as number;
  if (typeof answer === 'number' && Number.isFinite(answer) && answer === expected) {
    return { correct: true, message: '¡Correcto!' };
  }
  return { correct: false, message: 'Todavía no es ese número', expected };
}
