import type { ExerciseType, DifficultyLevel } from '../types';
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
