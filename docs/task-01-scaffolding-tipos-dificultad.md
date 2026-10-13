# 01 — Scaffolding, tipos base y sistema de dificultad

## Objetivo

Montar el proyecto base (Vite + React 19 + TypeScript + Tailwind 4 + Vitest), definir todos los tipos compartidos del sistema, e implementar el mapa de dificultad que será la columna vertebral de la adaptabilidad. Al terminar, `pnpm run dev` arranca sin errores y `pnpm test` ejecuta los primeros tests del engine y utilidades.

---

## Contexto

Esta es la primera tarea. No depende de ninguna otra. Establece:

- La estructura de directorios completa (vacía donde corresponda).
- Los tipos TypeScript que usarán TODOS los componentes y el engine.
- El sistema de dificultad (`DIFFICULTY_MAP`) que controla qué rangos y configuraciones usa cada tipo de ejercicio en cada nivel.
- Las utilidades matemáticas puras que usarán los generadores de ejercicios.

---

## Archivos a crear

### Estructura de directorios

```bash
mkdir -p math-practice/{src/{hooks,engine/{generators,validators},components/{primitives,manipulatives,activities,tutorial,layout},lib},tests/{engine/{generators,validators},components,lib},docs}
```

### package.json

```json
{
  "name": "math-practice",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "jsdom": "^25.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vitest": "^3.0.0"
  }
}
```

### vite.config.ts

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // base = nombre del repo (mathlab). Con dominio propio, '/'.
  base: '/mathlab/',
  plugins: [react(), tailwindcss()],
});
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src", "tests"]
}
```

### vitest.config.ts

Archivo separado para configurar Vitest con jsdom y React Testing Library:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
```

### tests/setup.ts

```ts
import '@testing-library/jest-dom/vitest';
```

### index.html

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Math Practice</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### src/index.css

Mínimo. Solo importa Tailwind. El diseño visual se itera después.

```css
@import "tailwindcss";
```

### src/main.tsx

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### src/App.tsx

Placeholder mínimo. Se completará en la tarea 15 con la navegación real.

```tsx
export default function App() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Math Practice</h1>
      <p>Proyecto en construcción.</p>
    </div>
  );
}
```

---

### src/types.ts — Tipos globales

Estos tipos se usan en TODA la aplicación: componentes, engine, y tests.

```ts
/** Manipulativos disponibles */
export type Manipulative = 'rekenrek' | 'abacus' | 'tenframe' | 'numberline';

/** Tipos de ejercicio */
export type ExerciseType = 'represent' | 'identify' | 'decompose' | 'series' | 'placement';

/** Niveles de dificultad: 1 (más fácil) a 5 (más difícil) */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

/** Modos de respuesta en ejercicios */
export type AnswerMode = 'drag' | 'free';

/** Resultado de la validación de un ejercicio */
export interface ValidationResult {
  correct: boolean;
  message: string;
  expected?: unknown;  // Valor esperado (para hints)
}
```

---

### src/engine/types.ts — Tipos del motor de ejercicios

Estos tipos definen la interfaz estándar de todo ejercicio generado. Son el contrato entre el engine (lógica pura) y los componentes React.

