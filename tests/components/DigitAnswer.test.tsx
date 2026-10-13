import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, fireEvent } from '@testing-library/react';
import DigitAnswer from '../../src/components/primitives/DigitAnswer';

function setupControlled(initial: number | null = null) {
  const onChange = vi.fn();
  function Wrapper() {
    const [value, setValue] = useState<number | null>(initial);
    return (
      <DigitAnswer
        value={value}
        onChange={(v) => {
          setValue(v);
          onChange(v);
        }}
      />
    );
  }
  const utils = render(<Wrapper />);
  return { ...utils, onChange };
}

describe('DigitAnswer', () => {
  it('vacío: una fila activa + tira 0-9 + botón borrar', () => {
    const { getByTestId } = setupControlled();
    expect(getByTestId('digit-strip')).toBeInTheDocument();
    for (let d = 0; d <= 9; d++) {
      expect(getByTestId(`digit-${d}`)).toBeInTheDocument();
    }
    expect(getByTestId('digit-back')).toBeInTheDocument();
    expect(getByTestId('digit-row')).toHaveAttribute('data-filled', 'false');
  });

  it('tocar un dígito lo muestra al instante en su fila y llama onChange', () => {
    const { getByTestId, onChange, container } = setupControlled();
    fireEvent.click(getByTestId('digit-4'));
    expect(onChange).toHaveBeenCalledWith(4);
    // El wrapper controla el valor, así que la fila se rellena al instante
    const row = container.querySelector('[data-testid="digit-row"]')!;
    expect(row).toHaveAttribute('data-filled', 'true');
    expect(row.textContent).toBe('4');
  });

  it('dos dígitos forman el número (4, 2 → 42) en dos filas', () => {
    const { getByTestId, onChange, container } = setupControlled();
    fireEvent.click(getByTestId('digit-4'));
    fireEvent.click(getByTestId('digit-2'));
    expect(onChange).toHaveBeenLastCalledWith(42);
    const filled = container.querySelectorAll('[data-testid="digit-row"][data-filled="true"]');
    expect(filled).toHaveLength(2);
  });

  it('borrar quita la última cifra (42 → 4 → vacío/null)', () => {
    const { getByTestId, onChange } = setupControlled(42);
    fireEvent.click(getByTestId('digit-back'));
    expect(onChange).toHaveBeenCalledWith(4);
    fireEvent.click(getByTestId('digit-back'));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('con dígitos libres la tira está habilitada', () => {
    const { getByTestId } = setupControlled(4);
    expect(getByTestId('digit-5').hasAttribute('disabled')).toBe(false);
  });

  it('al completar maxDigits la tira se desactiva', () => {
    const { getByTestId } = render(<DigitAnswer value={42} onChange={() => {}} maxDigits={2} />);
    expect(getByTestId('digit-5').hasAttribute('disabled')).toBe(true);
  });

  it('filas rellenas: color aclarado y desactivadas (no cambian el valor)', () => {
    const { onChange, container } = setupControlled(7);
    const row = container.querySelector('[data-testid="digit-row"][data-filled="true"]')!;
    expect(row.className).toContain('bg-slate-100');
    fireEvent.click(row);
    expect(onChange).not.toHaveBeenCalled();
  });
});
