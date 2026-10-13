import type { DifficultyLevel, Manipulative, AnswerMode } from '../../types';
import type { Exercise } from '../types';
import { getDifficultyConfig } from '../difficulty';
import { randomInt, randomFromArray, generateUniqueId } from '../../lib/math';
import { MANIPULATIVE_NAMES } from '../names';

/** "¿Qué número muestra el manipulativo?" (el niño lo lee y escribe). */
export function generateIdentify(
  difficulty: DifficultyLevel,
  manipulative?: Manipulative,
  _answerMode?: AnswerMode,
): Exercise {
  const config = getDifficultyConfig('identify', difficulty);
  const shownValue = randomInt(config.numberRange[0], config.numberRange[1]);
  const chosen = manipulative ?? randomFromArray(config.validManipulatives!);

  return {
    id: generateUniqueId(`identify-${difficulty}`),
    deduplicationKey: `identify-${difficulty}-${chosen}-${shownValue}`,
    type: 'identify',
    manipulative: chosen,
    difficulty,
    answerMode: 'free',
    instruction: `¿Qué número muestra ${MANIPULATIVE_NAMES[chosen]}?`,
    setup: {
      manipulative: chosen,
      manipulativeConfig: { ...config.manipulativeConfig },
      initialValue: shownValue,
      readOnly: true,
    },
    correctAnswer: shownValue,
    hints: ['Cuenta las fichas o cuentas una a una'],
  };
}
