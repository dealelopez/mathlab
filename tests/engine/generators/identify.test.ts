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

  it("answerMode siempre 'free' por defecto", () => {
    for (let i = 0; i < 10; i++) {
      expect(generateIdentify(4).answerMode).toBe('free');
    }
  });

  it("modo drag: opciones con el valor mostrado + distractores", () => {
    const count = getDifficultyConfig('identify', 2).distractorCount;
    for (let i = 0; i < 20; i++) {
      const ex = generateIdentify(2, 'rekenrek', 'drag');
      expect(ex.answerMode).toBe('drag');
      const options = ex.setup.options!;
      expect(options).toHaveLength(1 + count);
      expect(options).toContain(ex.correctAnswer);
    }
  });

  it('modo drag: distractores distintos y dentro del rango', () => {
    const [lo, hi] = getDifficultyConfig('identify', 3).numberRange;
    for (let i = 0; i < 20; i++) {
      const ex = generateIdentify(3, 'abacus', 'drag');
      const shown = ex.correctAnswer as number;
      const distractors = ex.setup.options!.filter((o) => o !== shown);
      expect(distractors.length).toBeGreaterThan(0);
      expect(new Set(distractors).size).toBe(distractors.length);
      distractors.forEach((d) => {
        expect(d).toBeGreaterThanOrEqual(lo);
        expect(d).toBeLessThanOrEqual(hi);
      });
    }
  });

  it('modo free: sin opciones', () => {
    expect(generateIdentify(2, 'rekenrek', 'free').setup.options).toBeUndefined();
  });

  it('instruction es una pregunta sobre el manipulativo', () => {
    const ex = generateIdentify(2, 'abacus');
    expect(ex.instruction).toContain('?');
    expect(ex.instruction).toContain('ábaco');
  });
});
