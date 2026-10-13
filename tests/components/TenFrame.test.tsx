import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import TenFrame from '../../src/components/manipulatives/TenFrame';

function cells(container: HTMLElement): Element[] {
  return Array.from(container.querySelectorAll('[data-testid="tenframe-cell"]'));
}

function filledCount(container: HTMLElement): number {
  return Array.from(container.querySelectorAll('circle[data-filled="true"]')).length;
}

describe('TenFrame', () => {
  it('renderiza cuadrícula 2×5 (10 celdas visibles)', () => {
    const { container } = render(<TenFrame value={0} onChange={() => {}} />);
    expect(cells(container)).toHaveLength(10);
  });

  it('frames=2: renderiza dos cuadrículas (20 celdas)', () => {
    const { container } = render(<TenFrame value={0} onChange={() => {}} frames={2} />);
    expect(cells(container)).toHaveLength(20);
  });

  it('value=7: 7 celdas tienen ficha, 3 vacías', () => {
    const { container } = render(<TenFrame value={7} onChange={() => {}} />);
    expect(filledCount(container)).toBe(7);
    expect(container.querySelectorAll('circle[data-filled="false"]')).toHaveLength(3);
  });

  it('value=0: ninguna ficha', () => {
    const { container } = render(<TenFrame value={0} onChange={() => {}} />);
    expect(filledCount(container)).toBe(0);
  });

  it('value=10: marco completo', () => {
    const { container } = render(<TenFrame value={10} onChange={() => {}} />);
    expect(filledCount(container)).toBe(10);
  });

  it('frames=2, value=15: primer marco lleno (10) + 5 en el segundo', () => {
    const { container } = render(<TenFrame value={15} onChange={() => {}} frames={2} />);
    const cs = cells(container);
    expect(filledCount(container)).toBe(15);
    cs.slice(0, 10).forEach((c) => expect(c).toHaveAttribute('data-filled', 'true'));
    cs.slice(10, 15).forEach((c) => expect(c).toHaveAttribute('data-filled', 'true'));
    cs.slice(15).forEach((c) => expect(c).toHaveAttribute('data-filled', 'false'));
  });

  it('click en celda vacía: onChange llamado con value+1', () => {
    const onChange = vi.fn();
    const { container } = render(<TenFrame value={7} onChange={onChange} />);
    const empty = cells(container).find((c) => c.getAttribute('data-filled') === 'false')!;
    fireEvent.click(empty);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(8);
  });

  it('click en celda con ficha: onChange llamado con value-1', () => {
    const onChange = vi.fn();
    const { container } = render(<TenFrame value={7} onChange={onChange} />);
    const full = cells(container).find((c) => c.getAttribute('data-filled') === 'true')!;
    fireEvent.click(full);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it('readOnly: click no dispara onChange', () => {
    const onChange = vi.fn();
    const { container } = render(<TenFrame value={7} onChange={onChange} readOnly />);
    fireEvent.click(cells(container)[0]!);
    fireEvent.click(cells(container)[9]!);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('showValue=true: el número es visible como texto', () => {
    const { getByTestId } = render(<TenFrame value={7} onChange={() => {}} />);
    expect(getByTestId('tenframe-value')).toHaveTextContent('7');
  });

  it('showValue=false: el número no se renderiza', () => {
    const { queryByTestId } = render(
      <TenFrame value={7} onChange={() => {}} showValue={false} />,
    );
    expect(queryByTestId('tenframe-value')).not.toBeInTheDocument();
  });

  it('value no puede superar frames×10 (máximo)', () => {
    const onChange = vi.fn();
    const { container } = render(<TenFrame value={12} onChange={() => {}} frames={1} />);
    // Se muestra recortado al máximo y hay 10 fichas
    expect(filledCount(container)).toBe(10);
    expect(container.querySelector('[role="slider"]')!.getAttribute('aria-valuenow')).toBe('10');
    // Desde 9, añadir llega como mucho a 10
    const { container: c2 } = render(<TenFrame value={9} onChange={onChange} frames={1} />);
    const empty = Array.from(c2.querySelectorAll('[data-testid="tenframe-cell"]')).find(
      (c) => c.getAttribute('data-filled') === 'false',
    )!;
    fireEvent.click(empty);
    expect(onChange).toHaveBeenCalledWith(10);
  });
});
