import type { DifficultyLevel, Manipulative, AnswerMode } from '../../types';
import type { Exercise } from '../types';
import { getDifficultyConfig } from '../difficulty';
import { randomInt, randomFromArray, generateUniqueId } from '../../lib/math';
import { MANIPULATIVE_NAMES } from '../names';

/** "Muestra el número N en el manipulativo" (el niño lo construye desde 0). */
export function generateRepresent(
  difficulty: DifficultyLevel,
  manipulative?: Manipulative,
  answerMode: AnswerMode = 'free',
): Exercise {
  const config = getDifficultyConfig('represent', difficulty);
  const target = randomInt(config.numberRange[0], config.numberRange[1]);
  const chosen = manipulative ?? randomFromArray(config.validManipulatives!);

  return {
    id: generateUniqueId(`represent-${difficulty}`),
    deduplicationKey: `represent-${difficulty}-${chosen}-${target}`,
    type: 'represent',
    manipulative: chosen,
    difficulty,
    answerMode,
    instruction: `Muestra el número ${target} en ${MANIPULATIVE_NAMES[chosen]}`,
    setup: {
      manipulative: chosen,
      manipulativeConfig: { ...config.manipulativeConfig },
      initialValue: 0,
      readOnly: false,
    },
    correctAnswer: target,
    hints: [`Cuenta hasta llegar al ${target}`],
  };
}
