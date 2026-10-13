import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import Bead from '../../src/components/primitives/Bead';

function renderBead(props = {}) {
  return render(
    <svg>
      <Bead cx={10} cy={20} r={8} color="#ff0000" {...props} />
    </svg>,
  );
}

describe('Bead', () => {
  it('renderiza un <circle> SVG con cx, cy, r y color correctos', () => {
    const { container } = renderBead({ active: true });
    const circle = container.querySelector('circle');
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute('cx', '10');
    expect(circle).toHaveAttribute('cy', '20');
    expect(circle).toHaveAttribute('r', '8');
    expect(circle).toHaveAttribute('fill', '#ff0000');
  });

  it('activa e inactiva tienen el mismo grosor de borde', () => {
    const { container: c1 } = renderBead({ active: true });
    const { container: c2 } = renderBead({ active: false });
    const w1 = c1.querySelector('circle')!.getAttribute('stroke-width');
    const w2 = c2.querySelector('circle')!.getAttribute('stroke-width');
    expect(w1).toBe(w2);
  });

  it('inactiva muestra el color aclarado en lugar del color pleno', () => {
    const { container } = renderBead({ active: false });
    const circle = container.querySelector('circle')!;
    expect(circle.getAttribute('fill')).not.toBe('#ff0000');
    expect(circle.getAttribute('fill')).toContain('color-mix');
  });

  it('llama onClick al hacer click', () => {
    const onClick = vi.fn();
    const { container } = renderBead({ onClick });
    const circle = container.querySelector('circle')!;
    fireEvent.click(circle);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('no falla al hacer click si no hay onClick', () => {
    const { container } = renderBead();
    const circle = container.querySelector('circle')!;
    expect(() => fireEvent.click(circle)).not.toThrow();
  });

  it('aplica className adicional cuando se pasa', () => {
    const { container } = renderBead({ className: 'mi-cuenta' });
    const circle = container.querySelector('circle')!;
    expect(circle).toHaveClass('mi-cuenta');
  });
});
