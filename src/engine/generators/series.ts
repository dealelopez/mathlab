import type { DifficultyLevel, Manipulative, AnswerMode } from '../../types';
import type { Exercise } from '../types';
import { getDifficultyConfig } from '../difficulty';
import { randomInt, shuffleArray, generateUniqueId } from '../../lib/math';

/** Descompone un patrón ('+5', '-2', '*2') en operación y cantidad. */
function parsePattern(pattern: string): { op: string; n: number } {
  return { op: pattern[0]!, n: parseInt(pattern.slice(1), 10) };
}

/** Aplica un paso del patrón al valor anterior. */
function stepValue(prev: number, pattern: string): number {
  const { op, n } = parsePattern(pattern);
  if (op === '+') return prev + n;
  if (op === '-') return prev - n;
  return prev * n; // '*'
}

/** Comprueba si el patrón cabe en el rango con esa longitud. */
function patternFits(pattern: string, length: number, lo: number, hi: number): boolean {
  const { op, n } = parsePattern(pattern);
  const jumps = length - 1;
  if (op === '-') return lo + n * jumps <= hi;
  if (op === '*') return Math.floor(hi / Math.pow(n, jumps)) >= lo;
  return hi - n * jumps >= lo;
}

/** Elige un inicio para que la serie completa quepa en el rango. */
function pickStart(
  pattern: string,
  length: number,
  lo: number,
  hi: number,
): number {
  const { op, n } = parsePattern(pattern);
  const jumps = length - 1;
  if (op === '-') {
    const minStart = lo + n * jumps;
    return minStart > hi ? hi : randomInt(minStart, hi);
  }
  if (op === '*') {
    const maxStart = Math.floor(hi / Math.pow(n, jumps));
    return randomInt(lo, Math.max(lo, maxStart));
  }
  const maxStart = hi - n * jumps;
  return randomInt(lo, Math.max(lo, maxStart));
}

/**
 * Serie numérica con `hiddenCount` posiciones ocultas al final.
 * Longitud total = 4 visibles + ocultas (al menos 3 visibles antes del primer null).
 */
export function generateSeries(
  difficulty: DifficultyLevel,
  _manipulative?: Manipulative,
  answerMode: AnswerMode = 'drag',
): Exercise {
  const config = getDifficultyConfig('series', difficulty);
  const [lo, hi] = config.numberRange;
  const hidden = config.hiddenCount;
  const length = 4 + hidden;
  // Elegir un patrón que quepa en el rango (orden aleatorio, primero que valga).
  const candidates = shuffleArray(config.seriesPatterns);
  const pattern = candidates.find((p) => patternFits(p, length, lo, hi)) ?? candidates[0]!;

  const start = pickStart(pattern, length, lo, hi);
  const full: number[] = [start];
  for (let i = 1; i < length; i++) full.push(stepValue(full[i - 1]!, pattern));

  const visibleValues: (number | null)[] = full.map((v, i) =>
    i < length - hidden ? v : null,
  );
  const hiddenValues = full.slice(length - hidden);

  const setup: Exercise['setup'] = { visibleValues, seriesPattern: pattern };
  if (answerMode === 'drag') {
    const inSeries = new Set(full);
    const pool: number[] = [];
    for (let n = lo; n <= hi; n++) {
      if (!inSeries.has(n)) pool.push(n);
    }
    const distractors = shuffleArray(pool).slice(0, config.distractorCount);
    while (distractors.length < config.distractorCount) {
      distractors.push(randomInt(lo, hi));
    }
    setup.options = shuffleArray([...hiddenValues, ...distractors]);
  }

  return {
    id: generateUniqueId(`series-${difficulty}`),
    deduplicationKey: `series-${difficulty}-${pattern}-${start}`,
    type: 'series',
    difficulty,
    answerMode,
    instruction: 'Completa la serie',
    setup,
    correctAnswer: hiddenValues,
    hints: [`Fíjate cuánto cambia de un número al siguiente`],
  };
}