```ts
import type { Manipulative, ExerciseType, DifficultyLevel, AnswerMode, ValidationResult } from '../types';

/**
 * Configuración derivada de la dificultad para un tipo de ejercicio.
 * El DIFFICULTY_MAP traduce cada combinación (tipo, nivel) a uno de estos.
 */
export interface DifficultyConfig {
  /** Rango de números que puede generar [min, max] */
  numberRange: [number, number];

  /** Manipulativos válidos para este tipo+nivel (solo represent/identify). El generador elige de esta lista. */
  validManipulatives?: Manipulative[];

  /** Configuración del manipulativo según la dificultad */
  manipulativeConfig: {
    /** Filas del rekenrek (1, 2, 5, 10) */
    rekenrekRows?: number;
    /** Columnas del ábaco como array de labels, ej: ['U'] o ['C','D','U'] */
    abacusColumns?: string[];
    /** Marcos del ten frame (1 o 2) */
    tenFrameCount?: number;
    /** Rango de la recta numérica [min, max] */
    numberLineRange?: [number, number];
  };

  /** Número de distractores en ejercicios con opciones */
  distractorCount: number;

  /** Número de posiciones ocultas en series */
  hiddenCount: number;

  /** Tolerancia de posición en recta numérica (en unidades) */
  tolerance: number;

  /** Número de partes en descomposición (2 o 3) */
  decomposeParts: number;

  /** Patrones disponibles para series: ['+1', '+2', '+5', '+10', '-1', '*2'] */
  seriesPatterns: string[];
}

/**
 * Setup inicial del ejercicio. Describe el estado del manipulativo
 * y las opciones del ejercicio antes de que el niño interactúe.
 */
export interface ExerciseSetup {
  /** Manipulativo a usar (si aplica — decompose y series no siempre usan uno) */
  manipulative?: Manipulative;

  /** Config del manipulativo derivada de la dificultad */
  manipulativeConfig?: Record<string, unknown>;

  /** Valor inicial del manipulativo (0 para represent, N para identify) */
  initialValue?: number;

  /** Si el manipulativo debe estar en readOnly */
  readOnly?: boolean;

  /** Opciones arrastrables (para modo drag) */
  options?: number[];

  /** Valores visibles de la serie (para series) */
  visibleValues?: (number | null)[];

  /** El patrón de la serie como descripción legible (para debug/tests) */
  seriesPattern?: string;

  /** Rango de la recta numérica */
  numberLineRange?: [number, number];

  /** Números visibles en la recta */
  visibleNumbers?: number[];

  /** Número de partes para descomposición */
  parts?: number;

  /** Valor prerellenado en una de las partes (dificultad fácil) */
  prefilledValue?: number | null;
}

/**
 * Respuesta del niño. Estructura flexible según el tipo de ejercicio.
 */
export type Answer =
  | number                  // represent, identify, placement
  | number[];               // decompose (partes), series (valores ocultos)

/**
 * Ejercicio generado por el engine. Es la unidad atómica del sistema.
 */
export interface Exercise {
  /** ID único (para React keys y referencias) */
  id: string;

  /** Clave semántica para detección de duplicados. El engine compara esta clave contra el historial.
   *  Formato por tipo:
   *    represent:  'represent-{difficulty}-{manipulative}-{target}'
   *    identify:   'identify-{difficulty}-{manipulative}-{shownValue}'
   *    decompose:  'decompose-{difficulty}-{target}-{parts}'
   *    series:     'series-{difficulty}-{pattern}-{start}'
   *    placement:  'placement-{difficulty}-{target}'
   */
  deduplicationKey: string;

  /** Tipo de ejercicio */
  type: ExerciseType;

  /** Manipulativo asociado (si aplica) */
  manipulative?: Manipulative;

  /** Nivel de dificultad que lo generó */
  difficulty: DifficultyLevel;

  /** Modo de respuesta */
  answerMode: AnswerMode;

  /** Texto de instrucción para el niño */
  instruction: string;

  /** Estado inicial del ejercicio */
  setup: ExerciseSetup;

  /** Respuesta(s) correcta(s) — usado internamente para validación */
  correctAnswer: Answer;

  /** Pistas progresivas (opcional) */
  hints?: string[];
}

/**
 * Función de validación: recibe la respuesta del niño y devuelve el resultado.
 * Cada tipo de ejercicio implementa la suya.
 */
export type ValidatorFn = (exercise: Exercise, answer: Answer) => ValidationResult;

/**
 * Función generadora: produce un ejercicio aleatorio dado tipo, dificultad y manipulativo.
 */
export type GeneratorFn = (
  difficulty: DifficultyLevel,
  manipulative?: Manipulative,
  answerMode?: AnswerMode,
) => Exercise;
```

---

### src/engine/difficulty.ts — Mapa de dificultad

Este archivo es el **centro de control de la adaptabilidad**. Cambiar un rango o añadir un nivel = editar este objeto, sin tocar generadores ni componentes.

