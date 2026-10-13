import type { ValidationResult } from '../../types';
import type { Exercise, Answer } from '../types';

/**
 * Las partes son correctas si todas son > 0 y suman el target.
 * El target se extrae de la respuesta correcta del ejercicio, así que
 * CUALQUIER combinación válida vale (no solo la generada).
 */
export function validateDecompose(exercise: Exercise, answer: Answer): ValidationResult {
  const target = (exercise.correctAnswer as number[]).reduce((a, b) => a + b, 0);
  if (!Array.isArray(answer) || answer.some((p) => typeof p !== 'number' || p <= 0)) {
    return { correct: false, message: 'Todas las partes deben ser mayores que 0', expected: target };
  }
  const sum = (answer as number[]).reduce((a, b) => a + b, 0);
  if (sum === target) return { correct: true, message: '¡Correcto!' };
  return { correct: false, message: `Esas partes suman ${sum}, no ${target}`, expected: target };
}
