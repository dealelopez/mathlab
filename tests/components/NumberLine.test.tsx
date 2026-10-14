import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import NumberLine from '../../src/components/manipulatives/NumberLine';

describe('NumberLine', () => {
  it('min=0, max=10, step=1: 11 marcas', () => {
    const { container } = render(<NumberLine min={0} max={10} step={1} />);
    expect(container.querySelectorAll('[data-testid="numberline-tick"]')).toHaveLength(11);
  });

  it('min=0, max=20, step=5: 5 marcas (0, 5, 10, 15, 20)', () => {
    const { container } = render(<NumberLine min={0} max={20} step={5} />);
    expect(container.querySelectorAll('[data-testid="numberline-tick"]')).toHaveLength(5);
  });

  it('showNumbers=true: todos los números visibles', () => {
    const { container } = render(<NumberLine min={0} max={10} step={1} showNumbers />);
    const nums = Array.from(container.querySelectorAll('[data-testid="numberline-number"]'));
    expect(nums).toHaveLength(11);
    expect(nums.map((n) => n.textContent).join(',')).toBe('0,1,2,3,4,5,6,7,8,9,10');
  });

  it('showNumbers=false: ningún número visible', () => {
    const { container } = render(<NumberLine min={0} max={10} step={1} showNumbers={false} />);
    expect(container.querySelectorAll('[data-testid="numberline-number"]')).toHaveLength(0);
  });

  it('showNumbers=[0, 5, 10]: solo esos tres visibles', () => {
    const { container } = render(<NumberLine min={0} max={10} step={1} showNumbers={[0, 5, 10]} />);
    const nums = Array.from(container.querySelectorAll('[data-testid="numberline-number"]'));
    expect(nums.map((n) => n.textContent)).toEqual(['0', '5', '10']);
  });

  it('marcas mayores en rotulados y menores en el resto (para contar)', () => {
    const { container } = render(<NumberLine min={0} max={10} step={1} showNumbers={[0, 5, 10]} />);
    const ticks = Array.from(container.querySelectorAll('[data-testid="numberline-tick"]'));
    expect(ticks).toHaveLength(11);
    expect(ticks.filter((t) => t.getAttribute('data-major') === 'true')).toHaveLength(3);
  });

  it('markers=[{position: 7, color: red}]: marcador visible en posición 7', () => {
    const { container } = render(
      <NumberLine min={0} max={10} markers={[{ position: 7, color: 'red', label: '7' }]} />,
    );
    const marker = container.querySelector('[data-testid="numberline-marker"]')!;
    expect(marker).toBeInTheDocument();
    expect(marker).toHaveAttribute('data-position', '7');
    expect(marker.querySelector('polygon')).toHaveAttribute('fill', 'red');
    expect(marker.textContent).toContain('7');
    // El marcador está sobre la 8ª marca (valor 7): mismo x
    const tickX = container
      .querySelectorAll('[data-testid="numberline-tick"]')[7]!
      .getAttribute('x1');
    const polyPoints = marker.querySelector('polygon')!.getAttribute('points')!;
    expect(polyPoints).toContain(tickX!);
  });

  it('jumps=[{from: 3, to: 6, color: blue}]: arco SVG renderizado', () => {
    const { container } = render(
      <NumberLine min={0} max={10} jumps={[{ from: 3, to: 6, color: 'blue' }]} />,
    );
    const jump = container.querySelector('[data-testid="numberline-jump"]')!;
    expect(jump).toBeInTheDocument();
    expect(jump.tagName.toLowerCase()).toBe('path');
    expect(jump.getAttribute('d')).toContain('Q');
    expect(jump).toHaveAttribute('stroke', 'blue');
  });

  it("interactive='place' + click en la recta: onPlaceMarker con valor snapped", () => {
    const onPlaceMarker = vi.fn();
    const { container } = render(
      <NumberLine min={0} max={10} step={1} interactive="place" onPlaceMarker={onPlaceMarker} />,
    );
    // Línea de 40 a 460: x=250 → valor 5
    fireEvent.click(container.querySelector('[data-testid="number-line"]')!, { clientX: 250 });
    expect(onPlaceMarker).toHaveBeenCalledTimes(1);
    expect(onPlaceMarker).toHaveBeenCalledWith(5);
  });

  it('snap: click entre 6 y 7 (más cerca de 7) → onPlaceMarker(7)', () => {
    const onPlaceMarker = vi.fn();
    const { container } = render(
      <NumberLine min={0} max={10} step={1} interactive="place" onPlaceMarker={onPlaceMarker} />,
    );
    // valor 6.6 → x = 40 + 0.66*420 = 317.2
    fireEvent.click(container.querySelector('[data-testid="number-line"]')!, { clientX: 317 });
    expect(onPlaceMarker).toHaveBeenCalledWith(7);
  });

  it("interactive='none': click no dispara callback", () => {
    const onPlaceMarker = vi.fn();
    const { container } = render(
      <NumberLine min={0} max={10} interactive="none" onPlaceMarker={onPlaceMarker} />,
    );
    fireEvent.click(container.querySelector('[data-testid="number-line"]')!, { clientX: 250 });
    expect(onPlaceMarker).not.toHaveBeenCalled();
  });

  it('readOnly: click no dispara callback', () => {
    const onPlaceMarker = vi.fn();
    const { container } = render(
      <NumberLine min={0} max={10} interactive="place" onPlaceMarker={onPlaceMarker} readOnly />,
    );
    fireEvent.click(container.querySelector('[data-testid="number-line"]')!, { clientX: 250 });
    expect(onPlaceMarker).not.toHaveBeenCalled();
  });
});
