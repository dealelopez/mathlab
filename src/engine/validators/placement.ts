import type { ValidationResult } from '../../types';
import type { Exercise, Answer } from '../types';
import { getDifficultyConfig } from '../difficulty';

/** La posición vale si está dentro de la tolerancia del nivel. */
export function validatePlacement(exercise: Exercise, answer: Answer): ValidationResult {
  const expected = exercise.correctAnswer as number;
  const { tolerance } = getDifficultyConfig('placement', exercise.difficulty);
  if (typeof answer === 'number' && Math.abs(answer - expected) <= tolerance) {
    return { correct: true, message: '¡Correcto!' };
  }
  return { correct: false, message: `Colócalo sobre el ${expected}`, expected };
}
