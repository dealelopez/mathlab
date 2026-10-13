export interface CounterProps {
  /** Posición X del centro */
  cx: number;
  /** Posición Y del centro */
  cy: number;
  /** Radio */
  r: number;
  /** Color de la ficha */
  color?: string;
  /** Si la ficha está presente (visible) o no */
  filled: boolean;
}

/**
 * Counter — ficha circular del ten frame.
 * Rellena con color pleno si `filled`, o guía sutil punteada si está vacía.
 */
export default function Counter({ cx, cy, r, color = '#6366F1', filled }: CounterProps) {
  if (!filled) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#D1D5DB"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        data-filled="false"
      />
    );
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={color}
      stroke="rgba(0, 0, 0, 0.25)"
      strokeWidth={2}
      data-filled="true"
    />
  );
}
