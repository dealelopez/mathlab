import { describe, it, expect } from 'vitest';
import { DIFFICULTY_MAP, getDifficultyConfig } from '../../src/engine/difficulty';

const EXERCISE_TYPES = ['represent', 'identify', 'decompose', 'series', 'placement'] as const;
const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5] as const;

describe('DIFFICULTY_MAP', () => {
  it('tiene configuración para cada combinación tipo × nivel', () => {
    for (const type of EXERCISE_TYPES) {
      for (const level of DIFFICULTY_LEVELS) {
        const config = DIFFICULTY_MAP[type][level];
        expect(config).toBeDefined();
        expect(config.numberRange).toHaveLength(2);
        expect(config.numberRange[0]).toBeLessThanOrEqual(config.numberRange[1]);
      }
    }
  });

  it('nivel N+1 tiene rango >= nivel N para cada tipo', () => {
    for (const type of EXERCISE_TYPES) {
      for (let level = 1; level < 5; level++) {
        const current = DIFFICULTY_MAP[type][level as 1 | 2 | 3 | 4 | 5];
        const next = DIFFICULTY_MAP[type][(level + 1) as 1 | 2 | 3 | 4 | 5];
        expect(next.numberRange[1]).toBeGreaterThanOrEqual(current.numberRange[1]);
      }
    }
  });

  it('series tiene al menos un patrón por nivel', () => {
    for (const level of DIFFICULTY_LEVELS) {
      const config = DIFFICULTY_MAP.series[level];
      expect(config.seriesPatterns.length).toBeGreaterThan(0);
    }
  });

  it('decompose nivel 5 tiene 3 partes', () => {
    expect(DIFFICULTY_MAP.decompose[5].decomposeParts).toBe(3);
  });

  it('placement tolerancia crece con la dificultad', () => {
    expect(DIFFICULTY_MAP.placement[1].tolerance).toBe(0);
    expect(DIFFICULTY_MAP.placement[5].tolerance).toBeGreaterThan(0);
  });

  it('represent y identify tienen validManipulatives en cada nivel', () => {
    for (const type of ['represent', 'identify'] as const) {
      for (const level of DIFFICULTY_LEVELS) {
        const config = DIFFICULTY_MAP[type][level];
        expect(config.validManipulatives).toBeDefined();
        expect(config.validManipulatives!.length).toBeGreaterThan(0);
      }
    }
  });

  it('represent no incluye numberline como manipulativo válido', () => {
    for (const level of DIFFICULTY_LEVELS) {
      expect(DIFFICULTY_MAP.represent[level].validManipulatives).not.toContain('numberline');
    }
  });

  it('tenframe solo es válido en niveles donde el rango cabe (≤ 20)', () => {
    for (const type of ['represent', 'identify'] as const) {
      for (const level of DIFFICULTY_LEVELS) {
        const config = DIFFICULTY_MAP[type][level];
        if (config.validManipulatives?.includes('tenframe')) {
          expect(config.numberRange[1]).toBeLessThanOrEqual(20);
        }
      }
    }
  });
});

describe('getDifficultyConfig', () => {
  it('devuelve la configuración correcta', () => {
    const config = getDifficultyConfig('represent', 3);
    expect(config.numberRange).toEqual([1, 20]);
  });
});
