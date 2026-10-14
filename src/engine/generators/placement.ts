import type { DifficultyLevel, Manipulative, AnswerMode } from '../../types';
import type { Exercise } from '../types';
import { getDifficultyConfig } from '../difficulty';
import { randomInt, generateUniqueId } from '../../lib/math';

/**
 * Qué números de la recta se rotulan: nunca todos. Solo extremos +
 * múltiplos de 5 (tramos cortos), 10 (tramos medios) o 100 (tramos largos).
 * El niño deduce la posición contando desde esas referencias.
 */
export function visibleNumbersFor(lo: number, hi: number): number[] {
  const span = hi - lo;
  const step = span > 100 ? 100 : span > 20 ? 10 : 5;
  const out: number[] = [];
  for (let n = lo; n <= hi; n++) {
    if (n === lo || n === hi || n % step === 0) out.push(n);
  }
  return out;
}

/** "Coloca el N en la recta". */
export function generatePlacement(
  difficulty: DifficultyLevel,
  _manipulative?: Manipulative,
  answerMode: AnswerMode = 'free',
): Exercise {
  const config = getDifficultyConfig('placement', difficulty);
  const [lo, hi] = config.numberRange;
  const target = randomInt(lo, hi);
  const numberLineRange = config.manipulativeConfig.numberLineRange ?? [lo, hi];

  return {
    id: generateUniqueId(`placement-${difficulty}`),
    deduplicationKey: `placement-${difficulty}-${target}`,
    type: 'placement',
    difficulty,
    answerMode,
    instruction: `Coloca el ${target} en la recta`,
    setup: {
      numberLineRange,
      visibleNumbers: visibleNumbersFor(numberLineRange[0]!, numberLineRange[1]!),
      readOnly: false,
    },
    correctAnswer: target,
    hints: [`Está entre el ${numberLineRange[0]} y el ${numberLineRange[1]}`],
  };
}
