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

  it('digitCount: muestra los huecos esperados desde el inicio', () => {
    const { container } = render(<DigitAnswer value={null} onChange={() => {}} digitCount={2} />);
    const rows = container.querySelectorAll('[data-testid="digit-row"]');
    expect(rows).toHaveLength(2);
    rows.forEach((r) => expect(r).toHaveAttribute('data-filled', 'false'));
  });

  it('digitCount: al rellenar todos la tira se desactiva', () => {
    const { container, getByTestId } = render(
      <DigitAnswer value={7} onChange={() => {}} digitCount={1} />,
    );
    expect(container.querySelectorAll('[data-testid="digit-row"]')).toHaveLength(1);
    expect(getByTestId('digit-5').hasAttribute('disabled')).toBe(true);
  });

  it('digitCount={3}: tres huecos para centenas', () => {
    const { container } = render(<DigitAnswer value={null} onChange={() => {}} digitCount={3} />);
    expect(container.querySelectorAll('[data-testid="digit-row"]')).toHaveLength(3);
  });

  it('huecos en horizontal, uno al lado del otro', () => {
    const { getByTestId } = render(<DigitAnswer value={null} onChange={() => {}} digitCount={2} />);
    const rows = getByTestId('digit-rows');
    expect(rows.className).toContain('flex-row');
    expect(rows.querySelectorAll('[data-testid="digit-row"]')).toHaveLength(2);
  });

  it('arrastrar una cifra sobre otra las reordena (42 → 24)', () => {
    const { onChange, container } = setupControlled(42);
    const filled = container.querySelectorAll('[data-testid="digit-row"][data-filled="true"]');
    const row0 = filled[0]! as HTMLElement;
    const row1 = filled[1]! as HTMLElement;
    fireEvent.pointerDown(row0, { clientX: 100, clientY: 50, pointerId: 1, bubbles: true });
    fireEvent.pointerMove(row0, { clientX: 160, clientY: 50, pointerId: 1, bubbles: true });
    expect(row0).toHaveAttribute('data-dragging', 'true');
    const orig = document.elementFromPoint;
    document.elementFromPoint = (() => row1) as unknown as typeof document.elementFromPoint;
    try {
      fireEvent.pointerUp(row0, { clientX: 160, clientY: 50, pointerId: 1, bubbles: true });
    } finally {
      document.elementFromPoint = orig;
    }
    expect(onChange).toHaveBeenCalledWith(24);
  });

  it('soltar fuera de los huecos no cambia el valor', () => {
    const { onChange, container } = setupControlled(42);
    const row0 = container.querySelectorAll(
      '[data-testid="digit-row"][data-filled="true"]',
    )[0]! as HTMLElement;
    fireEvent.pointerDown(row0, { clientX: 100, clientY: 50, pointerId: 1, bubbles: true });
    fireEvent.pointerMove(row0, { clientX: 300, clientY: 200, pointerId: 1, bubbles: true });
    const orig = document.elementFromPoint;
    document.elementFromPoint = (() => null) as unknown as typeof document.elementFromPoint;
    try {
      fireEvent.pointerUp(row0, { clientX: 300, clientY: 200, pointerId: 1, bubbles: true });
    } finally {
      document.elementFromPoint = orig;
    }
    expect(onChange).not.toHaveBeenCalled();
  });

  it('toque sin arrastrar no cambia el valor', () => {
    const { onChange, container } = setupControlled(42);
    const row0 = container.querySelectorAll(
      '[data-testid="digit-row"][data-filled="true"]',
    )[0]! as HTMLElement;
    fireEvent.pointerDown(row0, { clientX: 100, clientY: 50, pointerId: 1, bubbles: true });
    fireEvent.pointerUp(row0, { clientX: 100, clientY: 50, pointerId: 1, bubbles: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('filas rellenas: color aclarado y desactivadas (no cambian el valor)', () => {
    const { onChange, container } = setupControlled(7);
    const row = container.querySelector('[data-testid="digit-row"][data-filled="true"]')!;
    expect(row.className).toContain('bg-slate-100');
    fireEvent.click(row);
    expect(onChange).not.toHaveBeenCalled();
  });
});
