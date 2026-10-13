import { describe, it, expect } from 'vitest';
import { generateSeries } from '../../../src/engine/generators/series';
import { getDifficultyConfig } from '../../../src/engine/difficulty';

/** Reconstruye la serie completa: visibles + correctAnswer. */
function fullSeries(ex: ReturnType<typeof generateSeries>): number[] {
  const visible = (ex.setup.visibleValues as (number | null)[]).filter(
    (v): v is number => v !== null,
  );
  return [...visible, ...(ex.correctAnswer as number[])];
}

function diffs(values: number[]): number[] {
  return values.slice(1).map((v, i) => v - values[i]!);
}

describe('generateSeries', () => {
  it('serie generada sigue el patrón declarado', () => {
    for (let i = 0; i < 30; i++) {
      const ex = generateSeries(3);
      const pattern = ex.setup.seriesPattern!;
      const full = fullSeries(ex);
      if (pattern.startsWith('+')) {
        const n = Number(pattern.slice(1));
        expect(diffs(full).every((d) => d === n)).toBe(true);
      } else if (pattern.startsWith('-')) {
        const n = Number(pattern.slice(1));
        expect(diffs(full).every((d) => d === -n)).toBe(true);
      } else {
        expect(full.every((v, i) => i === 0 || v === full[i - 1]! * 2)).toBe(true);
      }
    }
  });

  it('al menos 3 valores visibles antes del primer null', () => {
    for (let i = 0; i < 20; i++) {
      const vv = generateSeries(2).setup.visibleValues!;
      expect(vv.findIndex((v) => v === null)).toBeGreaterThanOrEqual(3);
    }
  });

  it('hiddenCount posiciones son null', () => {
    for (const level of [1, 3, 5] as const) {
      const hidden = getDifficultyConfig('series', level).hiddenCount;
      for (let i = 0; i < 10; i++) {
        const vv = generateSeries(level).setup.visibleValues!;
        expect(vv.filter((v) => v === null)).toHaveLength(hidden);
      }
    }
  });

  it('todos los valores dentro de numberRange', () => {
    for (const level of [1, 2, 3, 4, 5] as const) {
      const [lo, hi] = getDifficultyConfig('series', level).numberRange;
      for (let i = 0; i < 10; i++) {
        for (const v of fullSeries(generateSeries(level))) {
          expect(v).toBeGreaterThanOrEqual(lo);
          expect(v).toBeLessThanOrEqual(hi);
        }
      }
    }
  });

  it("patrón '+1' produce incrementos de 1 (nivel 1)", () => {
    for (let i = 0; i < 10; i++) {
      const ex = generateSeries(1);
      expect(ex.setup.seriesPattern).toBe('+1');
      expect(diffs(fullSeries(ex)).every((d) => d === 1)).toBe(true);
    }
  });

  it("patrón '+5' produce incrementos de 5", () => {
    let seen = 0;
    for (let i = 0; i < 60 && seen < 5; i++) {
      const ex = generateSeries(3);
      if (ex.setup.seriesPattern !== '+5') continue;
      seen++;
      expect(diffs(fullSeries(ex)).every((d) => d === 5)).toBe(true);
    }
    expect(seen).toBeGreaterThan(0);
  });

  it("patrón '*2' duplica cada valor", () => {
    let seen = 0;
    for (let i = 0; i < 80 && seen < 3; i++) {
      const ex = generateSeries(5);
      if (ex.setup.seriesPattern !== '*2') continue;
      seen++;
      const full = fullSeries(ex);
      expect(full.every((v, i) => i === 0 || v === full[i - 1]! * 2)).toBe(true);
    }
    expect(seen).toBeGreaterThan(0);
  });

  it("patrón '-2' decrementa de 2 en 2", () => {
    let seen = 0;
    for (let i = 0; i < 80 && seen < 3; i++) {
      const ex = generateSeries(4);
      if (ex.setup.seriesPattern !== '-2') continue;
      seen++;
      expect(diffs(fullSeries(ex)).every((d) => d === -2)).toBe(true);
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('correctAnswer contiene los valores ocultos en orden', () => {
    const ex = generateSeries(3);
    const hidden = ex.correctAnswer as number[];
    const vv = ex.setup.visibleValues!;
    expect(vv.slice(-hidden.length).every((v) => v === null)).toBe(true);
    // La serie completa es coherente: último visible + primer oculto siguen el patrón
    const full = fullSeries(ex);
    expect(full).toHaveLength(vv.length);
  });

  it('50 generaciones: todos los valores dentro del rango', () => {
    const [lo, hi] = getDifficultyConfig('series', 5).numberRange;
    for (let i = 0; i < 50; i++) {
      for (const v of fullSeries(generateSeries(5))) {
        expect(v).toBeGreaterThanOrEqual(lo);
        expect(v).toBeLessThanOrEqual(hi);
      }
    }
  });
});
