import type { DifficultyLevel, Manipulative, AnswerMode } from '../../types';
import type { Exercise } from '../types';
import { getDifficultyConfig } from '../difficulty';
import { randomInt, generateUniqueId } from '../../lib/math';
import { visibleNumbersFor } from './placement';

/**
 * T23-A3: generadores de sumas y restas con saltos sobre la recta.
 *
 * El niño descompone la operación en los saltos que quiera hasta llegar al
 * resultado; cualquier camino válido termina en `correctAnswer`. La ventana de
 * la recta es ajustada (no 0-max) para que los arcos de los saltos sigan
 * siendo visibles.
 */

/** Saltos disponibles por nivel (spec T23-A2), tal cual, sin filtrar. */
const JUMP_SIZES: Record<DifficultyLevel, number[]> = {
  1: [1, 2, 3, 4, 5],
  2: [1, 2, 3, 4, 5, 10],
  3: [1, 2, 3, 4, 5, 10, 20, 30, 40, 50],
  4: [1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 100],
  5: [1, 2, 5, 10, 20, 50, 100],
};

/** Separación de las marcas de la recta por nivel. */
const LINE_STEP: Record<DifficultyLevel, number> = { 1: 1, 2: 1, 3: 5, 4: 10, 5: 50 };

/** Monta el ejercicio de operación a partir de operandos y resultado. */
function buildOperationExercise(
  type: 'add' | 'subtract',
  difficulty: DifficultyLevel,
  operands: [number, number],
  result: number,
): Exercise {
  const [winLo, winHi] = windowFor(operands[0], result, difficulty);
  return {
    id: generateUniqueId(`${type}-${difficulty}`),
    deduplicationKey:
      type === 'add'
        ? `add-${difficulty}-${operands[0]}+${operands[1]}`
        : `subtract-${difficulty}-${operands[0]}-${operands[1]}`,
    type,
    difficulty,
    answerMode: 'free',
    instruction:
      type === 'add'
        ? `¿Cuánto es ${operands[0]} + ${operands[1]}? Haz saltos en la recta hacia delante.`
        : `¿Cuánto es ${operands[0]} − ${operands[1]}? Haz saltos en la recta hacia atrás.`,
    setup: {
      manipulative: 'numberline',
      operands,
      numberLineRange: [winLo, winHi],
      visibleNumbers: visibleNumbersForOperation(difficulty, winLo, winHi),
      numberLineStep: LINE_STEP[difficulty],
      jumpSizes: JUMP_SIZES[difficulty],
      readOnly: false,
    },
    correctAnswer: result,
    hints: ['Puedes dar un salto grande o varios pequeños'],
  };
}

/**
 * Ventana de la recta. Niveles 1-3 fijos; 4-5 ajustada a los siglos que
 * contienen el camino. Si el camino entero cae en el mismo siglo, la ventana
 * se abre hacia arriba (un siglo de ancho mínimo).
 */
function windowFor(
  start: number,
  end: number,
  difficulty: DifficultyLevel,
): [number, number] {
  if (difficulty <= 3) {
    return difficulty === 1 ? [0, 10] : difficulty === 2 ? [0, 20] : [0, 100];
  }
  const low = Math.min(start, end);
  const high = Math.max(start, end);
  const lo = Math.floor(low / 100) * 100;
  let hi = Math.ceil(high / 100) * 100;
  if (lo === hi) hi += 100;
  return [lo, hi];
}

/** Qué números de la ventana se rotulan según el nivel. */
function visibleNumbersForOperation(
  difficulty: DifficultyLevel,
  lo: number,
  hi: number,
): number[] {
  if (difficulty <= 2) {
    const out: number[] = [];
    for (let n = lo; n <= hi; n++) out.push(n);
    return out;
  }
  if (difficulty === 3) return visibleNumbersFor(lo, hi);
  if (difficulty === 4) {
    const out: number[] = [];
    for (let n = lo; n <= hi; n += 50) out.push(n);
    return out;
  }
  return []; // nivel 5: recta vacía
}

/**
 * Suma: el resultado `r` cae en `numberRange`; los dos sumandos son ≥ 1 y
 * ninguno trivialmente pequeño (cada uno entre ~r/4 y ~3r/4).
 * Punto de partida `a`, llegada `r`.
 */
export function generateAdd(
  difficulty: DifficultyLevel,
  _manipulative?: Manipulative,
  _answerMode: AnswerMode = 'free',
): Exercise {
  const config = getDifficultyConfig('add', difficulty);
  const [lo, hi] = config.numberRange;
  const r = randomInt(lo, hi);
  const ma = Math.max(1, Math.round(r / 4));
  const Ma = Math.min(r - 1, Math.round(r * 3 / 4));
  const aLo = Math.min(ma, Ma);
  const a = randomInt(aLo, Ma);
  const b = r - a;
  return buildOperationExercise('add', difficulty, [a, b], r);
}

/**
 * Resta: el minuendo `m` cae en `numberRange`; el sustraendo es ≥ 1 y deja
 * resultado ≥ 1 (entre ~m/5 y ~4m/5). Punto de partida `m`, llegada `m − b`.
 */
export function generateSubtract(
  difficulty: DifficultyLevel,
  _manipulative?: Manipulative,
  _answerMode: AnswerMode = 'free',
): Exercise {
  const config = getDifficultyConfig('subtract', difficulty);
  const [lo, hi] = config.numberRange;
  const m = randomInt(lo, hi);
  const mb = Math.max(1, Math.round(m / 5));
  const Mb = Math.min(m - 1, Math.round(m * 4 / 5));
  const bLo = Math.min(mb, Mb);
  const b = randomInt(bLo, Mb);
  return buildOperationExercise('subtract', difficulty, [m, b], m - b);
}
