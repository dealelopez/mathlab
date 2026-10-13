import { describe, it, expect } from 'vitest';
import { generateRepresent } from '../../../src/engine/generators/represent';
import { generateIdentify } from '../../../src/engine/generators/identify';
import { validateRepresent } from '../../../src/engine/validators/represent';
import { validateIdentify } from '../../../src/engine/validators/identify';

describe('validateRepresent', () => {
  it('valor exacto → correct; otro → incorrect', () => {
    const ex = { ...generateRepresent(2), correctAnswer: 7 };
    expect(validateRepresent(ex, 7).correct).toBe(true);
    expect(validateRepresent(ex, 6).correct).toBe(false);
  });
});

describe('validateIdentify', () => {
  it('valor exacto → correct; otro → incorrect', () => {
    const ex = { ...generateIdentify(2), correctAnswer: 7 };
    expect(validateIdentify(ex, 7).correct).toBe(true);
    expect(validateIdentify(ex, 8).correct).toBe(false);
  });
});
