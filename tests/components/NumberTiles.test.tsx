import { describe, it, expect, vi } from 'vitest';
import { useEffect } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import {
  TileChip,
  TileSlots,
  tileClass,
  firstFreeChip,
} from '../../src/components/primitives/NumberTiles';
import { DragDropProvider, useDragDrop } from '../../src/components/primitives/DragDropContext';

function pointerDown(el: HTMLElement, x = 100, y = 100) {
  fireEvent.pointerDown(el, { clientX: x, clientY: y, pointerId: 1, bubbles: true });
}

function pointerMove(el: HTMLElement, x: number, y: number) {
  fireEvent.pointerMove(el, { clientX: x, clientY: y, pointerId: 1, bubbles: true });
}

function dragChipToSlot(chip: HTMLElement, slot: HTMLElement) {
  pointerDown(chip, 100, 200);
  act(() => {
    pointerMove(chip, 100, 100);
  });
  const orig = document.elementFromPoint;
  document.elementFromPoint = (() => slot) as unknown as typeof document.elementFromPoint;
  try {
    act(() => {
      fireEvent.pointerUp(chip, { clientX: 100, clientY: 100, pointerId: 1, bubbles: true });
    });
  } finally {
    document.elementFromPoint = orig;
  }
}

describe('tileClass', () => {
  it('cada estado tiene su estilo', () => {
    expect(tileClass('empty')).toContain('border-dashed');
    expect(tileClass('option')).toContain('bg-white');
    expect(tileClass('ghost')).toContain('border-transparent');
    expect(tileClass('placed')).toContain('border-blue-300');
    expect(tileClass('fixed')).toContain('bg-slate-100');
  });

  it('sin anillos: ningún estado usa ring', () => {
    for (const k of ['empty', 'option', 'picked', 'ghost', 'placed', 'fixed'] as const) {
      expect(tileClass(k)).not.toContain('ring');
      expect(tileClass(k, true)).not.toContain('ring');
    }
  });
});

describe('firstFreeChip', () => {
  it('devuelve el primer índice libre con ese valor', () => {
    expect(firstFreeChip([3, 5, 3], new Set([0]), 3)).toBe(2);
    expect(firstFreeChip([3, 5], new Set(), 7)).toBe(-1);
  });
});

