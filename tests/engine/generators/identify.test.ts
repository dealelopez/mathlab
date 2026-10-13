import { describe, it, expect } from 'vitest';
import { generateIdentify } from '../../../src/engine/generators/identify';
import { getDifficultyConfig } from '../../../src/engine/difficulty';

describe('generateIdentify', () => {
  it('shownValue dentro del rango', () => {
    const [lo, hi] = getDifficultyConfig('identify', 3).numberRange;
    for (let i = 0; i < 30; i++) {
      const v = generateIdentify(3).correctAnswer as number;
      expect(v).toBeGreaterThanOrEqual(lo);
      expect(v).toBeLessThanOrEqual(hi);
    }
  });

  it('setup tiene readOnly=true', () => {
    expect(generateIdentify(2).setup.readOnly).toBe(true);
  });

  it('setup tiene initialValue === shownValue', () => {
    const ex = generateIdentify(2);
    expect(ex.setup.initialValue).toBe(ex.correctAnswer);
  });

  it('correctAnswer === shownValue y dedup lo incluye', () => {
    const ex = generateIdentify(1, 'rekenrek');
    expect(ex.deduplicationKey).toBe(`identify-1-rekenrek-${ex.correctAnswer}`);
  });

  it("answerMode siempre 'free'", () => {
    for (let i = 0; i < 10; i++) {
      expect(generateIdentify(4).answerMode).toBe('free');
    }
  });

  it('instruction es una pregunta sobre el manipulativo', () => {
    const ex = generateIdentify(2, 'abacus');
    expect(ex.instruction).toContain('?');
    expect(ex.instruction).toContain('ábaco');
  });
});
