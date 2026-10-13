import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import Rekenrek from '../../src/components/manipulatives/Rekenrek';

function rows(container: HTMLElement): Element[] {
  return Array.from(container.querySelectorAll('[role="slider"]'));
}

function rowValue(el: Element): number {
  return Number(el.getAttribute('aria-valuenow'));
}

describe('Rekenrek', () => {
  it('renderiza 2 filas por defecto (2 BeadRows)', () => {
    const { container } = render(<Rekenrek value={0} onChange={() => {}} />);
    expect(rows(container)).toHaveLength(2);
  });

  it('renderiza N filas cuando rows=N', () => {
    const { container } = render(<Rekenrek value={0} onChange={() => {}} rows={5} />);
    expect(rows(container)).toHaveLength(5);
  });

  it('value como número: distribuye correctamente (15, 2 filas → 10 y 5)', () => {
    const { container } = render(<Rekenrek value={15} onChange={() => {}} rows={2} />);
    const rs = rows(container);
    expect(rowValue(rs[0]!)).toBe(10);
    expect(rowValue(rs[1]!)).toBe(5);
  });

  it('value como número: 7 con 2 filas → 7 y 0', () => {
    const { container } = render(<Rekenrek value={7} onChange={() => {}} rows={2} />);
    const rs = rows(container);
    expect(rowValue(rs[0]!)).toBe(7);
    expect(rowValue(rs[1]!)).toBe(0);
  });

  it('value como array: [4, 6] → fila0=4, fila1=6', () => {
    const { container } = render(<Rekenrek value={[4, 6]} onChange={() => {}} />);
    const rs = rows(container);
    expect(rowValue(rs[0]!)).toBe(4);
    expect(rowValue(rs[1]!)).toBe(6);
  });

  it('total se calcula como suma de todas las filas', () => {
    const { getByTestId } = render(<Rekenrek value={[4, 6]} onChange={() => {}} />);
    expect(getByTestId('rekenrek-total')).toHaveTextContent('Total: 10');
  });

  it('showTotal=true: el total es visible', () => {
    const { getByTestId } = render(<Rekenrek value={7} onChange={() => {}} showTotal />);
    expect(getByTestId('rekenrek-total')).toBeInTheDocument();
  });

  it('showTotal=false: el total no se renderiza', () => {
    const { queryByTestId } = render(<Rekenrek value={7} onChange={() => {}} showTotal={false} />);
    expect(queryByTestId('rekenrek-total')).not.toBeInTheDocument();
  });

  it('onChange emite array y total al interactuar con una fila', () => {
    const onChange = vi.fn();
    const { container } = render(<Rekenrek value={[7, 3]} onChange={onChange} />);
    // Segunda fila (value=3): click en la cuenta índice 5 (inactiva) → fila pasa a 6, total 13
    const secondRow = rows(container)[1]!;
    const bead = secondRow.querySelectorAll('circle')[5]!;
    fireEvent.click(bead);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([7, 6], 13);
  });

  it('readOnly se propaga a todas las BeadRows (click no emite)', () => {
    const onChange = vi.fn();
    const { container } = render(<Rekenrek value={[7, 3]} onChange={onChange} readOnly />);
    const firstRow = rows(container)[0]!;
    fireEvent.click(firstRow.querySelectorAll('circle')[0]!);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('cambio en fila 1 actualiza solo esa fila y recalcula total', () => {
    const onChange = vi.fn();
    const { container } = render(<Rekenrek value={[7, 3]} onChange={onChange} />);
    const firstRow = rows(container)[0]!;
    // Fila 0 (value=7): click en cuenta índice 1 (activa) → fila pasa a 1, total 4
    fireEvent.click(firstRow.querySelectorAll('circle')[1]!);
    expect(onChange).toHaveBeenCalledWith([1, 3], 4);
  });
});
