import { describe, it, expect, vi } from 'vitest';
import { useEffect } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import AnswerChip from '../../src/components/primitives/AnswerChip';
import { DragDropProvider, useDragDrop } from '../../src/components/primitives/DragDropContext';

function pointerDown(el: HTMLElement, x = 100, y = 100) {
  fireEvent.pointerDown(el, { clientX: x, clientY: y, pointerId: 1, bubbles: true });
}

function pointerMove(el: HTMLElement, x: number, y: number) {
  fireEvent.pointerMove(el, { clientX: x, clientY: y, pointerId: 1, bubbles: true });
}

describe('AnswerChip', () => {
  it('renderiza el valor como texto', () => {
    const { getByTestId } = render(<AnswerChip id="c1" value={5} />);
    expect(getByTestId('answer-chip')).toHaveTextContent('5');
  });

  it('usa label cuando se pasa', () => {
    const { getByTestId } = render(<AnswerChip id="c1" value={5} label="cinco" />);
    expect(getByTestId('answer-chip')).toHaveTextContent('cinco');
  });

  it('used=true: opacidad reducida / estilo atenuado', () => {
    const { getByTestId } = render(<AnswerChip id="c1" value={5} used />);
    expect(getByTestId('answer-chip').className).toContain('opacity-40');
  });

  it('draggable=false: no inicia drag', () => {
    const { getByTestId } = render(
      <DragDropProvider>
        <AnswerChip id="c1" value={5} draggable={false} />
      </DragDropProvider>,
    );
    const chip = getByTestId('answer-chip');
    pointerDown(chip);
    expect(chip).toHaveAttribute('data-dragging', 'false');
    act(() => {
      pointerMove(chip, 150, 150);
    });
    expect(chip).toHaveAttribute('data-dragging', 'false');
    expect(chip.style.transform).toBe('');
  });

  it('se mueve con el puntero durante el drag', () => {
    const { getByTestId } = render(
      <DragDropProvider>
        <AnswerChip id="c1" value={5} />
      </DragDropProvider>,
    );
    const chip = getByTestId('answer-chip');
    pointerDown(chip, 100, 100);
    act(() => {
      pointerMove(chip, 130, 150);
    });
    expect(chip).toHaveAttribute('data-dragging', 'true');
    expect(chip.style.transform).toContain('translate(30px, 50px)');
  });

  it('soltar sobre un slot transfiere el valor vía onDrop', () => {
    const onDrop = vi.fn();
    function Setup() {
      const { setOnDrop } = useDragDrop();
      useEffect(() => {
        setOnDrop(onDrop);
        return () => setOnDrop(null);
      }, [setOnDrop]);
      return (
        <>
          <AnswerChip id="c5" value={5} />
          <div data-slot-id="s1" data-testid="slot" />
        </>
      );
    }
    const { getByTestId } = render(
      <DragDropProvider>
        <Setup />
      </DragDropProvider>,
    );
    const chip = getByTestId('answer-chip');
    const slot = getByTestId('slot');
    pointerDown(chip, 100, 100);
    act(() => {
      pointerMove(chip, 150, 150);
    });
    const orig = document.elementFromPoint;
    document.elementFromPoint = () => slot;
    try {
      act(() => {
        fireEvent.pointerUp(chip, { clientX: 150, clientY: 150, pointerId: 1, bubbles: true });
      });
    } finally {
      document.elementFromPoint = orig;
    }
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledWith('s1', 5);
  });

  it('soltar fuera de un slot no llama a onDrop', () => {
    const onDrop = vi.fn();
    function Setup() {
      const { setOnDrop } = useDragDrop();
      useEffect(() => {
        setOnDrop(onDrop);
        return () => setOnDrop(null);
      }, [setOnDrop]);
      return <AnswerChip id="c5" value={5} />;
    }
    const { getByTestId } = render(
      <DragDropProvider>
        <Setup />
      </DragDropProvider>,
    );
    const chip = getByTestId('answer-chip');
    pointerDown(chip, 100, 100);
    const orig = document.elementFromPoint;
    document.elementFromPoint = () => document.body;
    try {
      act(() => {
        fireEvent.pointerUp(chip, { clientX: 150, clientY: 150, pointerId: 1, bubbles: true });
      });
    } finally {
      document.elementFromPoint = orig;
    }
    expect(onDrop).not.toHaveBeenCalled();
  });
});
