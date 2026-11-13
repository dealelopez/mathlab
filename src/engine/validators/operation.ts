import type { ValidationResult } from '../../types';
import type { Exercise, Answer } from '../types';

/**
 * T23-A4: valida el camino de saltos sobre la recta.
 *
 * La respuesta es la lista de posiciones donde aterriza cada salto; el punto
 * de partida es `setup.operands[0]` y no va en la lista. Ejemplo: `8 + 5` por
 * `+2 +3` → `[10, 13]`.
 *
 * Regla de producto (6.1): los mensajes no revelan el resultado ni se pone
 * `expected` en la respuesta.
 */
export function validateOperation(exercise: Exercise, answer: Answer): ValidationResult {
  const isAdd = exercise.type === 'add';
  if (!Array.isArray(answer) || answer.length === 0) {
    return { correct: false, message: 'Haz al menos un salto' };
  }

  const start = exercise.setup.operands![0]!;
  const result = exercise.correctAnswer as number;
  const [lo, hi] = exercise.setup.numberLineRange ?? [0, Number.MAX_SAFE_INTEGER];
  const wrongDirection = isAdd
    ? 'Los saltos van hacia delante'
    : 'Los saltos van hacia atrás';

  // Cada salto avanza en el sentido de la operación y se queda en la recta.
  let prev = start;
  for (const pos of answer) {
    const avanza = isAdd ? pos > prev : pos < prev;
    if (!avanza || pos < lo || pos > hi) {
      return { correct: false, message: wrongDirection };
    }
    prev = pos;
  }

  const last = answer[answer.length - 1]!;
  if (last === result) {
    return { correct: true, message: '¡Correcto!' };
  }
  const corto = isAdd ? last < result : last > result;
  return corto
    ? { correct: false, message: 'Todavía no has llegado' }
    : { correct: false, message: 'Te has pasado. Deshaz algún salto' };
}
