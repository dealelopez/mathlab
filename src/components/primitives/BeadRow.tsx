import { useEffect, useRef } from 'react';
import Bead from './Bead';
import { usePointerDrag } from '../../hooks/usePointerDrag';

export interface BeadRowProps {
  /** Número total de cuentas en la fila (default 10) */
  total?: number;
  /** Cuántas cuentas están activas (desplazadas a la izquierda). Controlado externamente. */
  value: number;
  /** Callback cuando el valor cambia */
  onChange: (newValue: number) => void;
  /** Posición donde cambia el color. 5 para rekenrek (5 rojas + 5 blancas), 10 para color uniforme */
  colorSplit?: number;
  /** Colores: [colorPrimerGrupo, colorSegundoGrupo]. Si solo hay uno, todas del mismo color */
  colors?: [string, string] | [string];
  /** Desactiva la interacción */
  readOnly?: boolean;
  /** Ancho total del SVG en px (el componente calcula el espaciado entre cuentas) */
  width?: number;
  /** Alto del SVG en px */
  height?: number;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * BeadRow — fila de cuentas interactiva, base del Rekenrek y del Ábaco.
 *
 * - Activas (0..value-1) agrupadas a la izquierda, inactivas a la derecha.
 * - Click en inactiva `i` → onChange(i+1); click en activa `i` → onChange(i).
 * - Drag horizontal ajusta el valor según el desplazamiento.
 */
export default function BeadRow({
  total = 10,
  value,
  onChange,
  colorSplit = 5,
  colors = ['#EF4444', '#FAFAFA'],
  readOnly = false,
  width = 300,
  height = 40,
}: BeadRowProps) {
  const safeTotal = Math.max(1, Math.floor(total));
  const safeValue = clamp(Math.round(value), 0, safeTotal);

  const padding = 4;
  const r = Math.min(height / 2 - padding, width / (safeTotal + 2) / 2);
  const step = 2 * r + 2;
  const cy = height / 2;
  const leftStart = padding + r;
  const rightEnd = width - padding - r;

  const beadColor = (i: number): string =>
    i < colorSplit ? colors[0]! : (colors[1] ?? colors[0]!);

  const beadX = (i: number): number =>
    i < safeValue ? leftStart + i * step : rightEnd - (safeTotal - 1 - i) * step;

  const handleClick = (i: number) => {
    if (readOnly) return;
    onChange(i < safeValue ? i : i + 1);
  };

  // Drag horizontal: convierte delta.x en nº de cuentas desde el valor inicial.
  const startValueRef = useRef(safeValue);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const { isDragging, handlePointerDown: hookPointerDown } = usePointerDrag({
    axis: 'x',
    disabled: readOnly,
    onDragMove: (delta) => {
      const steps = Math.round(delta.x / step);
      onChangeRef.current(clamp(startValueRef.current + steps, 0, safeTotal));
    },
    onDragEnd: (delta) => {
      const steps = Math.round(delta.x / step);
      onChangeRef.current(clamp(startValueRef.current + steps, 0, safeTotal));
    },
  });

  // Mientras no hay drag, el valor inicial sigue al valor controlado.
  useEffect(() => {
    if (!isDragging) startValueRef.current = safeValue;
  }, [safeValue, isDragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    startValueRef.current = safeValue;
    hookPointerDown(e);
  };

  return (
    <svg
      width={width}
      height={height}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={safeTotal}
      aria-valuenow={safeValue}
    >
      <line
        x1={padding}
        y1={cy}
        x2={width - padding}
        y2={cy}
        stroke="#9CA3AF"
        strokeWidth={3}
        strokeLinecap="round"
      />
      {Array.from({ length: safeTotal }, (_, i) => (
        <g
          key={i}
          onPointerDown={readOnly ? undefined : handlePointerDown}
          style={readOnly ? undefined : { touchAction: 'none' }}
        >
          <Bead
            cx={beadX(i)}
            cy={cy}
            r={r}
            color={beadColor(i)}
            active={i < safeValue}
            onClick={readOnly ? undefined : () => handleClick(i)}
            className={i < safeValue ? 'bead-active' : 'bead-inactive'}
          />
        </g>
      ))}
    </svg>
  );
}
