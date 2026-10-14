import { valueToX, xToValue } from '../../lib/math';

export interface Marker {
  /** Posición en la recta (valor numérico) */
  position: number;
  /** Color del marcador */
  color: string;
  /** Etiqueta opcional (se muestra encima del marcador) */
  label?: string;
}

export interface Jump {
  /** Posición de inicio del salto */
  from: number;
  /** Posición de fin del salto */
  to: number;
  /** Color del arco */
  color: string;
}

export interface NumberLineProps {
  /** Valor mínimo de la recta (default 0) */
  min?: number;
  /** Valor máximo de la recta (default 10) */
  max?: number;
  /** Distancia entre marcas (default 1) */
  step?: number;
  /**
   * Qué números mostrar debajo de las marcas.
   * - true: mostrar todos
   * - false: no mostrar ninguno
   * - number[]: mostrar solo estos valores
   * Default: true
   */
  showNumbers?: boolean | number[];
  /** Marcadores colocados en la recta */
  markers?: Marker[];
  /** Callback al colocar un marcador tocando la recta */
  onPlaceMarker?: (position: number) => void;
  /** Saltos visualizados como arcos sobre la recta */
  jumps?: Jump[];
  /**
   * Modo de interacción:
   * - 'place': tocar la recta coloca un marcador (snap al step más cercano)
   * - 'none': no interactivo, solo visualización
   * Default: 'none'
   */
  interactive?: 'place' | 'none';
  /** Desactiva la interacción */
  readOnly?: boolean;
  /** Ancho del SVG (default 500) */
  width?: number;
  /** Alto del SVG (default 80) */
  height?: number;
}

const PAD = 40;

/**
 * NumberLine — recta numérica SVG con marcas, números, marcadores y saltos.
 * En modo 'place', tocar la recta llama a onPlaceMarker con el snap al step.
 */
export default function NumberLine({
  min = 0,
  max = 10,
  step = 1,
  showNumbers = true,
  markers = [],
  onPlaceMarker,
  jumps = [],
  interactive = 'none',
  readOnly = false,
  width = 500,
  height = 80,
}: NumberLineProps) {
  const safeStep = step > 0 ? step : 1;
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const lineStart = PAD;
  const lineEnd = width - PAD;
  const baseY = 45;

  const tickCount = Math.round((hi - lo) / safeStep) + 1;
  const ticks = Array.from({ length: tickCount }, (_, i) => lo + i * safeStep);

  const showNumber = (v: number): boolean => {
    if (showNumbers === true) return true;
    if (showNumbers === false) return false;
    return showNumbers.some((n) => Math.abs(n - v) < 1e-9);
  };

  const canInteract = interactive === 'place' && !readOnly && onPlaceMarker !== undefined;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!canInteract) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    onPlaceMarker!(xToValue(x, lo, hi, lineStart, lineEnd, safeStep));
  };

  const xOf = (v: number): number =>
    valueToX(Math.min(hi, Math.max(lo, v)), lo, hi, lineStart, lineEnd);

  return (
    <svg
      width={width}
      height={height}
      onClick={handleClick}
      style={canInteract ? { cursor: 'pointer' } : undefined}
      data-testid="number-line"
    >
      {/* Línea base */}
      <line x1={lineStart} y1={baseY} x2={lineEnd} y2={baseY} stroke="#374151" strokeWidth={3} strokeLinecap="round" />
      {/* Marcas: altas en números rotulados, cortas en el resto (para contar) */}
      {ticks.map((t) => {
        const major = showNumber(t);
        const half = major ? 10 : 5;
        return (
          <line
            key={t}
            x1={xOf(t)}
            y1={baseY - half}
            x2={xOf(t)}
            y2={baseY + half}
            stroke={major ? '#374151' : '#9CA3AF'}
            strokeWidth={major ? 2 : 1.5}
            data-testid="numberline-tick"
            data-major={major ? 'true' : undefined}
          />
        );
      })}
      {/* Números */}
      {ticks
        .filter(showNumber)
        .map((t) => (
          <text
            key={t}
            x={xOf(t)}
            y={baseY + 26}
            textAnchor="middle"
            fontSize={13}
            fill="#374151"
            data-testid="numberline-number"
          >
            {t}
          </text>
        ))}
      {/* Saltos */}
      {jumps.map((j, i) => {
        const x1 = xOf(j.from);
        const x2 = xOf(j.to);
        const lift = Math.min(40, Math.max(14, Math.abs(x2 - x1) / 3));
        return (
          <path
            key={i}
            d={`M ${x1} ${baseY - 4} Q ${(x1 + x2) / 2} ${baseY - 4 - lift * 2} ${x2} ${baseY - 4}`}
            fill="none"
            stroke={j.color}
            strokeWidth={2.5}
            data-testid="numberline-jump"
          />
        );
      })}
      {/* Marcadores */}
      {markers.map((m, i) => {
        const x = xOf(m.position);
        return (
          <g key={i} data-testid="numberline-marker" data-position={m.position}>
            <polygon points={`${x - 8},${baseY - 12} ${x + 8},${baseY - 12} ${x},${baseY - 2}`} fill={m.color} />
            {m.label !== undefined && (
              <text x={x} y={baseY - 18} textAnchor="middle" fontSize={12} fontWeight="bold" fill={m.color}>
                {m.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
