import { describe, it, expect } from 'vitest';
import { generatePlacement } from '../../../src/engine/generators/placement';
import type { DifficultyLevel } from '../../../src/types';

describe('generatePlacement', () => {
  it('target dentro del rango de la recta', () => {
    for (let i = 0; i < 20; i++) {
      const ex = generatePlacement(4);
      const [lo, hi] = ex.setup.numberLineRange!;
      const t = ex.correctAnswer as number;
      expect(t).toBeGreaterThanOrEqual(lo);
      expect(t).toBeLessThanOrEqual(hi);
    }
  });

  it('numberLineRange contiene el target', () => {
    const ex = generatePlacement(2);
    const [lo, hi] = ex.setup.numberLineRange!;
    expect(lo).toBeLessThanOrEqual(ex.correctAnswer as number);
    expect(hi).toBeGreaterThanOrEqual(ex.correctAnswer as number);
  });

  it('nivel 1-2: todos los números visibles', () => {
    for (const l of [1, 2] as DifficultyLevel[]) {
      const ex = generatePlacement(l);
      const [lo, hi] = ex.setup.numberLineRange!;
      expect(ex.setup.visibleNumbers).toEqual(
        Array.from({ length: hi - lo + 1 }, (_, i) => lo + i),
      );
    }
  });

  it('nivel 3: solo extremos y múltiplos de 5', () => {
    const ex = generatePlacement(3); // rango [0,20]
    expect(ex.setup.visibleNumbers).toEqual([0, 5, 10, 15, 20]);
  });

  it('nivel 4-5: solo extremos y múltiplos de 10', () => {
    const ex4 = generatePlacement(4); // rango [0,50]
    expect(ex4.setup.visibleNumbers).toEqual([0, 10, 20, 30, 40, 50]);
    const ex5 = generatePlacement(5); // rango [0,100]
    const vis = ex5.setup.visibleNumbers!;
    expect(vis[0]).toBe(0);
    expect(vis[vis.length - 1]).toBe(100);
    expect(vis.every((n) => n % 10 === 0)).toBe(true);
    expect(vis).not.toContain(5);
  });

  it('correctAnswer === target e instruction lo nombra', () => {
    const ex = generatePlacement(1);
    expect(ex.instruction).toContain(String(ex.correctAnswer));
    expect(ex.deduplicationKey).toBe(`placement-1-${ex.correctAnswer}`);
  });
});
