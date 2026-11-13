import { describe, it, expect } from 'vitest';
import { generateAdd, generateSubtract } from '../../../src/engine/generators/operation';
import { getDifficultyConfig } from '../../../src/engine/difficulty';
import { ExerciseEngine } from '../../../src/engine/engine';
import type { Exercise } from '../../../src/engine/types';

const LEVELS = [1, 2, 3, 4, 5] as const;
const MUESTRAS = 300;

/** Tabla de saltos de la spec T23-A2 (sin filtrar). */
const JUMPS: Record<number, number[]> = {
  1: [1, 2, 3, 4, 5],
  2: [1, 2, 3, 4, 5, 10],
  3: [1, 2, 3, 4, 5, 10, 20, 30, 40, 50],
  4: [1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 100],
  5: [1, 2, 5, 10, 20, 50, 100],
};

/** numberLineStep por nivel (spec T23-A3). */
const STEPS: Record<number, number> = { 1: 1, 2: 1, 3: 5, 4: 10, 5: 50 };

describe('generateAdd', () => {
  it.each(LEVELS)('nivel %i: 300 muestras válidas', (level) => {
    for (let i = 0; i < MUESTRAS; i++) {
      const ex = generateAdd(level);
      const operands = ex.setup.operands;
      expect(operands).toBeDefined();
      const [a, b] = operands as [number, number];
      const result = ex.correctAnswer as number;

      expect(ex.type).toBe('add');
      expect(ex.setup.manipulative).toBe('numberline');
      expect(ex.answerMode).toBe('free');
      expect(a + b).toBe(result);
      expect(a).toBeGreaterThanOrEqual(1);
      expect(b).toBeGreaterThanOrEqual(1);

      const [lo, hi] = getDifficultyConfig('add', level).numberRange;
      expect(result).toBeGreaterThanOrEqual(lo);
      expect(result).toBeLessThanOrEqual(hi);

      expect(ex.deduplicationKey).toBe(`add-${level}-${a}+${b}`);
    }
  });

  it('niveles pedidos por el usuario: 3 no pasa de 100, 4 siempre > 100 y ≤ 200, 5 > 100, ≤ 300 y alguna > 200', () => {
    let algunaNivel5PasaDe200 = false;
    for (let i = 0; i < MUESTRAS; i++) {
      const r3 = generateAdd(3).correctAnswer as number;
      expect(r3).toBeLessThanOrEqual(100);
      expect(r3).toBeGreaterThan(20);

      const r4 = generateAdd(4).correctAnswer as number;
      expect(r4).toBeGreaterThan(100);
      expect(r4).toBeLessThanOrEqual(200);

      const r5 = generateAdd(5).correctAnswer as number;
      expect(r5).toBeGreaterThan(100);
      expect(r5).toBeLessThanOrEqual(300);
      if (r5 > 200) algunaNivel5PasaDe200 = true;
    }
    expect(algunaNivel5PasaDe200).toBe(true);
  });

  it('ventana de la recta por nivel', () => {
    for (let i = 0; i < MUESTRAS; i++) {
      for (const level of [1, 2, 3] as const) {
        const ex = generateAdd(level);
        expect(ex.setup.numberLineRange).toEqual(
          level === 1 ? [0, 10] : level === 2 ? [0, 20] : [0, 100],
        );
      }
      for (const level of [4, 5] as const) {
        const ex = generateAdd(level);
        const [winLo, winHi] = ex.setup.numberLineRange as [number, number];
        const operands = ex.setup.operands as [number, number];
        const start = operands[0];
        const end = ex.correctAnswer as number;
        expect(winLo % 100).toBe(0);
        expect(winHi % 100).toBe(0);
        expect(winLo).toBeLessThan(winHi);
        expect(winLo).toBeLessThanOrEqual(Math.min(start, end));
        expect(winHi).toBeGreaterThanOrEqual(Math.max(start, end));
      }
    }
  });

  it('numberLineStep por nivel y extremos de la ventana múltiplos del paso', () => {
    for (let i = 0; i < MUESTRAS; i++) {
      for (const level of LEVELS) {
        const ex = generateAdd(level);
        expect(ex.setup.numberLineStep).toBe(STEPS[level]);
        const [winLo, winHi] = ex.setup.numberLineRange as [number, number];
        expect(winLo % (STEPS[level] as number)).toBe(0);
        expect(winHi % (STEPS[level] as number)).toBe(0);
      }
    }
  });

  it('visibleNumbers por nivel', () => {
    for (let i = 0; i < MUESTRAS; i++) {
      // Niveles 1-2: todos los enteros de la ventana.
      const ex1 = generateAdd(1);
      expect(ex1.setup.visibleNumbers).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const ex2 = generateAdd(2);
      expect(ex2.setup.visibleNumbers?.length).toBe(21);
      // Nivel 3: múltiplos de 10 y extremos (0 a 100).
      const ex3 = generateAdd(3);
      expect(ex3.setup.visibleNumbers).toEqual(
        [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      );
      // Nivel 4: múltiplos de 50 dentro de la ventana más los extremos.
      const ex4 = generateAdd(4);
      const [lo4, hi4] = ex4.setup.numberLineRange as [number, number];
      const esperado4: number[] = [];
      for (let n = lo4; n <= hi4; n += 50) esperado4.push(n);
      expect(ex4.setup.visibleNumbers).toEqual(esperado4);
      // Nivel 5: ninguno.
      const ex5 = generateAdd(5);
      expect(ex5.setup.visibleNumbers).toEqual([]);
    }
  });

  it('jumpSizes es exactamente la tabla de la spec en cada nivel', () => {
    for (let i = 0; i < MUESTRAS; i++) {
      for (const level of LEVELS) {
        const ex = generateAdd(level);
        expect(ex.setup.jumpSizes).toEqual(JUMPS[level]);
      }
    }
  });

  it('la instrucción lleva los operandos y nunca el resultado aislado', () => {
    for (let i = 0; i < MUESTRAS; i++) {
      const ex = generateAdd(2);
      const [a, b] = ex.setup.operands as [number, number];
      const result = ex.correctAnswer as number;
      expect(ex.instruction).toContain(`${a} + ${b}`);
      if (result !== a && result !== b) {
        expect(new RegExp(`\\b${result}\\b`).test(ex.instruction)).toBe(false);
      }
    }
  });
});

describe('generateSubtract', () => {
  it.each(LEVELS)('nivel %i: 300 muestras válidas', (level) => {
    for (let i = 0; i < MUESTRAS; i++) {
      const ex = generateSubtract(level);
      const operands = ex.setup.operands;
      expect(operands).toBeDefined();
      const [m, b] = operands as [number, number];
      const result = ex.correctAnswer as number;

      expect(ex.type).toBe('subtract');
      expect(ex.setup.manipulative).toBe('numberline');
      expect(ex.answerMode).toBe('free');
      expect(m - b).toBe(result);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(result).toBeGreaterThanOrEqual(1);

      const [lo, hi] = getDifficultyConfig('subtract', level).numberRange;
      expect(m).toBeGreaterThanOrEqual(lo);
      expect(m).toBeLessThanOrEqual(hi);

      expect(ex.deduplicationKey).toBe(`subtract-${level}-${m}-${b}`);
    }
  });

  it('niveles pedidos por el usuario: minuendo en 3 ≤ 100, en 4 > 100 y ≤ 200, en 5 > 100, ≤ 300 y alguna > 200', () => {
    let algunaNivel5PasaDe200 = false;
    for (let i = 0; i < MUESTRAS; i++) {
      const m3 = (generateSubtract(3).setup.operands as [number, number])[0];
      expect(m3).toBeLessThanOrEqual(100);
      expect(m3).toBeGreaterThan(20);

      const m4 = (generateSubtract(4).setup.operands as [number, number])[0];
      expect(m4).toBeGreaterThan(100);
      expect(m4).toBeLessThanOrEqual(200);

      const m5 = (generateSubtract(5).setup.operands as [number, number])[0];
      expect(m5).toBeGreaterThan(100);
      expect(m5).toBeLessThanOrEqual(300);
      if (m5 > 200) algunaNivel5PasaDe200 = true;
    }
    expect(algunaNivel5PasaDe200).toBe(true);
  });

  it('ventana, paso, números visibles y saltos como en suma', () => {
    for (let i = 0; i < MUESTRAS; i++) {
      expect(generateSubtract(1).setup.numberLineRange).toEqual([0, 10]);
      expect(generateSubtract(2).setup.numberLineRange).toEqual([0, 20]);
      expect(generateSubtract(3).setup.numberLineRange).toEqual([0, 100]);
      for (const level of [4, 5] as const) {
        const ex = generateSubtract(level);
        const [winLo, winHi] = ex.setup.numberLineRange as [number, number];
        expect(winLo % 100).toBe(0);
        expect(winHi % 100).toBe(0);
        expect(winLo).toBeLessThan(winHi);
      }
      for (const level of LEVELS) {
        const ex = generateSubtract(level);
        expect(ex.setup.numberLineStep).toBe(STEPS[level]);
        expect(ex.setup.jumpSizes).toEqual(JUMPS[level]);
      }
      expect(generateSubtract(5).setup.visibleNumbers).toEqual([]);
    }
  });

  it('la instrucción lleva los operandos con signo − y nunca el resultado aislado', () => {
    for (let i = 0; i < MUESTRAS; i++) {
      const ex = generateSubtract(2);
      const [m, b] = ex.setup.operands as [number, number];
      const result = ex.correctAnswer as number;
      expect(ex.instruction).toContain(`${m} − ${b}`);
      if (result !== m && result !== b) {
        expect(new RegExp(`\\b${result}\\b`).test(ex.instruction)).toBe(false);
      }
    }
  });
});

describe('sin repetición (add y subtract)', () => {
  it.each(LEVELS)('nivel %i: 10 ejercicios seguidos, todos distintos y sin dos iguales consecutivos', (level) => {
    for (const type of ['add', 'subtract'] as const) {
      const engine = new ExerciseEngine(50);
      const keys: string[] = [];
      for (let i = 0; i < 10; i++) {
        keys.push(engine.generate(type, level).deduplicationKey);
      }
      expect(new Set(keys).size).toBe(10);
      for (let i = 1; i < keys.length; i++) {
        expect(keys[i]).not.toBe(keys[i - 1]);
      }
    }
  });

  it('add y subtract nunca se mezclan en las claves', () => {
    const engine = new ExerciseEngine(50);
    for (let i = 0; i < 10; i++) {
      expect(engine.generate('add', 2).deduplicationKey.startsWith('add-')).toBe(true);
      expect(engine.generate('subtract', 2).deduplicationKey.startsWith('subtract-')).toBe(true);
    }
  });
});

/** Comprueba que el ejercicio generado es coherente como tipo Exercise. */
describe('estructura común', () => {
  it('cada ejercicio tiene id único, instrucción y pista', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 20; i++) {
      for (const ex of [generateAdd(1), generateSubtract(1)] as Exercise[]) {
        ids.add(ex.id);
        expect(ex.instruction.length).toBeGreaterThan(0);
        expect(ex.hints).toContain('Puedes dar un salto grande o varios pequeños');
        expect(ex.setup.readOnly).toBe(false);
      }
    }
    expect(ids.size).toBe(40);
  });
});
