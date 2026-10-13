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
 * Formato: "{prefix}-{timestamp}-{random}"
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

/**
 * Convierte un valor de la recta numérica a coordenada X del SVG.
 * Ej: valueToX(5, 0, 10, 0, 400) → 200
 */
export function valueToX(
  value: number,
  min: number,
  max: number,
  lineStart: number,
  lineEnd: number,
): number {
  if (max === min) return lineStart;
  return lineStart + ((value - min) / (max - min)) * (lineEnd - lineStart);
}

/**
 * Convierte una coordenada X del SVG a valor, con snap al múltiplo
 * de `step` más cercano y recorte al rango [min, max].
 * Ej: xToValue(250, 0, 10, 0, 400, 1) → 6
 */
export function xToValue(
  x: number,
  min: number,
  max: number,
  lineStart: number,
  lineEnd: number,
  step: number,
): number {
  const safeStep = step > 0 ? step : 1;
  const raw = min + ((x - lineStart) / (lineEnd - lineStart)) * (max - min);
  const snapped = Math.round(raw / safeStep) * safeStep;
  const clamped = Math.min(max, Math.max(min, snapped));
  const decimals = (String(safeStep).split('.')[1] ?? '').length;
  return Number(clamped.toFixed(decimals));
}
