import type { DifficultyLevel, Manipulative, AnswerMode } from '../../types';
import type { Exercise } from '../types';
import { getDifficultyConfig } from '../difficulty';
import { randomInt, shuffleArray, generateUniqueId } from '../../lib/math';

/**
 * Genera `count` distractores: números > 0, distintos entre sí,
 * que no coinciden con las partes correctas. Primero evita los que
 * completarían otra suma válida con una parte correcta; si no hay
 * suficientes, usa números por encima del target (no pueden sumar
 * el target con partes positivas) y por último relaja la restricción.
 */
export function generateDistractors(
  target: number,
  correctParts: number[],
  count: number,
): number[] {
  const correct = new Set(correctParts);
  const completes = new Set(correctParts.map((p) => target - p));
  const picked = new Set<number>();

  const strict: number[] = [];
  for (let n = 1; n < target; n++) {
    if (!correct.has(n) && !completes.has(n)) strict.push(n);
  }
  const overshoot: number[] = [];
  for (let n = target + 1; n <= target + count + 2; n++) overshoot.push(n);
  const relaxed: number[] = [];
  for (let n = 1; n < target; n++) {
    if (!correct.has(n)) relaxed.push(n);
  }

  for (const pool of [strict, overshoot, relaxed]) {
    for (const n of pool) {
      if (picked.size >= count) break;
      picked.add(n);
    }
    if (picked.size >= count) break;
  }
  return [...picked].slice(0, count);
}

/** Reparte el target en `parts` sumandos > 0 (cortes aleatorios). */
function splitIntoParts(target: number, parts: number): number[] {
  if (parts <= 2) {
    const a = randomInt(1, target - 1);
    return [a, target - a];
  }
  const c1 = randomInt(1, target - 2);
  const c2 = randomInt(c1 + 1, target - 1);
  return [c1, c2 - c1, target - c2];
}

/** "N = ___ + ___" (cualquier combinación que sume vale). */
export function generateDecompose(
  difficulty: DifficultyLevel,
  _manipulative?: Manipulative,
  answerMode: AnswerMode = 'drag',
): Exercise {
  const config = getDifficultyConfig('decompose', difficulty);
  const target = randomInt(config.numberRange[0], config.numberRange[1]);
  const parts = splitIntoParts(target, config.decomposeParts);

  const setup: Exercise['setup'] = {
    parts: config.decomposeParts,
    prefilledValue: difficulty <= 2 ? parts[0]! : null,
  };
  if (answerMode === 'drag') {
    setup.options = shuffleArray([
      ...parts,
      ...generateDistractors(target, parts, config.distractorCount),
    ]);
  }

  const blanks = parts.map(() => '___').join(' + ');

  return {
    id: generateUniqueId(`decompose-${difficulty}`),
    deduplicationKey: `decompose-${difficulty}-${target}-${parts.join(',')}`,
    type: 'decompose',
    difficulty,
    answerMode,
    instruction: `Completa: ${target} = ${blanks}`,
    setup,
    correctAnswer: parts,
    hints: [`Busca números que sumen ${target}`],
  };
}