```ts
import type { ExerciseType, DifficultyLevel, Manipulative } from '../types';
import type { DifficultyConfig } from './types';

/**
 * DIFFICULTY_MAP — Configuración de dificultad por tipo de ejercicio y nivel.
 *
 * Para añadir un nivel 6:
 *   1. Añadir la entrada en cada tipo de ejercicio.
 *   2. Ampliar el tipo DifficultyLevel en types.ts.
 *   Nada más. Los generadores y componentes leen de aquí.
 *
 * Para recalibrar (ej: nivel 3 debería llegar hasta 30):
 *   Solo cambiar numberRange aquí. Todo lo demás se adapta.
 */
export const DIFFICULTY_MAP: Record<ExerciseType, Record<DifficultyLevel, DifficultyConfig>> = {

  represent: {
    1: {
      numberRange: [1, 5],
      validManipulatives: ['rekenrek', 'abacus', 'tenframe'],
      manipulativeConfig: { rekenrekRows: 1, abacusColumns: ['U'], tenFrameCount: 1 },
      distractorCount: 0, hiddenCount: 0, tolerance: 0, decomposeParts: 2,
      seriesPatterns: [],
    },
    2: {
      numberRange: [1, 10],
      validManipulatives: ['rekenrek', 'abacus', 'tenframe'],
      manipulativeConfig: { rekenrekRows: 2, abacusColumns: ['U'], tenFrameCount: 1 },
      distractorCount: 0, hiddenCount: 0, tolerance: 0, decomposeParts: 2,
      seriesPatterns: [],
    },
    3: {
      numberRange: [1, 20],
      validManipulatives: ['rekenrek', 'abacus', 'tenframe'],
      manipulativeConfig: { rekenrekRows: 2, abacusColumns: ['D', 'U'], tenFrameCount: 2 },
      distractorCount: 0, hiddenCount: 0, tolerance: 0, decomposeParts: 2,
      seriesPatterns: [],
    },
    4: {
      numberRange: [1, 50],
      validManipulatives: ['rekenrek', 'abacus'],
      manipulativeConfig: { rekenrekRows: 5, abacusColumns: ['D', 'U'] },
      distractorCount: 0, hiddenCount: 0, tolerance: 0, decomposeParts: 2,
      seriesPatterns: [],
    },
    5: {
      numberRange: [1, 100],
      validManipulatives: ['rekenrek', 'abacus'],
      manipulativeConfig: { rekenrekRows: 10, abacusColumns: ['C', 'D', 'U'] },
      distractorCount: 0, hiddenCount: 0, tolerance: 0, decomposeParts: 2,
      seriesPatterns: [],
    },
  },

  identify: {
    1: {
      numberRange: [1, 5],
      validManipulatives: ['rekenrek', 'abacus', 'tenframe', 'numberline'],
      manipulativeConfig: { rekenrekRows: 1, abacusColumns: ['U'], tenFrameCount: 1, numberLineRange: [0, 5] },
      distractorCount: 0, hiddenCount: 0, tolerance: 0, decomposeParts: 2,
      seriesPatterns: [],
    },
    2: {
      numberRange: [1, 10],
      validManipulatives: ['rekenrek', 'abacus', 'tenframe', 'numberline'],
      manipulativeConfig: { rekenrekRows: 2, abacusColumns: ['U'], tenFrameCount: 1, numberLineRange: [0, 10] },
      distractorCount: 0, hiddenCount: 0, tolerance: 0, decomposeParts: 2,
      seriesPatterns: [],
    },
    3: {
      numberRange: [1, 20],
      validManipulatives: ['rekenrek', 'abacus', 'tenframe', 'numberline'],
      manipulativeConfig: { rekenrekRows: 2, abacusColumns: ['D', 'U'], tenFrameCount: 2, numberLineRange: [0, 20] },
      distractorCount: 0, hiddenCount: 0, tolerance: 0, decomposeParts: 2,
      seriesPatterns: [],
    },
    4: {
      numberRange: [1, 50],
      validManipulatives: ['rekenrek', 'abacus', 'numberline'],
      manipulativeConfig: { rekenrekRows: 5, abacusColumns: ['D', 'U'], tenFrameCount: 2, numberLineRange: [0, 50] },
      distractorCount: 0, hiddenCount: 0, tolerance: 0, decomposeParts: 2,
      seriesPatterns: [],
    },
    5: {
      numberRange: [1, 100],
      validManipulatives: ['rekenrek', 'abacus', 'numberline'],
      manipulativeConfig: { rekenrekRows: 10, abacusColumns: ['C', 'D', 'U'], tenFrameCount: 2, numberLineRange: [0, 100] },
      distractorCount: 0, hiddenCount: 0, tolerance: 0, decomposeParts: 2,
      seriesPatterns: [],
    },
  },

  decompose: {
    1: {
      numberRange: [2, 5],
      manipulativeConfig: {},
      distractorCount: 2, hiddenCount: 0, tolerance: 0, decomposeParts: 2,
      seriesPatterns: [],
    },
    2: {
      numberRange: [2, 10],
      manipulativeConfig: {},
      distractorCount: 3, hiddenCount: 0, tolerance: 0, decomposeParts: 2,
      seriesPatterns: [],
    },
    3: {
      numberRange: [5, 20],
      manipulativeConfig: {},
      distractorCount: 4, hiddenCount: 0, tolerance: 0, decomposeParts: 2,
      seriesPatterns: [],
    },
    4: {
      numberRange: [10, 50],
      manipulativeConfig: {},
      distractorCount: 4, hiddenCount: 0, tolerance: 0, decomposeParts: 2,
      seriesPatterns: [],
    },
    5: {
      numberRange: [10, 100],
      manipulativeConfig: {},
      distractorCount: 5, hiddenCount: 0, tolerance: 0, decomposeParts: 3,
      seriesPatterns: [],
    },
  },

  series: {
    1: {
      numberRange: [1, 10],
      manipulativeConfig: {},
      distractorCount: 3, hiddenCount: 1, tolerance: 0, decomposeParts: 2,
      seriesPatterns: ['+1'],
    },
    2: {
      numberRange: [1, 20],
      manipulativeConfig: {},
      distractorCount: 3, hiddenCount: 2, tolerance: 0, decomposeParts: 2,
      seriesPatterns: ['+1', '+2'],
    },
    3: {
      numberRange: [1, 50],
      manipulativeConfig: {},
      distractorCount: 4, hiddenCount: 2, tolerance: 0, decomposeParts: 2,
      seriesPatterns: ['+2', '+5', '+10'],
    },
    4: {
      numberRange: [1, 100],
      manipulativeConfig: {},
      distractorCount: 4, hiddenCount: 2, tolerance: 0, decomposeParts: 2,
      seriesPatterns: ['+5', '+10', '-1', '-2'],
    },
    5: {
      numberRange: [1, 100],
      manipulativeConfig: {},
      distractorCount: 5, hiddenCount: 3, tolerance: 0, decomposeParts: 2,
      seriesPatterns: ['+10', '-5', '-10', '*2'],
    },
  },

  placement: {
    1: {
      numberRange: [0, 5],
      manipulativeConfig: { numberLineRange: [0, 5] },
      distractorCount: 0, hiddenCount: 0, tolerance: 0, decomposeParts: 2,
      seriesPatterns: [],
    },
    2: {
      numberRange: [0, 10],
      manipulativeConfig: { numberLineRange: [0, 10] },
      distractorCount: 0, hiddenCount: 0, tolerance: 0, decomposeParts: 2,
      seriesPatterns: [],
    },
    3: {
      numberRange: [0, 20],
      manipulativeConfig: { numberLineRange: [0, 20] },
      distractorCount: 0, hiddenCount: 0, tolerance: 1, decomposeParts: 2,
      seriesPatterns: [],
    },
    4: {
      numberRange: [0, 50],
      manipulativeConfig: { numberLineRange: [0, 50] },
      distractorCount: 0, hiddenCount: 0, tolerance: 2, decomposeParts: 2,
      seriesPatterns: [],
    },
    5: {
      numberRange: [0, 100],
      manipulativeConfig: { numberLineRange: [0, 100] },
      distractorCount: 0, hiddenCount: 0, tolerance: 5, decomposeParts: 2,
      seriesPatterns: [],
    },
  },
};

/**
 * Obtiene la configuración de dificultad para un tipo de ejercicio y nivel.
 * Esta es la función que usan TODOS los generadores.
 */
export function getDifficultyConfig(type: ExerciseType, level: DifficultyLevel): DifficultyConfig {
  return DIFFICULTY_MAP[type][level];
}
```

