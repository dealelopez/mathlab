import type { DifficultyLevel, Manipulative, AnswerMode } from '../../types';
import type { Exercise } from '../types';
import { getDifficultyConfig } from '../difficulty';
import { randomInt, randomFromArray, shuffleArray, generateUniqueId } from '../../lib/math';
import { MANIPULATIVE_NAMES } from '../names';

/**
 * Distractores cercanos al valor mostrado (±1, ±2, ±3, ±10, ±5),
 * dentro del rango y distintos del correcto. Rellena con aleatorios si faltan.
 */
function nearbyDistractors(shown: number, lo: number, hi: number, count: number): number[] {
  const picked = new Set<number>();
  for (const delta of [1, -1, 2, -2, 3, -3, 10, -10, 5, -5]) {
    if (picked.size >= count) break;
    const n = shown + delta;
    if (n >= lo && n <= hi && n !== shown) picked.add(n);
  }
  let guard = 0;
  while (picked.size < count && guard < 200) {
    guard++;
    const n = randomInt(lo, hi);
    if (n !== shown) picked.add(n);
  }
  return [...picked].slice(0, count);
}

/**
 * "¿Qué número muestra el manipulativo?"
 * - free: el niño lo escribe con NumberTiles (un hueco por cifra).
 * - drag: elige entre opciones con el número completo (chips arrastrables).
 */
export function generateIdentify(
  difficulty: DifficultyLevel,
  manipulative?: Manipulative,
  answerMode: AnswerMode = 'free',
): Exercise {
  const config = getDifficultyConfig('identify', difficulty);
  const [lo, hi] = config.numberRange;
  const shownValue = randomInt(lo, hi);
  const chosen = manipulative ?? randomFromArray(config.validManipulatives!);

  const setup: Exercise['setup'] = {
    manipulative: chosen,
    manipulativeConfig: { ...config.manipulativeConfig },
    initialValue: shownValue,
    readOnly: true,
  };
  if (answerMode === 'drag') {
    setup.options = shuffleArray([
      shownValue,
      ...nearbyDistractors(shownValue, lo, hi, config.distractorCount),
    ]);
  }

  return {
    id: generateUniqueId(`identify-${difficulty}`),
    deduplicationKey: `identify-${difficulty}-${chosen}-${shownValue}`,
    type: 'identify',
    manipulative: chosen,
    difficulty,
    answerMode,
    instruction: `¿Qué número muestra ${MANIPULATIVE_NAMES[chosen]}?`,
    setup,
    correctAnswer: shownValue,
    hints: ['Cuenta las fichas o cuentas una a una'],
  };
}
