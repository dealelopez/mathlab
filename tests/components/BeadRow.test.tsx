import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import BeadRow from '../../src/components/primitives/BeadRow';

function circles(container: HTMLElement): SVGCircleElement[] {
  return Array.from(container.querySelectorAll('circle'));
}

describe('BeadRow', () => {
  it('renderiza 10 cuentas por defecto', () => {
    const { container } = render(<BeadRow value={0} onChange={() => {}} />);
    expect(circles(container)).toHaveLength(10);
  });

  it('renderiza N cuentas cuando total=N', () => {
    const { container } = render(<BeadRow value={0} onChange={() => {}} total={6} />);
    expect(circles(container)).toHaveLength(6);
  });

  it('las primeras colorSplit cuentas tienen el primer color y el resto el segundo', () => {
    const { container } = render(
      <BeadRow value={0} onChange={() => {}} colorSplit={5} colors={['#EF4444', '#FAFAFA']} />,
    );
    const cs = circles(container);
    cs.slice(0, 5).forEach((c) => expect(c).toHaveAttribute('fill', '#EF4444'));
    cs.slice(5).forEach((c) => expect(c).toHaveAttribute('fill', '#FAFAFA'));
  });

  it('con value=5: 5 cuentas a la izquierda del separador y 5 a la derecha', () => {
    const width = 300;
    const { container } = render(
      <BeadRow value={5} onChange={() => {}} width={width} />,
    );
    const cs = circles(container);
    const mid = width / 2;
    const left = cs.filter((c) => Number(c.getAttribute('cx')) < mid);
    const right = cs.filter((c) => Number(c.getAttribute('cx')) > mid);
    expect(left).toHaveLength(5);
    expect(right).toHaveLength(5);
  });

  it('click en cuenta inactiva (índice 7 con value=3): onChange se llama con 8', () => {
    const onChange = vi.fn();
    const { container } = render(<BeadRow value={3} onChange={onChange} />);
    fireEvent.click(circles(container)[7]!);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(8);
  });

  it('click en cuenta activa (índice 2 con value=5): onChange se llama con 2', () => {
    const onChange = vi.fn();
    const { container } = render(<BeadRow value={5} onChange={onChange} />);
    fireEvent.click(circles(container)[2]!);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('con readOnly=true: click no dispara onChange', () => {
    const onChange = vi.fn();
    const { container } = render(<BeadRow value={3} onChange={onChange} readOnly />);
    fireEvent.click(circles(container)[7]!);
    fireEvent.click(circles(container)[1]!);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("con colors=['#3B82F6'] (un solo color): todas las cuentas son azules", () => {
    const { container } = render(
      <BeadRow value={4} onChange={() => {}} colors={['#3B82F6']} />,
    );
    circles(container).forEach((c) => expect(c).toHaveAttribute('fill', '#3B82F6'));
  });

  it('con colorSplit=10: todas las cuentas usan el primer color', () => {
    const { container } = render(
      <BeadRow value={4} onChange={() => {}} colorSplit={10} colors={['#EF4444', '#FAFAFA']} />,
    );
    circles(container).forEach((c) => expect(c).toHaveAttribute('fill', '#EF4444'));
  });

  it('las cuentas tienen animación de transición suave', () => {
    const { container } = render(<BeadRow value={4} onChange={() => {}} />);
    const c = circles(container)[0]!;
    expect(c.style.transition).toMatch(/150ms/);
  });
});
