import { describe, it, expect } from 'vitest';
import { ExerciseEngine } from '../../src/engine/engine';
import { getDifficultyConfig } from '../../src/engine/difficulty';
import type { DifficultyLevel } from '../../src/types';

describe('ExerciseEngine', () => {
  it('genera ejercicios de cada tipo sin errores', () => {
    const engine = new ExerciseEngine();
    for (const type of ['represent', 'identify', 'decompose', 'series', 'placement'] as const) {
      const ex = engine.generate(type, 2);
      expect(ex.type).toBe(type);
      expect(ex.id).toBeTruthy();
      expect(ex.deduplicationKey).toBeTruthy();
      expect(ex.instruction).toBeTruthy();
    }
  });

  it('no repite deduplicationKey en 50 generaciones (espacio grande: decompose-5)', () => {
    const engine = new ExerciseEngine(100);
    const keys = new Set<string>();
    for (let i = 0; i < 50; i++) {
      keys.add(engine.generate('decompose', 5).deduplicationKey);
    }
    expect(keys.size).toBe(50);
  });

  it('reset() limpia el historial', () => {
    const engine = new ExerciseEngine();
    engine.generate('represent', 1);
    engine.reset();
    expect((engine as unknown as { history: string[] }).history).toHaveLength(0);
  });

  it('tras maxHistory generaciones, el historial no crece indefinidamente', () => {
    const engine = new ExerciseEngine(5);
    for (let i = 0; i < 30; i++) engine.generate('series', 3);
    const history = (engine as unknown as { history: string[] }).history;
    expect(history.length).toBeLessThanOrEqual(5);
  });

  it('genera ejercicios con manipulativo especificado', () => {
    const engine = new ExerciseEngine();
    const ex = engine.generate('represent', 3, 'abacus');
    expect(ex.manipulative).toBe('abacus');
    expect(ex.setup.manipulative).toBe('abacus');
  });

  it('sin manipulativo elige uno válido aleatoriamente', () => {
    const engine = new ExerciseEngine();
    for (let i = 0; i < 20; i++) {
      const ex = engine.generate('represent', 2);
      const valid = getDifficultyConfig('represent', 2).validManipulatives!;
      expect(valid).toContain(ex.manipulative);
    }
  });

  it('validate() acepta la respuesta correcta y rechaza la incorrecta', () => {
    const engine = new ExerciseEngine();
    const ex = engine.generate('placement', 1);
    const target = ex.correctAnswer as number;
    expect(engine.validate(ex, target).correct).toBe(true);
    expect(engine.validate(ex, target + 100).correct).toBe(false);
  });

  it('cada generación tiene id único', () => {
    const engine = new ExerciseEngine();
    const ids = new Set<string>();
    for (let i = 0; i < 20; i++) ids.add(engine.generate('identify', 1 as DifficultyLevel).id);
    expect(ids.size).toBe(20);
  });
});
