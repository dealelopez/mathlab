import { describe, it, expect } from 'vitest';
import { generateRepresent } from '../../../src/engine/generators/represent';
import { getDifficultyConfig } from '../../../src/engine/difficulty';
import type { DifficultyLevel } from '../../../src/types';

const LEVELS: DifficultyLevel[] = [1, 2, 3, 4, 5];

describe('generateRepresent', () => {
  it('target siempre dentro de numberRange para cada dificultad', () => {
    for (const level of LEVELS) {
      const [lo, hi] = getDifficultyConfig('represent', level).numberRange;
      for (let i = 0; i < 20; i++) {
        const ex = generateRepresent(level);
        expect(ex.correctAnswer as number).toBeGreaterThanOrEqual(lo);
        expect(ex.correctAnswer as number).toBeLessThanOrEqual(hi);
      }
    }
  });

  it('setup tiene initialValue=0 y readOnly=false', () => {
    const ex = generateRepresent(2);
    expect(ex.setup.initialValue).toBe(0);
    expect(ex.setup.readOnly).toBe(false);
  });

  it('setup tiene manipulativeConfig acorde a la dificultad', () => {
    const ex = generateRepresent(3);
    expect(ex.setup.manipulativeConfig).toEqual(
      getDifficultyConfig('represent', 3).manipulativeConfig,
    );
  });

  it('instruction contiene el número target', () => {
    const ex = generateRepresent(2);
    expect(ex.instruction).toContain(String(ex.correctAnswer));
  });

  it('correctAnswer === target', () => {
    const ex = generateRepresent(4, 'abacus');
    expect(ex.correctAnswer).toBeGreaterThanOrEqual(1);
    expect(ex.deduplicationKey).toBe(`represent-4-abacus-${ex.correctAnswer}`);
  });

  it('con manipulativo especificado: se usa ese manipulativo', () => {
    const ex = generateRepresent(3, 'tenframe');
    expect(ex.manipulative).toBe('tenframe');
  });

  it('sin manipulativo: se elige uno válido', () => {
    for (let i = 0; i < 20; i++) {
      const ex = generateRepresent(2);
      expect(getDifficultyConfig('represent', 2).validManipulatives).toContain(ex.manipulative);
    }
  });

  it('100 generaciones: todos los targets dentro del rango', () => {
    const [lo, hi] = getDifficultyConfig('represent', 5).numberRange;
    for (let i = 0; i < 100; i++) {
      const t = generateRepresent(5).correctAnswer as number;
      expect(t).toBeGreaterThanOrEqual(lo);
      expect(t).toBeLessThanOrEqual(hi);
    }
  });
});
