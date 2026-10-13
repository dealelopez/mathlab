import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import {
  DragDropProvider,
  useDragDrop,
} from '../../src/components/primitives/DragDropContext';

function Probe() {
  const { draggingChip, startDrag, endDrag, dropOnSlot, setOnDrop } = useDragDrop();
  return (
    <div>
      <span data-testid="probe-drag">{draggingChip ? `${draggingChip.sourceId}:${draggingChip.value}` : 'none'}</span>
      <button data-testid="probe-start" onClick={() => startDrag(8, 'chip-8')} />
      <button data-testid="probe-drop" onClick={() => dropOnSlot('slot-1')} />
      <button data-testid="probe-end" onClick={endDrag} />
      <button data-testid="probe-register" onClick={() => setOnDrop(() => {})} />
    </div>
  );
}

describe('DragDropContext', () => {
  it('startDrag registra el chip y endDrag lo limpia', () => {
    const { getByTestId } = render(
      <DragDropProvider>
        <Probe />
      </DragDropProvider>,
    );
    expect(getByTestId('probe-drag')).toHaveTextContent('none');
    act(() => {
      fireEvent.click(getByTestId('probe-start'));
    });
    expect(getByTestId('probe-drag')).toHaveTextContent('chip-8:8');
    act(() => {
      fireEvent.click(getByTestId('probe-end'));
    });
    expect(getByTestId('probe-drag')).toHaveTextContent('none');
  });

  it('dropOnSlot llama al onDrop registrado con slotId y valor', () => {
    const onDrop = vi.fn();
    function ProbeWithDrop() {
      const { startDrag, dropOnSlot, setOnDrop } = useDragDrop();
      return (
        <div>
          <button data-testid="reg" onClick={() => setOnDrop(onDrop)} />
          <button data-testid="start" onClick={() => startDrag(5, 'chip-5')} />
          <button data-testid="drop" onClick={() => dropOnSlot('slot-2')} />
        </div>
      );
    }
    const { getByTestId } = render(
      <DragDropProvider>
        <ProbeWithDrop />
      </DragDropProvider>,
    );
    act(() => {
      fireEvent.click(getByTestId('reg'));
      fireEvent.click(getByTestId('start'));
      fireEvent.click(getByTestId('drop'));
    });
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledWith('slot-2', 5);
  });

  it('dropOnSlot sin drag activo no llama a onDrop', () => {
    const onDrop = vi.fn();
    function ProbeNoDrag() {
      const { dropOnSlot, setOnDrop } = useDragDrop();
      return (
        <div>
          <button data-testid="reg" onClick={() => setOnDrop(onDrop)} />
          <button data-testid="drop" onClick={() => dropOnSlot('slot-2')} />
        </div>
      );
    }
    const { getByTestId } = render(
      <DragDropProvider>
        <ProbeNoDrag />
      </DragDropProvider>,
    );
    act(() => {
      fireEvent.click(getByTestId('reg'));
      fireEvent.click(getByTestId('drop'));
    });
    expect(onDrop).not.toHaveBeenCalled();
  });
});
