export interface NumberPadProps {
  /** Callback cuando se introduce un dígito */
  onInput: (digit: number) => void;
  /** Callback para borrar el último dígito */
  onClear: () => void;
  /** Callback para confirmar la respuesta */
  onConfirm: () => void;
  /** Número máximo de dígitos permitidos (default 3) */
  maxDigits?: number;
  /** Valor actual mostrado (para display) */
  currentValue?: string;
}

/**
 * NumberPad — teclado numérico grande para niños.
 * Los dígitos se desactivan cuando currentValue alcanza maxDigits.
 */
export default function NumberPad({
  onInput,
  onClear,
  onConfirm,
  maxDigits = 3,
  currentValue = '',
}: NumberPadProps) {
  const digitsDisabled = currentValue.length >= maxDigits;

  const btn =
    'min-h-12 min-w-12 cursor-pointer rounded-lg border bg-white px-4 py-3 text-2xl font-bold tabular-nums disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div data-testid="number-pad" className="grid w-fit grid-cols-3 gap-2">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
        <button
          key={d}
          data-testid={`numpad-${d}`}
          onClick={() => onInput(d)}
          disabled={digitsDisabled}
          className={btn}
        >
          {d}
        </button>
      ))}
      <button data-testid="numpad-clear" onClick={onClear} className={btn} aria-label="Borrar">
        ←
      </button>
      <button
        data-testid="numpad-0"
        onClick={() => onInput(0)}
        disabled={digitsDisabled}
        className={btn}
      >
        0
      </button>
      <button
        data-testid="numpad-confirm"
        onClick={onConfirm}
        className={`${btn} bg-green-600 text-white`}
        aria-label="Confirmar"
      >
        ✓
      </button>
    </div>
  );
}
