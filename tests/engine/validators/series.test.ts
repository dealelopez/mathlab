import { describe, it, expect } from 'vitest';
import { generateSeries } from '../../../src/engine/generators/series';
import { validateSeries } from '../../../src/engine/validators/series';

describe('validateSeries', () => {
  it('valores exactos → correct', () => {
    const ex = generateSeries(2, undefined, 'free');
    expect(validateSeries(ex, [...(ex.correctAnswer as number[])]).correct).toBe(true);
  });

  it('un valor incorrecto → incorrect', () => {
    const ex = generateSeries(2, undefined, 'free');
    const wrong = [...(ex.correctAnswer as number[])];
    wrong[0] = wrong[0]! + 1;
    expect(validateSeries(ex, wrong).correct).toBe(false);
  });

  it('orden importa: valores desordenados → incorrect', () => {
    const ex = generateSeries(3, undefined, 'free');
    const correct = ex.correctAnswer as number[];
    if (correct.length >= 2 && correct[0] !== correct[1]) {
      const swapped = [...correct].reverse();
      expect(validateSeries(ex, swapped).correct).toBe(false);
    } else {
      // Si la respuesta tiene un solo valor distinto, alterar uno basta
      const wrong = [...correct];
      wrong[0] = wrong[0]! + 1000;
      expect(validateSeries(ex, wrong).correct).toBe(false);
    }
  });
});
