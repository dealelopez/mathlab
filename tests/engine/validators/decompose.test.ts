import { describe, it, expect } from 'vitest';
import { generateDecompose } from '../../../src/engine/generators/decompose';
import { validateDecompose } from '../../../src/engine/validators/decompose';

function exerciseFor(_target: number, parts: number[]) {
  const ex = generateDecompose(3, undefined, 'free');
  return { ...ex, correctAnswer: parts, setup: { ...ex.setup, parts: parts.length } };
}

describe('validateDecompose', () => {
  it('partes que suman target → correct', () => {
    expect(validateDecompose(exerciseFor(8, [3, 5]), [3, 5]).correct).toBe(true);
  });

  it('partes que NO suman target → incorrect', () => {
    expect(validateDecompose(exerciseFor(8, [3, 5]), [3, 4]).correct).toBe(false);
  });

  it('partes con un 0 → incorrect', () => {
    expect(validateDecompose(exerciseFor(8, [3, 5]), [0, 8]).correct).toBe(false);
  });

  it('múltiples combinaciones válidas: [3,5] y [6,2] para target=8', () => {
    expect(validateDecompose(exerciseFor(8, [3, 5]), [3, 5]).correct).toBe(true);
    expect(validateDecompose(exerciseFor(8, [3, 5]), [6, 2]).correct).toBe(true);
    expect(validateDecompose(exerciseFor(8, [3, 5]), [4, 4]).correct).toBe(true);
  });

  it('3 partes: [2,3,3] para target=8 → correct', () => {
    expect(validateDecompose(exerciseFor(8, [2, 3, 3]), [2, 3, 3]).correct).toBe(true);
  });
});
