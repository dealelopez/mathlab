import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import AnswerSlot from '../../src/components/primitives/AnswerSlot';

describe('AnswerSlot', () => {
  it('renderiza placeholder "?" cuando value es null', () => {
    const { getByTestId } = render(
      <AnswerSlot id="s1" value={null} onChange={() => {}} mode="drag-target" />,
    );
    expect(getByTestId('answer-slot')).toHaveTextContent('?');
  });

  it('muestra el valor cuando no es null', () => {
    const { getByTestId } = render(
      <AnswerSlot id="s1" value={5} onChange={() => {}} mode="drag-target" />,
    );
    expect(getByTestId('answer-slot')).toHaveTextContent('5');
  });

  it("status='correct': indicador visual de correcto", () => {
    const { getByTestId } = render(
      <AnswerSlot id="s1" value={5} onChange={() => {}} mode="drag-target" status="correct" />,
    );
    const slot = getByTestId('answer-slot');
    expect(slot).toHaveAttribute('data-status', 'correct');
    expect(slot.className).toContain('border-green-500');
  });

  it("status='incorrect': indicador visual de incorrecto", () => {
    const { getByTestId } = render(
      <AnswerSlot id="s1" value={5} onChange={() => {}} mode="drag-target" status="incorrect" />,
    );
    const slot = getByTestId('answer-slot');
    expect(slot).toHaveAttribute('data-status', 'incorrect');
    expect(slot.className).toContain('border-orange-500');
  });

  it('modo drag-target: expone data-slot-id', () => {
    const { getByTestId } = render(
      <AnswerSlot id="s1" value={null} onChange={() => {}} mode="drag-target" />,
    );
    expect(getByTestId('answer-slot')).toHaveAttribute('data-slot-id', 's1');
  });

  it("modo input: click abre NumberPad y confirmar llama onChange", () => {
    const onChange = vi.fn();
    const { getByTestId, queryByTestId } = render(
      <AnswerSlot id="s1" value={null} onChange={onChange} mode="input" />,
    );
    expect(queryByTestId('number-pad')).not.toBeInTheDocument();
    fireEvent.click(getByTestId('answer-slot'));
    expect(queryByTestId('number-pad')).toBeInTheDocument();
    fireEvent.click(getByTestId('numpad-4'));
    fireEvent.click(getByTestId('numpad-2'));
    fireEvent.click(getByTestId('numpad-confirm'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(42);
  });
});
