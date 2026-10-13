import type { DifficultyLevel, Manipulative, AnswerMode } from '../../types';
import type { Exercise } from '../types';
import { getDifficultyConfig } from '../difficulty';
import { randomInt, generateUniqueId } from '../../lib/math';

/**
 * Qué números de la recta se muestran según la dificultad:
 * - 1-2: todos; 3: extremos + múltiplos de 5; 4-5: extremos + múltiplos de 10.
 */
function visibleNumbersFor(lo: number, hi: number, difficulty: DifficultyLevel): number[] {
  const all: number[] = [];
  for (let n = lo; n <= hi; n++) all.push(n);
  if (difficulty <= 2) return all;
  const mult = difficulty === 3 ? 5 : 10;
  return all.filter((n) => n === lo || n === hi || n % mult === 0);
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
      visibleNumbers: visibleNumbersFor(
        numberLineRange[0]!,
        numberLineRange[1]!,
        difficulty,
      ),
      readOnly: false,
    },
    correctAnswer: target,
    hints: [`Está entre el ${numberLineRange[0]} y el ${numberLineRange[1]}`],
  };
}
