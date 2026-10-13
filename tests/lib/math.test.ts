import { describe, it, expect } from 'vitest';
import {
  randomInt,
  randomFromArray,
  shuffleArray,
  generateUniqueId,
  numberToDigits,
  digitsToNumber,
  distributeToRows,
  valueToX,
  xToValue,
} from '../../src/lib/math';

describe('randomInt', () => {
  it('siempre devuelve valor dentro del rango (1000 iteraciones)', () => {
    for (let i = 0; i < 1000; i++) {
      const val = randomInt(3, 7);
      expect(val).toBeGreaterThanOrEqual(3);
      expect(val).toBeLessThanOrEqual(7);
    }
  });

  it('funciona cuando min === max', () => {
    expect(randomInt(5, 5)).toBe(5);
  });
});

describe('randomFromArray', () => {
  it('devuelve un elemento del array', () => {
    const arr = [10, 20, 30];
    for (let i = 0; i < 100; i++) {
      expect(arr).toContain(randomFromArray(arr));
    }
  });

  it('lanza error con array vacío', () => {
    expect(() => randomFromArray([])).toThrow();
  });
});

describe('shuffleArray', () => {
  it('no pierde ni duplica elementos', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = shuffleArray(original);
    expect(shuffled).toHaveLength(original.length);
    expect(shuffled.sort((a, b) => a - b)).toEqual(original);
  });

  it('no muta el array original', () => {
    const original = [1, 2, 3];
    const copy = [...original];
    shuffleArray(original);
    expect(original).toEqual(copy);
  });
});

describe('generateUniqueId', () => {
  it('genera IDs distintos en 1000 llamadas', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateUniqueId('test'));
    }
    expect(ids.size).toBe(1000);
  });

  it('incluye el prefijo', () => {
    const id = generateUniqueId('represent-3');
    expect(id.startsWith('represent-3-')).toBe(true);
  });
});

describe('numberToDigits', () => {
  it('convierte números correctamente', () => {
    expect(numberToDigits(0)).toEqual([0]);
    expect(numberToDigits(5)).toEqual([5]);
    expect(numberToDigits(42)).toEqual([4, 2]);
    expect(numberToDigits(347)).toEqual([3, 4, 7]);
    expect(numberToDigits(100)).toEqual([1, 0, 0]);
  });
});

describe('digitsToNumber', () => {
  it('convierte arrays correctamente', () => {
    expect(digitsToNumber([0])).toBe(0);
    expect(digitsToNumber([5])).toBe(5);
    expect(digitsToNumber([4, 2])).toBe(42);
    expect(digitsToNumber([3, 4, 7])).toBe(347);
  });

  it('es inversa de numberToDigits', () => {
    for (const n of [0, 1, 9, 10, 42, 100, 347, 999]) {
      expect(digitsToNumber(numberToDigits(n))).toBe(n);
    }
  });
});

describe('valueToX', () => {
  it('5 en rango [0,10] con línea de 0 a 400 → 200', () => {
    expect(valueToX(5, 0, 10, 0, 400)).toBe(200);
  });

  it('mapea extremos correctamente', () => {
    expect(valueToX(0, 0, 10, 20, 420)).toBe(20);
    expect(valueToX(10, 0, 10, 20, 420)).toBe(420);
  });
});

describe('xToValue', () => {
  it('200 en rango [0,10] con línea de 0 a 400, step=1 → 5', () => {
    expect(xToValue(200, 0, 10, 0, 400, 1)).toBe(5);
  });

  it('210 en rango [0,10] con step=1 → 5 (snap)', () => {
    expect(xToValue(210, 0, 10, 0, 400, 1)).toBe(5);
  });

  it('250 en rango [0,10] con step=1 → 6 (más cerca de 6 que de 5)', () => {
    expect(xToValue(250, 0, 10, 0, 400, 1)).toBe(6);
  });

  it('recorta al rango [min, max]', () => {
    expect(xToValue(-50, 0, 10, 0, 400, 1)).toBe(0);
    expect(xToValue(500, 0, 10, 0, 400, 1)).toBe(10);
  });
});
describe('distributeToRows', () => {
  it('distribuye correctamente', () => {
    expect(distributeToRows(15, 2, 10)).toEqual([10, 5]);
    expect(distributeToRows(7, 2, 10)).toEqual([7, 0]);
    expect(distributeToRows(30, 3, 10)).toEqual([10, 10, 10]);
    expect(distributeToRows(0, 2, 10)).toEqual([0, 0]);
  });

  it('no excede el máximo por fila', () => {
    const result = distributeToRows(25, 3, 10);
    for (const v of result) {
      expect(v).toBeLessThanOrEqual(10);
    }
  });
});
