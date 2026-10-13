import { describe, it, expect } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import AnswerChip from '../../src/components/primitives/AnswerChip';
import { DragDropProvider } from '../../src/components/primitives/DragDropContext';

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
});
