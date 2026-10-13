import { useState } from 'react';
import NumberPad from './NumberPad';

export interface AnswerSlotProps {
  /** ID único del slot (para drag-drop) */
  id: string;
  /** Valor actual (null si vacío) */
  value: number | null;
  /** Callback cuando cambia el valor */
  onChange: (value: number | null) => void;
  /**
   * Modo de interacción:
   * - 'drag-target': acepta drop de AnswerChip
   * - 'input': al tocar, abre NumberPad
   */
  mode: 'drag-target' | 'input';
  /** Texto placeholder cuando vacío (default "?") */
  placeholder?: string;
  /** Estado de feedback: null (neutro), 'correct', 'incorrect' */
  status?: 'correct' | 'incorrect' | null;
  /** Tamaño del slot en px (default 48) */
  size?: number;
}

/**
 * AnswerSlot — hueco que acepta una respuesta por drag o por teclado.
 * En modo 'input' abre un NumberPad inline al tocarlo.
 */
export default function AnswerSlot({
  id,
  value,
  onChange,
  mode,
  placeholder = '?',
  status = null,
  size = 48,
}: AnswerSlotProps) {
  const [padOpen, setPadOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const openPad = () => {
    if (mode !== 'input') return;
    setDraft(value === null ? '' : String(value));
    setPadOpen(true);
  };

  const border =
    status === 'correct'
      ? 'border-green-500 bg-green-50 text-green-700'
      : status === 'incorrect'
        ? 'border-orange-500 bg-orange-50 text-orange-700'
        : value === null
          ? 'border-dashed border-slate-400 bg-slate-50 text-slate-400'
          : 'border-solid border-slate-600 bg-white text-slate-900';

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div
        data-testid="answer-slot"
        data-slot-id={mode === 'drag-target' ? id : undefined}
        data-status={status ?? 'none'}
        onClick={mode === 'input' ? openPad : undefined}
        style={{
          width: size,
          height: size,
          cursor: mode === 'input' ? 'pointer' : undefined,
        }}
        className={`flex items-center justify-center rounded-lg border-2 text-2xl font-bold tabular-nums ${border}`}
      >
        {mode === 'input' && padOpen ? (draft === '' ? placeholder : draft) : (value === null ? placeholder : value)}
      </div>
      {mode === 'input' && padOpen && (
        <NumberPad
          currentValue={draft}
          onInput={(d) => setDraft((s) => (s.length >= 3 ? s : `${s}${d}`))}
          onClear={() => setDraft((s) => s.slice(0, -1))}
          onConfirm={() => {
            onChange(draft === '' ? null : Number(draft));
            setPadOpen(false);
          }}
        />
      )}
    </div>
  );
}
