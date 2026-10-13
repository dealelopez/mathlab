import { describe, it, expect } from 'vitest';
import {
  generateDecompose,
  generateDistractors,
} from '../../../src/engine/generators/decompose';
import { getDifficultyConfig } from '../../../src/engine/difficulty';
import type { DifficultyLevel } from '../../../src/types';

/** Comprueba multiconjunto: cada parte aparece en opciones (descontando). */
function containsParts(options: number[], parts: number[]): boolean {
  const rest = [...options];
  for (const p of parts) {
    const idx = rest.indexOf(p);
    if (idx === -1) return false;
    rest.splice(idx, 1);
  }
  return true;
}

describe('generateDecompose', () => {
  it('target dentro del rango', () => {
    const [lo, hi] = getDifficultyConfig('decompose', 3).numberRange;
    for (let i = 0; i < 30; i++) {
      const ex = generateDecompose(3);
      const target = (ex.correctAnswer as number[]).reduce((a, b) => a + b, 0);
      // El target real se deduce de instruction; comprobamos rango vía suma válida
      expect(target).toBeGreaterThanOrEqual(lo);
      expect(target).toBeLessThanOrEqual(hi);
    }
  });

  it('las partes correctas suman el target y son > 0', () => {
    for (let i = 0; i < 30; i++) {
      const ex = generateDecompose(3, undefined, 'free');
      const parts = ex.correctAnswer as number[];
      expect(parts.every((p) => p > 0)).toBe(true);
      const target = Number(ex.instruction.match(/Completa: (\d+)/)![1]);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(target);
    }
  });

  it('modo drag: opciones contienen las partes correctas', () => {
    for (let i = 0; i < 20; i++) {
      const ex = generateDecompose(2, undefined, 'drag');
      expect(containsParts(ex.setup.options!, ex.correctAnswer as number[])).toBe(true);
    }
  });

  it('modo drag: hay exactamente distractorCount distractores', () => {
    const count = getDifficultyConfig('decompose', 2).distractorCount;
    for (let i = 0; i < 20; i++) {
      const ex = generateDecompose(2, undefined, 'drag');
      const parts = ex.correctAnswer as number[];
      expect(ex.setup.options!).toHaveLength(parts.length + count);
    }
  });

  it('modo drag: los distractores no son partes correctas', () => {
    for (let i = 0; i < 20; i++) {
      const ex = generateDecompose(3, undefined, 'drag');
      const parts = ex.correctAnswer as number[];
      const rest = [...ex.setup.options!];
      for (const p of parts) rest.splice(rest.indexOf(p), 1);
      // Los que quedan son distractores: ninguno coincide con una parte
      const partValues = new Set(parts);
      for (const d of rest) {
        expect(partValues.has(d)).toBe(false);
      }
    }
  });

  it('modo free: no hay opciones', () => {
    expect(generateDecompose(2, undefined, 'free').setup.options).toBeUndefined();
  });

  it('dificultad 5: tiene 3 partes; 1-4: tienen 2 partes', () => {
    expect((generateDecompose(5).correctAnswer as number[])).toHaveLength(3);
    for (const l of [1, 2, 3, 4] as DifficultyLevel[]) {
      expect((generateDecompose(l).correctAnswer as number[])).toHaveLength(2);
    }
  });

  it('100 generaciones: todos los targets dentro del rango', () => {
    const [lo, hi] = getDifficultyConfig('decompose', 4).numberRange;
    for (let i = 0; i < 100; i++) {
      const ex = generateDecompose(4, undefined, 'free');
      const sum = (ex.correctAnswer as number[]).reduce((a, b) => a + b, 0);
      expect(sum).toBeGreaterThanOrEqual(lo);
      expect(sum).toBeLessThanOrEqual(hi);
    }
  });
});

describe('generateDistractors', () => {
  it('genera la cantidad pedida, distintos y sin partes correctas', () => {
    const ds = generateDistractors(10, [3, 7], 4);
    expect(ds).toHaveLength(4);
    expect(new Set(ds).size).toBe(4);
    expect(ds).not.toContain(3);
    expect(ds).not.toContain(7);
    expect(ds.every((d) => d > 0)).toBe(true);
  });

  it('funciona con target pequeño (rellena por encima del target)', () => {
    const ds = generateDistractors(2, [1, 1], 2);
    expect(ds).toHaveLength(2);
    expect(ds).not.toContain(1);
  });
});
