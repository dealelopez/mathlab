import BeadRow from '../primitives/BeadRow';
import { distributeToRows } from '../../lib/math';

export interface RekenrekProps {
  /** Número de filas (default 2). Valores típicos: 1, 2, 5, 10 */
  rows?: number;
  /** Cuentas por fila (default 10) */
  beadsPerRow?: number;
  /** Punto de cambio de color por fila (default 5) */
  colorSplit?: number;
  /** Colores por fila [grupo1, grupo2] (default rojo + blanco) */
  colors?: [string, string];
  /**
   * Valor del rekenrek. Acepta dos formatos:
   * - number: total que se distribuye automáticamente entre filas (de arriba a abajo).
   * - number[]: valor explícito de cada fila.
   */
  value: number | number[];
  /** Callback con ambos formatos: array de valores por fila y total. */
  onChange: (values: number[], total: number) => void;
  /** Desactiva la interacción */
  readOnly?: boolean;
  /** Mostrar el total calculado (default true) */
  showTotal?: boolean;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Rekenrek — bastidor de N filas de cuentas (5 rojas + 5 blancas por defecto).
 * Cada fila es un BeadRow; el total es la suma de las filas.
 */
export default function Rekenrek({
  rows = 2,
  beadsPerRow = 10,
  colorSplit = 5,
  colors = ['#EF4444', '#FAFAFA'],
  value,
  onChange,
  readOnly = false,
  showTotal = true,
}: RekenrekProps) {
  const safeRows = Math.max(1, Math.floor(rows));
  const safeBeads = Math.max(1, Math.floor(beadsPerRow));

  const rowValues: number[] =
    typeof value === 'number'
      ? distributeToRows(Math.max(0, Math.round(value)), safeRows, safeBeads)
      : Array.from(
          { length: safeRows },
          (_, i) => clamp(Math.round(value[i] ?? 0), 0, safeBeads),
        );

  const total = rowValues.reduce((acc, v) => acc + v, 0);

  const handleRowChange = (rowIndex: number, newRowValue: number) => {
    if (readOnly) return;
    const newValues = [...rowValues];
    newValues[rowIndex] = clamp(newRowValue, 0, safeBeads);
    onChange(newValues, newValues.reduce((acc, v) => acc + v, 0));
  };

  return (
    <div className="inline-block rounded-lg border-2 border-amber-800 bg-amber-50 p-3">
      <div className="flex flex-col gap-2">
        {rowValues.map((rowValue, i) => (
          <BeadRow
            key={i}
            total={safeBeads}
            value={rowValue}
            onChange={(v) => handleRowChange(i, v)}
            colorSplit={colorSplit}
            colors={colors}
            readOnly={readOnly}
          />
        ))}
      </div>
      {showTotal && (
        <p data-testid="rekenrek-total" className="mt-3 text-center text-2xl font-bold tabular-nums">
          Total: {total}
        </p>
      )}
    </div>
  );
}
