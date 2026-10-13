import { describe, it, expect } from 'vitest';
import { generatePlacement } from '../../../src/engine/generators/placement';
import { validatePlacement } from '../../../src/engine/validators/placement';

describe('validatePlacement', () => {
  it('posición exacta → correct', () => {
    const ex = generatePlacement(1);
    expect(validatePlacement(ex, ex.correctAnswer).correct).toBe(true);
  });

  it('posición dentro de tolerancia → correct (nivel 3, tol=1)', () => {
    const ex = { ...generatePlacement(3), correctAnswer: 10 };
    expect(validatePlacement(ex, 11).correct).toBe(true);
    expect(validatePlacement(ex, 9).correct).toBe(true);
  });

  it('posición fuera de tolerancia → incorrect', () => {
    const ex = { ...generatePlacement(3), correctAnswer: 10 };
    expect(validatePlacement(ex, 12).correct).toBe(false);
  });

  it('tolerancia 0 (nivel 1): solo exacto vale', () => {
    const ex = { ...generatePlacement(1), correctAnswer: 4 };
    expect(validatePlacement(ex, 4).correct).toBe(true);
    expect(validatePlacement(ex, 5).correct).toBe(false);
  });

  it('tolerancia 5 (nivel 5): posiciones ±5 valen', () => {
    const ex = { ...generatePlacement(5), correctAnswer: 50 };
    expect(validatePlacement(ex, 45).correct).toBe(true);
    expect(validatePlacement(ex, 55).correct).toBe(true);
    expect(validatePlacement(ex, 56).correct).toBe(false);
  });
});
