import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { usePointerDrag } from '../../src/hooks/usePointerDrag';

function TestComponent(props: Parameters<typeof usePointerDrag>[0] = {}) {
  const { isDragging, delta, handlePointerDown } = usePointerDrag(props);
  return (
    <div
      data-testid="drag-target"
      data-dragging={isDragging ? 'true' : 'false'}
      data-dx={delta.x}
      data-dy={delta.y}
      onPointerDown={handlePointerDown}
      style={{ touchAction: 'none' }}
    />
  );
}

function pointerDown(el: HTMLElement, x = 100, y = 100, pointerId = 1) {
  fireEvent.pointerDown(el, { clientX: x, clientY: y, pointerId, bubbles: true });
}

function pointerMove(el: HTMLElement, x: number, y: number, pointerId = 1) {
  // Disparar en el elemento: burbujea hasta window donde escucha el hook.
  // (fireEvent sobre window pierde clientX en jsdom.)
  fireEvent.pointerMove(el, { clientX: x, clientY: y, pointerId, bubbles: true });
}

function pointerUp(el: HTMLElement, x: number, y: number, pointerId = 1) {
  fireEvent.pointerUp(el, { clientX: x, clientY: y, pointerId, bubbles: true });
}

describe('usePointerDrag', () => {
  it('isDragging es false y delta {0,0} inicialmente', () => {
    const { getByTestId } = render(<TestComponent />);
    const el = getByTestId('drag-target');
    expect(el).toHaveAttribute('data-dragging', 'false');
    expect(el).toHaveAttribute('data-dx', '0');
    expect(el).toHaveAttribute('data-dy', '0');
  });

  it('pointerdown + pointermove activa drag y actualiza delta', () => {
    const { getByTestId } = render(<TestComponent />);
    const el = getByTestId('drag-target');
    pointerDown(el, 100, 100);
    expect(el).toHaveAttribute('data-dragging', 'true');
    act(() => {
      pointerMove(el, 130, 150);
    });
    expect(el).toHaveAttribute('data-dx', '30');
    expect(el).toHaveAttribute('data-dy', '50');
  });

  it('pointerup vuelve isDragging a false', () => {
    const { getByTestId } = render(<TestComponent />);
    const el = getByTestId('drag-target');
    pointerDown(el, 100, 100);
    expect(el).toHaveAttribute('data-dragging', 'true');
    act(() => {
      pointerUp(el, 120, 120);
    });
    expect(el).toHaveAttribute('data-dragging', 'false');
  });

  it("con axis='x': delta.y siempre es 0", () => {
    const { getByTestId } = render(<TestComponent axis="x" />);
    const el = getByTestId('drag-target');
    pointerDown(el, 100, 100);
    act(() => {
      pointerMove(el, 130, 180);
    });
    expect(el).toHaveAttribute('data-dx', '30');
    expect(el).toHaveAttribute('data-dy', '0');
  });

  it("con axis='y': delta.x siempre es 0", () => {
    const { getByTestId } = render(<TestComponent axis="y" />);
    const el = getByTestId('drag-target');
    pointerDown(el, 100, 100);
    act(() => {
      pointerMove(el, 180, 130);
    });
    expect(el).toHaveAttribute('data-dx', '0');
    expect(el).toHaveAttribute('data-dy', '30');
  });

  it('con disabled=true: pointerdown no activa isDragging', () => {
    const { getByTestId } = render(<TestComponent disabled />);
    const el = getByTestId('drag-target');
    pointerDown(el, 100, 100);
    expect(el).toHaveAttribute('data-dragging', 'false');
  });

  it('onDragEnd se llama con el delta final al soltar', () => {
    const onDragEnd = vi.fn();
    const { getByTestId } = render(<TestComponent onDragEnd={onDragEnd} />);
    const el = getByTestId('drag-target');
    pointerDown(el, 100, 100);
    act(() => {
      pointerUp(el, 140, 160);
    });
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledWith({ x: 40, y: 60 });
  });

  it('onDragMove se llama durante el drag', () => {
    const onDragMove = vi.fn();
    const { getByTestId } = render(<TestComponent onDragMove={onDragMove} />);
    const el = getByTestId('drag-target');
    pointerDown(el, 100, 100);
    act(() => {
      pointerMove(el, 110, 120);
    });
    expect(onDragMove).toHaveBeenCalledWith({ x: 10, y: 20 });
  });
});
