import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import NumberPad from '../../src/components/primitives/NumberPad';

describe('NumberPad', () => {
  it('renderiza botones 0-9, borrar y confirmar', () => {
    const { getByTestId } = render(
      <NumberPad onInput={() => {}} onClear={() => {}} onConfirm={() => {}} />,
    );
    for (let d = 0; d <= 9; d++) {
      expect(getByTestId(`numpad-${d}`)).toBeInTheDocument();
    }
    expect(getByTestId('numpad-clear')).toBeInTheDocument();
    expect(getByTestId('numpad-confirm')).toBeInTheDocument();
  });

  it('click en dígito: onInput llamado con el dígito correcto', () => {
    const onInput = vi.fn();
    const { getByTestId } = render(
      <NumberPad onInput={onInput} onClear={() => {}} onConfirm={() => {}} />,
    );
    fireEvent.click(getByTestId('numpad-7'));
    expect(onInput).toHaveBeenCalledTimes(1);
    expect(onInput).toHaveBeenCalledWith(7);
  });

  it('click en borrar: onClear llamado', () => {
    const onClear = vi.fn();
    const { getByTestId } = render(
      <NumberPad onInput={() => {}} onClear={onClear} onConfirm={() => {}} />,
    );
    fireEvent.click(getByTestId('numpad-clear'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('click en confirmar: onConfirm llamado', () => {
    const onConfirm = vi.fn();
    const { getByTestId } = render(
      <NumberPad onInput={() => {}} onClear={() => {}} onConfirm={onConfirm} />,
    );
    fireEvent.click(getByTestId('numpad-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('dígitos habilitados cuando currentValue no alcanza maxDigits', () => {
    const { getByTestId } = render(
      <NumberPad
        onInput={() => {}}
        onClear={() => {}}
        onConfirm={() => {}}
        maxDigits={3}
        currentValue="42"
      />,
    );
    expect(getByTestId('numpad-5').hasAttribute('disabled')).toBe(false);
  });

  it('dígitos desactivados cuando currentValue alcanza maxDigits', () => {
    const { getByTestId } = render(
      <NumberPad
        onInput={() => {}}
        onClear={() => {}}
        onConfirm={() => {}}
        maxDigits={3}
        currentValue="420"
      />,
    );
    expect(getByTestId('numpad-5').hasAttribute('disabled')).toBe(true);
    // Borrar y confirmar siguen habilitados
    expect(getByTestId('numpad-clear').hasAttribute('disabled')).toBe(false);
    expect(getByTestId('numpad-confirm').hasAttribute('disabled')).toBe(false);
  });
});
