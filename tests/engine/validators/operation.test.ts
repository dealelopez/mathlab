import { describe, it, expect } from 'vitest';
import { validateOperation } from '../../../src/engine/validators/operation';
import type { Exercise } from '../../../src/engine/types';

function makeExercise(
  type: 'add' | 'subtract',
  operands: [number, number],
  result: number,
  numberLineRange: [number, number] = [0, 20],
): Exercise {
  return {
    id: 'test',
    deduplicationKey: 'test',
    type,
    difficulty: 1,
    answerMode: 'free',
    instruction: '',
    setup: { operands, numberLineRange },
    correctAnswer: result,
  };
}

describe('validateOperation (suma)', () => {
  // 8 + 5 = 13, recta [0, 20]
  const ex = makeExercise('add', [8, 5], 13);

  it('acepta un salto directo al resultado', () => {
    expect(validateOperation(ex, [13])).toEqual({ correct: true, message: '¡Correcto!' });
  });

  it('acepta un camino de varios saltos', () => {
    expect(validateOperation(ex, [10, 13])).toEqual({ correct: true, message: '¡Correcto!' });
  });

  it('acepta muchos saltos de +1', () => {
    expect(validateOperation(ex, [9, 10, 11, 12, 13]).correct).toBe(true);
  });

  it('rechaza quedarse corto (mensaje exacto, sin el resultado)', () => {
    const res = validateOperation(ex, [12]);
    expect(res).toEqual({ correct: false, message: 'Todavía no has llegado' });
  });

  it('rechaza pasarse (mensaje exacto, sin el resultado)', () => {
    const res = validateOperation(ex, [14]);
    expect(res).toEqual({ correct: false, message: 'Te has pasado. Deshaz algún salto' });
  });

  it('rechaza pasarse después de haber llegado', () => {
    const res = validateOperation(ex, [13, 14]);
    expect(res.correct).toBe(false);
    expect(res.message).toBe('Te has pasado. Deshaz algún salto');
  });

  it('rechaza una respuesta vacía', () => {
    expect(validateOperation(ex, [])).toEqual({
      correct: false,
      message: 'Haz al menos un salto',
    });
  });

  it('rechaza un salto en sentido contrario', () => {
    const res = validateOperation(ex, [7]);
    expect(res).toEqual({ correct: false, message: 'Los saltos van hacia delante' });
  });

  it('rechaza un salto que retrocede a mitad de camino', () => {
    const res = validateOperation(ex, [10, 9, 13]);
    expect(res.correct).toBe(false);
    expect(res.message).toBe('Los saltos van hacia delante');
  });

  it('rechaza saltos fuera de la recta', () => {
    expect(validateOperation(ex, [21]).message).toBe('Los saltos van hacia delante');
  });

  it('ningún mensaje contiene el resultado', () => {
    for (const answer of [[], [12], [14], [13, 14], [7], [21]]) {
      expect(validateOperation(ex, answer).message).not.toContain('13');
    }
  });
});

describe('validateOperation (resta)', () => {
  // 12 − 5 = 7, recta [0, 20]
  const ex = makeExercise('subtract', [12, 5], 7);

  it('acepta un salto directo al resultado', () => {
    expect(validateOperation(ex, [7])).toEqual({ correct: true, message: '¡Correcto!' });
  });

  it('acepta un camino de varios saltos', () => {
    expect(validateOperation(ex, [10, 7])).toEqual({ correct: true, message: '¡Correcto!' });
  });

  it('acepta muchos saltos de −1', () => {
    expect(validateOperation(ex, [11, 10, 9, 8, 7]).correct).toBe(true);
  });

  it('rechaza quedarse corto (no ha bajado lo suficiente)', () => {
    const res = validateOperation(ex, [8]);
    expect(res).toEqual({ correct: false, message: 'Todavía no has llegado' });
  });

  it('rechaza pasarse (bajar de más)', () => {
    const res = validateOperation(ex, [6]);
    expect(res).toEqual({ correct: false, message: 'Te has pasado. Deshaz algún salto' });
  });

  it('rechaza una respuesta vacía', () => {
    expect(validateOperation(ex, [])).toEqual({
      correct: false,
      message: 'Haz al menos un salto',
    });
  });

  it('rechaza un salto hacia delante', () => {
    const res = validateOperation(ex, [13]);
    expect(res).toEqual({ correct: false, message: 'Los saltos van hacia atrás' });
  });

  it('rechaza un salto que sube a mitad de camino', () => {
    const res = validateOperation(ex, [10, 11, 7]);
    expect(res.correct).toBe(false);
    expect(res.message).toBe('Los saltos van hacia atrás');
  });

  it('rechaza saltos fuera de la recta', () => {
    expect(validateOperation(ex, [-1]).message).toBe('Los saltos van hacia atrás');
  });

  it('ningún mensaje contiene el resultado', () => {
    for (const answer of [[], [8], [6], [13], [-1]]) {
      expect(validateOperation(ex, answer).message).not.toContain('7');
    }
  });
});
