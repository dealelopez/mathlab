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

  /**
   * Patrones disponibles para series.
   * FIX (incongruencia comentario vs mapa): el mapa real usa
   * ['+1', '+2', '+5', '+10', '-1', '-2', '-5', '-10', '*2'] según nivel.
   */
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
  | number // represent, identify, placement
  | number[]; // decompose (partes), series (valores ocultos)

/**
 * Ejercicio generado por el engine. Es la unidad atómica del sistema.
 */
export interface Exercise {
  /** ID único (para React keys y referencias) */
  id: string;

  /**
   * Clave semántica para detección de duplicados. El engine compara esta clave contra el historial.
   * Formato por tipo (FIX: unificado con task-09, antes task-01 decía
   * 'decompose-{difficulty}-{target}-{parts}' de forma ambigua):
   *   represent:  'represent-{difficulty}-{manipulative}-{target}'
   *   identify:   'identify-{difficulty}-{manipulative}-{shownValue}'
   *   decompose:  'decompose-{difficulty}-{target}-{correctParts.join(",")}'
   *   series:     'series-{difficulty}-{pattern}-{start}'
   *   placement:  'placement-{difficulty}-{target}'
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