---

### src/lib/math.ts — Utilidades matemáticas puras

Funciones sin dependencias que usarán los generadores de ejercicios.

```ts
/**
 * Genera un entero aleatorio en el rango [min, max] (ambos incluidos).
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Elige un elemento aleatorio de un array.
 * Lanza error si el array está vacío.
 */
export function randomFromArray<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('randomFromArray: array vacío');
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/**
 * Baraja un array (Fisher-Yates). Devuelve copia nueva, no muta el original.
 */
export function shuffleArray<T>(arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/**
 * Genera un ID único basado en tipo, dificultad, timestamp y componente aleatorio.
 * Formato: "{type}-{difficulty}-{timestamp}-{random}"
 */
export function generateUniqueId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${ts}-${rand}`;
}

/**
 * Convierte un número a un array de dígitos por valor posicional.
 * Ej: numberToDigits(347) → [3, 4, 7] (centenas=3, decenas=4, unidades=7)
 * El array va de mayor a menor valor posicional.
 */
export function numberToDigits(n: number): number[] {
  if (n === 0) return [0];
  const digits: number[] = [];
  let remaining = Math.abs(n);
  while (remaining > 0) {
    digits.unshift(remaining % 10);
    remaining = Math.floor(remaining / 10);
  }
  return digits;
}

