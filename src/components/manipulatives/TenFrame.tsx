import Counter from '../primitives/Counter';

export interface TenFrameProps {
  /** Número de marcos: 1 (hasta 10) o 2 (hasta 20). Default 1 */
  frames?: number;
  /** Fichas colocadas (0 a frames×10) */
  value: number;
  /** Callback cuando cambia el valor */
  onChange: (value: number) => void;
  /** Desactiva la interacción */
  readOnly?: boolean;
  /** Color de las fichas */
  counterColor?: string;
  /** Mostrar el valor numérico (default true) */
  showValue?: boolean;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

const COLS = 5;
const ROWS = 2;
const CELLS_PER_FRAME = COLS * ROWS;
const CELL = 40;
const FRAME_GAP = 24;

/**
 * TenFrame — cuadrícula 2×5 interactiva (simple hasta 10 o doble hasta 20).
 * Las fichas se colocan de izquierda a derecha, de arriba a abajo,
 * llenando el primer marco antes del segundo.
 */
export default function TenFrame({
  frames = 1,
  value,
  onChange,
  readOnly = false,
  counterColor = '#6366F1',
  showValue = true,
}: TenFrameProps) {
  const safeFrames = frames >= 2 ? 2 : 1;
  const max = safeFrames * CELLS_PER_FRAME;
  const safeValue = clamp(Math.round(value), 0, max);

  const width = safeFrames * COLS * CELL + (safeFrames - 1) * FRAME_GAP;
  const height = ROWS * CELL;

  const handleCellClick = (filled: boolean) => {
    if (readOnly) return;
    onChange(filled ? Math.max(0, safeValue - 1) : Math.min(max, safeValue + 1));
  };

  const cells: { key: string; x: number; y: number; filled: boolean }[] = [];
  for (let f = 0; f < safeFrames; f++) {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const pos = f * CELLS_PER_FRAME + row * COLS + col;
        cells.push({
          key: `${f}-${row}-${col}`,
          x: f * (COLS * CELL + FRAME_GAP) + col * CELL,
          y: row * CELL,
          filled: pos < safeValue,
        });
      }
    }
  }

  return (
    <div className="inline-block">
      <svg
        width={width}
        height={height}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={safeValue}
      >
        {cells.map((cell) => (
          <g key={cell.key}>
            <rect
              x={cell.x}
              y={cell.y}
              width={CELL}
              height={CELL}
              fill={cell.filled ? '#EEF2FF' : '#FFFFFF'}
              stroke="#6366F1"
              strokeWidth={1.5}
              data-testid="tenframe-cell"
              data-filled={cell.filled ? 'true' : 'false'}
              onClick={readOnly ? undefined : () => handleCellClick(cell.filled)}
              style={readOnly ? undefined : { cursor: 'pointer' }}
            />
            <g
              onClick={readOnly ? undefined : () => handleCellClick(cell.filled)}
              style={readOnly ? undefined : { cursor: 'pointer' }}
            >
              <Counter
                cx={cell.x + CELL / 2}
                cy={cell.y + CELL / 2}
                r={CELL / 2 - 6}
                color={counterColor}
                filled={cell.filled}
              />
            </g>
          </g>
        ))}
      </svg>
      {showValue && (
        <p data-testid="tenframe-value" className="mt-2 text-center text-2xl font-bold tabular-nums">
          {safeValue}
        </p>
      )}
    </div>
  );
}
