import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import Abacus from '../../src/components/manipulatives/Abacus';

const CDU = [
  { label: 'C', color: '#3B82F6' },
  { label: 'D', color: '#10B981' },
  { label: 'U', color: '#EF4444' },
];

function sliders(container: HTMLElement): Element[] {
  return Array.from(container.querySelectorAll('[role="slider"]'));
}

describe('Abacus', () => {
  it('value=347 con columnas [C,D,U]: filas con 3, 4 y 7', () => {
    const { container } = render(<Abacus columns={CDU} value={347} onChange={() => {}} />);
    const rs = sliders(container);
    expect(rs).toHaveLength(3);
    expect(rs[0]!.getAttribute('aria-valuenow')).toBe('3');
    expect(rs[1]!.getAttribute('aria-valuenow')).toBe('4');
    expect(rs[2]!.getAttribute('aria-valuenow')).toBe('7');
  });

  it('value=47 con columnas [C,D,U]: fila C con 0 (relleno)', () => {
    const { container } = render(<Abacus columns={CDU} value={47} onChange={() => {}} />);
    const rs = sliders(container);
    expect(rs[0]!.getAttribute('aria-valuenow')).toBe('0');
    expect(rs[1]!.getAttribute('aria-valuenow')).toBe('4');
    expect(rs[2]!.getAttribute('aria-valuenow')).toBe('7');
  });

  it('value=5 con columnas [U]: fila U con 5', () => {
    const { container } = render(
      <Abacus columns={[{ label: 'U', color: '#EF4444' }]} value={5} onChange={() => {}} />,
    );
    expect(sliders(container)[0]!.getAttribute('aria-valuenow')).toBe('5');
  });

  it('mover cuenta en decenas: onChange recibe el número actualizado', () => {
    const onChange = vi.fn();
    const { container } = render(<Abacus columns={CDU} value={347} onChange={onChange} />);
    // Fila D (value=4): click en cuenta índice 4 (inactiva) → D pasa a 5 → 357
    const dRow = sliders(container)[1]!;
    fireEvent.click(dRow.querySelectorAll('circle')[4]!);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(357);
  });

  it('showLabels=true: las etiquetas C, D, U son visibles', () => {
    const { container } = render(<Abacus columns={CDU} value={0} onChange={() => {}} showLabels />);
    const text = container.textContent ?? '';
    expect(text).toContain('C');
    expect(text).toContain('D');
    expect(text).toContain('U');
  });

  it('showLabels=false: no se renderizan etiquetas', () => {
    const { container } = render(
      <Abacus columns={CDU} value={0} onChange={() => {}} showLabels={false} />,
    );
    const labels = Array.from(container.querySelectorAll('span')).filter((s) =>
      ['C', 'D', 'U'].includes(s.textContent ?? ''),
    );
    expect(labels).toHaveLength(0);
  });

  it('showNumber=true: el número compuesto es visible', () => {
    const { getByTestId } = render(<Abacus columns={CDU} value={347} onChange={() => {}} />);
    expect(getByTestId('abacus-number')).toHaveTextContent('347');
  });

  it('showNumber=false: el número compuesto no se renderiza', () => {
    const { queryByTestId } = render(
      <Abacus columns={CDU} value={347} onChange={() => {}} showNumber={false} />,
    );
    expect(queryByTestId('abacus-number')).not.toBeInTheDocument();
  });

  it('highlightColumn=1: la segunda fila tiene estilo diferenciado', () => {
    const { container } = render(
      <Abacus columns={CDU} value={0} onChange={() => {}} highlightColumn={1} />,
    );
    expect(container.querySelector('[data-testid="abacus-row-1"]')).toHaveAttribute(
      'data-highlighted',
      'true',
    );
    expect(container.querySelector('[data-testid="abacus-row-0"]')).toHaveAttribute(
      'data-highlighted',
      'false',
    );
  });

  it('readOnly se propaga a todas las BeadRows', () => {
    const onChange = vi.fn();
    const { container } = render(<Abacus columns={CDU} value={347} onChange={onChange} readOnly />);
    const dRow = sliders(container)[1]!;
    fireEvent.click(dRow.querySelectorAll('circle')[4]!);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('integración: value=0 con [C,D,U] muestra 000', () => {
    const { getByTestId, container } = render(
      <Abacus columns={CDU} value={0} onChange={() => {}} />,
    );
    expect(getByTestId('abacus-number')).toHaveTextContent('000');
    expect(sliders(container)[0]!.getAttribute('aria-valuenow')).toBe('0');
  });

  it('integración: value=1000 con 4 columnas muestra 1000', () => {
    const { getByTestId } = render(
      <Abacus
        columns={[...CDU, { label: 'M', color: '#A855F7' }]}
        value={1000}
        onChange={() => {}}
      />,
    );
    expect(getByTestId('abacus-number')).toHaveTextContent('1000');
  });
});
