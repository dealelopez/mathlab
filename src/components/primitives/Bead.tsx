interface BeadProps {
  /** Posición X del centro */
  cx: number;
  /** Posición Y del centro */
  cy: number;
  /** Radio de la cuenta */
  r: number;
  /** Color de relleno */
  color: string;
  /** Si la cuenta está activa (desplazada) — color pleno; inactiva = color aclarado */
  active?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Clases CSS adicionales */
  className?: string;
  /** Estilos inline adicionales (ej: transition para animar cx) */
  style?: React.CSSProperties;
}

/** Oscurece un color hex (#rrggbb) para el borde. Fallback gris si no es hex. */
function darken(hex: string, amount = 0.25): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return '#666';
  const num = parseInt(m[1]!, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `rgb(${r}, ${g}, ${b})`;
}

export default function Bead({ cx, cy, r, color, active = false, onClick, className, style }: BeadProps) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={active ? color : `color-mix(in srgb, ${color} 40%, white)`}
      stroke={darken(color)}
      strokeWidth={3}
      onClick={onClick}
      className={className}
      style={{ transition: 'cx 150ms ease', ...(onClick ? { cursor: 'pointer' } : undefined), ...style }}
    />
  );
}