/**
 * Convierte un array de dígitos a número.
 * Ej: digitsToNumber([3, 4, 7]) → 347
 * Inversa de numberToDigits.
 */
export function digitsToNumber(digits: number[]): number {
  return digits.reduce((acc, d) => acc * 10 + d, 0);
}

/**
 * Distribuye un total entre N filas de capacidad maxPerRow.
 * Ej: distributeToRows(15, 2, 10) → [10, 5]
 * Ej: distributeToRows(7, 2, 10)  → [7, 0]
 * Llena de arriba a abajo.
 */
export function distributeToRows(total: number, rows: number, maxPerRow: number): number[] {
  const result: number[] = [];
  let remaining = total;
  for (let i = 0; i < rows; i++) {
    const value = Math.min(remaining, maxPerRow);
    result.push(value);
    remaining -= value;
  }
  return result;
}
```

---

## Tests

### tests/engine/difficulty.test.ts

Verifica que el mapa de dificultad es completo, coherente y usable.

```ts
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
        const current = DIFFICULTY_MAP[type][level as 1|2|3|4|5];
        const next = DIFFICULTY_MAP[type][(level + 1) as 1|2|3|4|5];
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
    // Niveles bajos tienen tolerancia 0, altos tienen tolerancia > 0
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
```

### tests/lib/math.test.ts

Verifica las utilidades matemáticas con tests estadísticos donde aplique.

```ts
import { describe, it, expect } from 'vitest';
import {
  randomInt,
  randomFromArray,
  shuffleArray,
  generateUniqueId,
  numberToDigits,
  digitsToNumber,
  distributeToRows,
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
```

---

## Criterio de éxito

- [ ] `pnpm install` sin errores
- [ ] `pnpm run dev` arranca y muestra "Math Practice" en el navegador
- [ ] `pnpm test` ejecuta los tests de `difficulty.test.ts` y `math.test.ts` — todos pasan
- [ ] La estructura de directorios completa existe (vacía donde corresponda)
- [ ] `src/types.ts` y `src/engine/types.ts` compilan sin errores
- [ ] `src/engine/difficulty.ts` exporta `DIFFICULTY_MAP` y `getDifficultyConfig`
- [ ] `src/lib/math.ts` exporta todas las utilidades
- [ ] No hay ningún componente React todavía — solo tipos, engine, y utilidades