describe('TileChip', () => {
  it('renderiza el valor como texto', () => {
    const { getByTestId } = render(<TileChip prefix="t" index={0} value={5} />);
    expect(getByTestId('answer-chip')).toHaveTextContent('5');
  });

  it('soporta números de varias cifras (17, 142)', () => {
    const { getByTestId, rerender } = render(<TileChip prefix="t" index={0} value={17} />);
    expect(getByTestId('answer-chip')).toHaveTextContent('17');
    rerender(<TileChip prefix="t" index={0} value={142} />);
    expect(getByTestId('answer-chip')).toHaveTextContent('142');
  });

  it('used=true: fantasma atenuado', () => {
    const { getByTestId } = render(<TileChip prefix="t" index={0} value={5} used />);
    expect(getByTestId('answer-chip')).toHaveAttribute('data-kind', 'ghost');
  });

  it('draggable=false: no inicia drag', () => {
    const { getByTestId } = render(
      <DragDropProvider>
        <TileChip prefix="t" index={0} value={5} draggable={false} />
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
        <TileChip prefix="t" index={0} value={5} />
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
          <TileChip prefix="t" index={0} value={5} />
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
      return <TileChip prefix="t" index={0} value={5} />;
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

  it('testId y highlight personalizables (tira de dígitos)', () => {
    const { getByTestId, rerender } = render(
      <TileChip prefix="strip" index={3} value={3} testId="strip-3" />,
    );
    expect(getByTestId('strip-3')).toHaveAttribute('data-kind', 'option');
    rerender(<TileChip prefix="strip" index={3} value={3} testId="strip-3" highlight />);
    expect(getByTestId('strip-3')).toHaveAttribute('data-kind', 'picked');
  });

  it('tap (sin arrastrar) llama a onPlace; tras drag el click se ignora', () => {
    const onPlace = vi.fn();
    const { getByTestId } = render(
      <DragDropProvider>
        <TileChip prefix="t" index={0} value={5} onPlace={onPlace} />
      </DragDropProvider>,
    );
    const chip = getByTestId('answer-chip');
    // Tap: down + up en el mismo punto + click → onPlace
    pointerDown(chip, 100, 100);
    act(() => {
      fireEvent.pointerUp(chip, { clientX: 100, clientY: 100, pointerId: 1, bubbles: true });
    });
    fireEvent.click(chip, { clientX: 100, clientY: 100 });
    expect(onPlace).toHaveBeenCalledTimes(1);
    expect(onPlace).toHaveBeenCalledWith(0, 5);
    // Drag + click posterior: el click se ignora (era un arrastre)
    pointerDown(chip, 100, 100);
    act(() => {
      pointerMove(chip, 200, 200);
    });
    act(() => {
      fireEvent.pointerUp(chip, { clientX: 200, clientY: 200, pointerId: 1, bubbles: true });
    });
    fireEvent.click(chip, { clientX: 200, clientY: 200 });
    expect(onPlace).toHaveBeenCalledTimes(1);
  });
});

describe('TileSlots', () => {
  it('tap en un chip lo coloca en el hueco seleccionado', () => {
    const onDropSlot = vi.fn();
    const { container } = render(
      <TileSlots prefix="t" slots={[null, null]} options={[3, 5]} onDropSlot={onDropSlot} />,
    );
    const chips = Array.from(container.querySelectorAll('[data-testid="answer-chip"]'));
    const chip3 = chips.find((c) => c.textContent === '3')! as HTMLElement;
    fireEvent.click(chip3);
    expect(onDropSlot).toHaveBeenCalledTimes(1);
    expect(onDropSlot).toHaveBeenCalledWith(0, 3);
    // El chip usado queda en fantasma
    expect(chip3.getAttribute('data-kind')).toBe('ghost');
  });

  it('tap en un hueco cambia la selección y el siguiente tap coloca ahí', () => {
    const onDropSlot = vi.fn();
    const { container } = render(
      <TileSlots prefix="t" slots={[null, null]} options={[3, 5]} onDropSlot={onDropSlot} />,
    );
    const slot0 = container.querySelector('[data-slot-id="t-0"]')! as HTMLElement;
    const slot1 = container.querySelector('[data-slot-id="t-1"]')! as HTMLElement;
    expect(slot0.getAttribute('data-selected')).toBe('true');
    fireEvent.click(slot1);
    expect(slot1.getAttribute('data-selected')).toBe('true');
    expect(slot0.getAttribute('data-selected')).toBeNull();
    const chips = Array.from(container.querySelectorAll('[data-testid="answer-chip"]'));
    fireEvent.click(chips.find((c) => c.textContent === '5')! as HTMLElement);
    expect(onDropSlot).toHaveBeenCalledWith(1, 5);
  });

  it('tap en hueco lleno lo vacía (con onClearSlot)', () => {
    const onClearSlot = vi.fn();
    const { container } = render(
      <TileSlots
        prefix="t"
        slots={[4, null]}
        options={[4, 2]}
        onDropSlot={vi.fn()}
        onClearSlot={onClearSlot}
      />,
    );
    const slot0 = container.querySelector('[data-slot-id="t-0"]')! as HTMLElement;
    fireEvent.click(slot0.parentElement!);
    expect(onClearSlot).toHaveBeenCalledTimes(1);
    expect(onClearSlot).toHaveBeenCalledWith(0);
  });

  it('los huecos bloqueados no aceptan tap ni colocación', () => {
    const onDropSlot = vi.fn();
    const { container } = render(
      <TileSlots
        prefix="t"
        slots={[7, null]}
        options={[3]}
        onDropSlot={onDropSlot}
        lockedIndexes={[0]}
      />,
    );
    const slot0 = container.querySelector('[data-slot-id="t-0"]')! as HTMLElement;
    expect(slot0.getAttribute('data-readonly')).toBe('true');
    // Tocar el bloqueado no lo selecciona (el seleccionado es el 1)
    fireEvent.click(slot0);
    const slot1 = container.querySelector('[data-slot-id="t-1"]')! as HTMLElement;
    expect(slot1.getAttribute('data-selected')).toBe('true');
    // Tocar el chip coloca en el primer libre (1), no en el 0
    const chips = Array.from(container.querySelectorAll('[data-testid="answer-chip"]'));
    fireEvent.click(chips[0]! as HTMLElement);
    expect(onDropSlot).toHaveBeenCalledWith(1, 3);
  });

  it('drag marca el chip como usado sin ayuda del consumidor', () => {
    const onDropSlot = vi.fn();
    const { container } = render(
      <TileSlots prefix="t" slots={[null]} options={[3, 5]} onDropSlot={onDropSlot} />,
    );
    const chips = Array.from(container.querySelectorAll('[data-testid="answer-chip"]'));
    const chip3 = chips.find((c) => c.textContent === '3')! as HTMLElement;
    const slot = container.querySelector('[data-slot-id="t-0"]')! as HTMLElement;
    dragChipToSlot(chip3, slot);
    expect(onDropSlot).toHaveBeenCalledWith(0, 3);
    expect(chip3.getAttribute('data-kind')).toBe('ghost');
  });

  it('renderSlots permite layouts propios (series intercala fijos)', () => {    const { container } = render(
      <TileSlots
        prefix="t"
        slots={[null, null]}
        options={[9]}
        onDropSlot={vi.fn()}
        renderSlots={(nodes) => (
          <div data-testid="custom-row">
            <span>2</span>
            {nodes[0]}
            <span>4</span>
            {nodes[1]}
          </div>
        )}
      />,
    );
    const row = container.querySelector('[data-testid="custom-row"]')!;
    expect(row.textContent).toContain('2');
    expect(row.querySelectorAll('[data-testid="answer-slot"]')).toHaveLength(2);
  });

  it('reusableOptions: el mismo dígito vale en varios huecos sin fantasma', () => {
    const onDropSlot = vi.fn();
    const { container } = render(
      <TileSlots
        prefix="t"
        slots={[null, null]}
        options={[1]}
        reusableOptions
        onDropSlot={onDropSlot}
      />,
    );
    const chip = container.querySelector('[data-testid="answer-chip"]')! as HTMLElement;
    fireEvent.click(chip);
    expect(onDropSlot).toHaveBeenCalledWith(0, 1);
    expect(chip.getAttribute('data-kind')).toBe('option');
    const slot1 = container.querySelector('[data-slot-id="t-1"]')! as HTMLElement;
    fireEvent.click(slot1);
    fireEvent.click(chip);
    expect(onDropSlot).toHaveBeenCalledWith(1, 1);
    expect(chip.getAttribute('data-kind')).toBe('option');
  });
});
