import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import ExerciseRunner from '../../src/components/activities/ExerciseRunner';

function checkBtn(container: HTMLElement): HTMLButtonElement {
  return Array.from(container.querySelectorAll('button')).find(
    (b) => b.textContent === 'Comprobar',
  )! as HTMLButtonElement;
}

function correctBanner(container: HTMLElement): Element | null {
  return container.querySelector('[data-testid="feedback-banner"][data-type="correct"]');
}

function incorrectBanner(container: HTMLElement): Element | null {
  return container.querySelector('[data-testid="feedback-banner"][data-type="incorrect"]');
}

function chipValues(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('[data-testid="answer-chip"]')) as HTMLElement[];
}

function dragChipToSlot(container: HTMLElement, chip: HTMLElement, slot: HTMLElement) {
  void container;
  fireEvent.pointerDown(chip, { clientX: 100, clientY: 200, pointerId: 1, bubbles: true });
  fireEvent.pointerMove(chip, { clientX: 100, clientY: 100, pointerId: 1, bubbles: true });
  const orig = document.elementFromPoint;
  document.elementFromPoint = (() => slot) as unknown as typeof document.elementFromPoint;
  try {
    fireEvent.pointerUp(chip, { clientX: 100, clientY: 100, pointerId: 1, bubbles: true });
  } finally {
    document.elementFromPoint = orig;
  }
}

/** Rellena un AnswerSlot en modo input mediante su NumberPad inline. */
function fillInputSlot(container: HTMLElement, slotIndex: number, value: number) {
  const slots = Array.from(
    container.querySelectorAll('[data-testid="answer-slot"]'),
  ) as HTMLElement[];
  fireEvent.click(slots[slotIndex]!);
  const pad = container.querySelector('[data-testid="number-pad"]')!;
  for (const ch of String(value)) {
    fireEvent.click(pad.querySelector(`[data-testid="numpad-${ch}"]`)!);
  }
  fireEvent.click(pad.querySelector('[data-testid="numpad-confirm"]')!);
}

describe('ExerciseRunner', () => {
  it('al montar, genera un ejercicio y lo renderiza', () => {
    const { getByTestId } = render(<ExerciseRunner exerciseType="represent" difficulty={2} />);
    expect(getByTestId('activity-instruction').textContent).toBeTruthy();
  });

  it('la instrucción del ejercicio generado es visible', () => {
    const { getByTestId } = render(
      <ExerciseRunner exerciseType="identify" difficulty={1} manipulative="rekenrek" />,
    );
    expect(getByTestId('activity-instruction').textContent).toContain('muestra');
  });

  it('comprobar sin responder muestra feedback incorrecto', () => {
    const { container } = render(
      <ExerciseRunner exerciseType="identify" difficulty={1} manipulative="rekenrek" />,
    );
    const check = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Comprobar',
    )!;
    fireEvent.click(check);
    expect(
      container.querySelector('[data-testid="feedback-banner"][data-type="incorrect"]'),
    ).toBeInTheDocument();
  });

  it('flujo placement: colocar marcador valida automáticamente', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="placement" difficulty={1} />,
    );
    // Sin botón comprobar en placement (validación automática)
    const check = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Comprobar',
    );
    expect(check).toBeUndefined();
    // Colocar marcador en algún punto → aparece feedback
    fireEvent.click(getByTestId('number-line'), { clientX: 250 });
    expect(container.querySelector('[data-testid="feedback-banner"]')).toBeInTheDocument();
  });

  it('tras 2 ejercicios con exerciseCount=2, Siguiente llama onComplete', () => {
    const onComplete = vi.fn();
    const { container } = render(
      <ExerciseRunner
        exerciseType="identify"
        difficulty={1}
        manipulative="rekenrek"
        exerciseCount={2}
        onComplete={onComplete}
      />,
    );
    const nextAfterCheck = () => {
      fireEvent.click(checkBtn(container));
      const next = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.startsWith('Siguiente'),
      )!;
      fireEvent.click(next);
    };
    expect(container.querySelector('[data-testid="activity-progress"]')).toHaveTextContent('1 / 2');
    nextAfterCheck();
    expect(container.querySelector('[data-testid="activity-progress"]')).toHaveTextContent('2 / 2');
    nextAfterCheck();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('represent + rekenrek: instrucción, valor inicial 0 e interactivo', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="represent" difficulty={1} manipulative="rekenrek" />,
    );
    const instruction = getByTestId('activity-instruction').textContent!;
    expect(instruction).toContain('Muestra el número');
    // 2 filas (el rekenrek siempre tiene 2) con valor 0
    const sliders = Array.from(container.querySelectorAll('[role="slider"]'));
    expect(sliders).toHaveLength(2);
    expect(sliders[0]!.getAttribute('aria-valuenow')).toBe('0');
  });

  it('represent + rekenrek: valor correcto → feedback correct', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="represent" difficulty={1} manipulative="rekenrek" />,
    );
    const target = Number(
      getByTestId('activity-instruction').textContent!.match(/Muestra el número (\d+)/)![1],
    );
    const circles = container.querySelectorAll('[role="slider"] circle');
    fireEvent.click(circles[target - 1]!);
    fireEvent.click(checkBtn(container));
    expect(correctBanner(container)).toBeInTheDocument();
  });

  it('represent + rekenrek: valor incorrecto → feedback incorrect', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="represent" difficulty={1} manipulative="rekenrek" />,
    );
    const target = Number(
      getByTestId('activity-instruction').textContent!.match(/Muestra el número (\d+)/)![1],
    );
    const wrong = target === 1 ? 2 : 1;
    const circles = container.querySelectorAll('[role="slider"] circle');
    fireEvent.click(circles[wrong - 1]!);
    fireEvent.click(checkBtn(container));
    expect(incorrectBanner(container)).toBeInTheDocument();
  });

  it('represent + ábaco: columnas según dificultad (2→U, 3→D+U, 5→C+D+U)', () => {
    const { container, rerender } = render(
      <ExerciseRunner exerciseType="represent" difficulty={2} manipulative="abacus" />,
    );
    expect(container.querySelectorAll('[role="slider"]')).toHaveLength(1);
    rerender(<ExerciseRunner exerciseType="represent" difficulty={3} manipulative="abacus" />);
    expect(container.querySelectorAll('[role="slider"]')).toHaveLength(2);
    rerender(<ExerciseRunner exerciseType="represent" difficulty={5} manipulative="abacus" />);
    expect(container.querySelectorAll('[role="slider"]')).toHaveLength(3);
  });

  it('represent + tenframe: marcos según dificultad (1→10 celdas, 3→20 celdas)', () => {
    const { container, rerender } = render(
      <ExerciseRunner exerciseType="represent" difficulty={1} manipulative="tenframe" />,
    );
    expect(container.querySelectorAll('[data-testid="tenframe-cell"]')).toHaveLength(10);
    rerender(<ExerciseRunner exerciseType="represent" difficulty={3} manipulative="tenframe" />);
    expect(container.querySelectorAll('[data-testid="tenframe-cell"]')).toHaveLength(20);
  });

  it('identify + rekenrek: readOnly con valor fijo y DigitAnswer para responder', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="identify" difficulty={1} manipulative="rekenrek" />,
    );
    const shown = Number(getByTestId('rekenrek-total').textContent!.match(/Total: (\d+)/)![1]);
    // readOnly: click no cambia el valor
    fireEvent.click(container.querySelectorAll('[role="slider"] circle')[0]!);
    expect(getByTestId('rekenrek-total')).toHaveTextContent(`Total: ${shown}`);
    // Entrada por dígitos visible
    expect(getByTestId('digit-strip')).toBeInTheDocument();
    expect(getByTestId('digit-back')).toBeInTheDocument();
    expect(container.textContent).toContain('Tu respuesta:');
  });

  function answerIdentify(
    container: HTMLElement,
    getByTestId: (id: string) => HTMLElement,
    value: number,
  ) {
    String(value)
      .split('')
      .forEach((d) => fireEvent.click(getByTestId(`digit-${d}`)));
    fireEvent.click(checkBtn(container));
  }

  it('identify + rekenrek: respuesta correcta → feedback correct', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="identify" difficulty={1} manipulative="rekenrek" />,
    );
    const shown = Number(getByTestId('rekenrek-total').textContent!.match(/Total: (\d+)/)![1]);
    answerIdentify(container, getByTestId, shown);
    expect(correctBanner(container)).toBeInTheDocument();
  });

  it('identify + rekenrek: respuesta incorrecta → feedback incorrect', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="identify" difficulty={1} manipulative="rekenrek" />,
    );
    const shown = Number(getByTestId('rekenrek-total').textContent!.match(/Total: (\d+)/)![1]);
    answerIdentify(container, getByTestId, shown + 1);
    expect(incorrectBanner(container)).toBeInTheDocument();
  });

  it('identify: borrar tras un fallo deja el valor vacío (sin 0 atascado)', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="identify" difficulty={1} manipulative="rekenrek" />,
    );
    const shown = Number(getByTestId('rekenrek-total').textContent!.match(/Total: (\d+)/)![1]);
    const wrong = shown + 1; // rango 1-5: wrong es una cifra distinta
    fireEvent.click(getByTestId(`digit-${wrong}`));
    fireEvent.click(checkBtn(container));
    expect(incorrectBanner(container)).toBeInTheDocument();
    fireEvent.click(getByTestId('digit-back'));
    const rows = Array.from(container.querySelectorAll('[data-testid="digit-row"]'));
    expect(rows).toHaveLength(1);
    rows.forEach((r) => expect(r).toHaveAttribute('data-filled', 'false'));
    expect(rows.some((r) => r.textContent === '0')).toBe(false);
  });

  it('identify con opciones: chips con números completos y flujo drag correcto', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner
        exerciseType="identify"
        difficulty={2}
        manipulative="rekenrek"
        answerMode="drag"
      />,
    );
    const shown = Number(
      getByTestId('rekenrek-total').textContent!.match(/Total: (\d+)/)![1],
    );
    // Hay varios chips con números completos, uno es el correcto
    const chips = Array.from(container.querySelectorAll('[data-testid="answer-chip"]'));
    expect(chips.length).toBeGreaterThan(1);
    const right = chips.find((c) => c.textContent === String(shown))! as HTMLElement;
    // Arrastra el chip correcto al hueco
    const slot = container.querySelector('[data-slot-id="islot-0"]')! as HTMLElement;
    fireEvent.pointerDown(right, { clientX: 100, clientY: 200, pointerId: 1, bubbles: true });
    fireEvent.pointerMove(right, { clientX: 100, clientY: 100, pointerId: 1, bubbles: true });
    const orig = document.elementFromPoint;
    document.elementFromPoint = (() => slot) as unknown as typeof document.elementFromPoint;
    try {
      fireEvent.pointerUp(right, { clientX: 100, clientY: 100, pointerId: 1, bubbles: true });
    } finally {
      document.elementFromPoint = orig;
    }
    expect(slot.textContent).toBe(String(shown));
    fireEvent.click(checkBtn(container));
    expect(correctBanner(container)).toBeInTheDocument();
  });

  it('identify con opciones: chip incorrecto → feedback incorrect', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner
        exerciseType="identify"
        difficulty={2}
        manipulative="rekenrek"
        answerMode="drag"
      />,
    );
    const shown = Number(
      getByTestId('rekenrek-total').textContent!.match(/Total: (\d+)/)![1],
    );
    const chips = Array.from(container.querySelectorAll('[data-testid="answer-chip"]'));
    const wrong = chips.find((c) => c.textContent !== String(shown))! as HTMLElement;
    const slot = container.querySelector('[data-slot-id="islot-0"]')! as HTMLElement;
    fireEvent.pointerDown(wrong, { clientX: 100, clientY: 200, pointerId: 1, bubbles: true });
    fireEvent.pointerMove(wrong, { clientX: 100, clientY: 100, pointerId: 1, bubbles: true });
    const orig = document.elementFromPoint;
    document.elementFromPoint = (() => slot) as unknown as typeof document.elementFromPoint;
    try {
      fireEvent.pointerUp(wrong, { clientX: 100, clientY: 100, pointerId: 1, bubbles: true });
    } finally {
      document.elementFromPoint = orig;
    }
    fireEvent.click(checkBtn(container));
    expect(incorrectBanner(container)).toBeInTheDocument();
  });

  it('identify: tantos huecos como cifras del valor mostrado', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="identify" difficulty={2} manipulative="abacus" />,
    );
    const shown = Number(getByTestId('abacus-number').textContent);
    const expectedRows = String(shown).length;
    expect(container.querySelectorAll('[data-testid="digit-row"]')).toHaveLength(expectedRows);
  });

  it('identify + ábaco: número fijo visible y entrada por dígitos', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="identify" difficulty={2} manipulative="abacus" />,
    );
    expect(getByTestId('abacus-number')).toBeInTheDocument();
    expect(getByTestId('digit-strip')).toBeInTheDocument();
    expect(container.querySelectorAll('[role="slider"]')).toHaveLength(1);
  });

  it('el rekenrek siempre tiene 2 filas en cualquier dificultad', () => {
    const { container, rerender } = render(
      <ExerciseRunner exerciseType="represent" difficulty={2} manipulative="rekenrek" />,
    );
    expect(container.querySelectorAll('[role="slider"]')).toHaveLength(2);
    rerender(<ExerciseRunner exerciseType="represent" difficulty={4} manipulative="rekenrek" />);
    expect(container.querySelectorAll('[role="slider"]')).toHaveLength(2);
  });

  it('decompose drag: instrucción, opciones y flujo correcto con cualquier combinación válida', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="decompose" difficulty={3} answerMode="drag" />,
    );
    const target = Number(
      getByTestId('activity-instruction').textContent!.match(/(\d+)\s*=/)![1],
    );
    expect(target).toBeGreaterThan(0);
    // Opciones: partes correctas + distractores
    let chips = chipValues(container);
    expect(chips.length).toBeGreaterThan(2);
    // Buscar dos chips que sumen el target (cualquier combo vale)
    const vals = chips.map((c) => Number(c.textContent));
    let a = -1;
    let b = -1;
    outer: for (let i = 0; i < vals.length; i++) {
      for (let j = i + 1; j < vals.length; j++) {
        if (vals[i]! + vals[j]! === target) {
          a = i;
          b = j;
          break outer;
        }
      }
    }
    expect(a).toBeGreaterThanOrEqual(0);
    dragChipToSlot(
      container,
      chips[a]!,
      container.querySelector('[data-slot-id="dslot-0"]')! as HTMLElement,
    );
    chips = chipValues(container);
    const second = chips.find(
      (c) => Number(c.textContent) === vals[b] && c.textContent !== null,
    )!;
    dragChipToSlot(
      container,
      second,
      container.querySelector('[data-slot-id="dslot-1"]')! as HTMLElement,
    );
    expect(
      (container.querySelector('[data-slot-id="dslot-0"]')! as HTMLElement).textContent,
    ).toBe(String(vals[a]));
    fireEvent.click(checkBtn(container));
    expect(correctBanner(container)).toBeInTheDocument();
  });

  it('decompose drag: combinación que no suma → feedback incorrect', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="decompose" difficulty={3} answerMode="drag" />,
    );
    const target = Number(
      getByTestId('activity-instruction').textContent!.match(/(\d+)\s*=/)![1],
    );
    const chips = chipValues(container);
    const vals = chips.map((c) => Number(c.textContent));
    let a = -1;
    let b = -1;
    outer: for (let i = 0; i < vals.length; i++) {
      for (let j = i + 1; j < vals.length; j++) {
        if (vals[i]! + vals[j]! !== target) {
          a = i;
          b = j;
          break outer;
        }
      }
    }
    expect(a).toBeGreaterThanOrEqual(0);
    dragChipToSlot(
      container,
      chips[a]!,
      container.querySelector('[data-slot-id="dslot-0"]')! as HTMLElement,
    );
    const rest = chipValues(container).filter((c) => c !== chips[a]);
    const second = rest.find((c) => Number(c.textContent) === vals[b])!;
    dragChipToSlot(
      container,
      second,
      container.querySelector('[data-slot-id="dslot-1"]')! as HTMLElement,
    );
    fireEvent.click(checkBtn(container));
    expect(incorrectBanner(container)).toBeInTheDocument();
  });

  it('decompose drag: tocar un hueco lleno lo vacía', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="decompose" difficulty={3} answerMode="drag" />,
    );
    const target = Number(
      getByTestId('activity-instruction').textContent!.match(/(\d+)\s*=/)![1],
    );
    const chips = chipValues(container);
    const vals = chips.map((c) => Number(c.textContent));
    let a = -1;
    let b = -1;
    outer: for (let i = 0; i < vals.length; i++) {
      for (let j = i + 1; j < vals.length; j++) {
        if (vals[i]! + vals[j]! === target) {
          a = i;
          b = j;
          break outer;
        }
      }
    }
    const slot0 = container.querySelector('[data-slot-id="dslot-0"]')! as HTMLElement;
    dragChipToSlot(container, chips[a]!, slot0);
    expect(
      (container.querySelector('[data-slot-id="dslot-0"]')! as HTMLElement).textContent,
    ).toBe(String(vals[a]));
    // Toca el hueco lleno → se vacía (placeholder "?")
    fireEvent.click(
      (container.querySelector('[data-slot-id="dslot-0"]')! as HTMLElement).parentElement!,
    );
    expect(
      (container.querySelector('[data-slot-id="dslot-0"]')! as HTMLElement).textContent,
    ).toBe('?');
    void b;
  });

  it('decompose free: escribir partes que suman → correct; que no suman → incorrect', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="decompose" difficulty={3} answerMode="free" />,
    );
    const target = Number(
      getByTestId('activity-instruction').textContent!.match(/(\d+)\s*=/)![1],
    );
    expect(container.querySelector('[data-testid="number-pad"]')).toBeNull();
    fillInputSlot(container, 0, 1);
    fillInputSlot(container, 1, target - 1);
    fireEvent.click(checkBtn(container));
    expect(correctBanner(container)).toBeInTheDocument();
  });

  it('decompose free: partes que no suman → incorrect', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="decompose" difficulty={3} answerMode="free" />,
    );
    const target = Number(
      getByTestId('activity-instruction').textContent!.match(/(\d+)\s*=/)![1],
    );
    fillInputSlot(container, 0, target);
    fillInputSlot(container, 1, target);
    fireEvent.click(checkBtn(container));
    expect(incorrectBanner(container)).toBeInTheDocument();
  });

  it('decompose: comprobar con un hueco vacío avisa sin validar', () => {
    const { container } = render(
      <ExerciseRunner exerciseType="decompose" difficulty={3} answerMode="free" />,
    );
    fireEvent.click(checkBtn(container));
    const banner = container.querySelector('[data-testid="feedback-banner"]')!;
    expect(banner.getAttribute('data-type')).toBe('incorrect');
    expect(banner.textContent).toContain('Rellena todos los huecos');
  });

  it('decompose drag: comprobar sin rellenar avisa sin validar', () => {
    const { container } = render(
      <ExerciseRunner exerciseType="decompose" difficulty={3} answerMode="drag" />,
    );
    fireEvent.click(checkBtn(container));
    const banner = container.querySelector('[data-testid="feedback-banner"]')!;
    expect(banner.textContent).toContain('Rellena todos los huecos');
  });

  it('decompose dificultad 5: tres huecos y cualquier triple válido vale', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="decompose" difficulty={5} answerMode="drag" />,
    );
    const target = Number(
      getByTestId('activity-instruction').textContent!.match(/(\d+)\s*=/)![1],
    );
    expect(container.querySelectorAll('[data-slot-id^="dslot-"]')).toHaveLength(3);
    const chips = chipValues(container);
    const vals = chips.map((c) => Number(c.textContent));
    let trio: number[] = [];
    outer: for (let i = 0; i < vals.length; i++) {
      for (let j = i + 1; j < vals.length; j++) {
        for (let k = j + 1; k < vals.length; k++) {
          if (vals[i]! + vals[j]! + vals[k]! === target) {
            trio = [i, j, k];
            break outer;
          }
        }
      }
    }
    expect(trio).toHaveLength(3);
    const used = new Set<HTMLElement>();
    trio.forEach((chipIdx, slotIdx) => {
      const fresh = chipValues(container).filter((c) => !used.has(c));
      const chip = fresh.find((c) => Number(c.textContent) === vals[chipIdx])!;
      used.add(chip);
      dragChipToSlot(
        container,
        chip,
        container.querySelector(`[data-slot-id="dslot-${slotIdx}"]`)! as HTMLElement,
      );
    });
    fireEvent.click(checkBtn(container));
    expect(correctBanner(container)).toBeInTheDocument();
  });

  it('decompose pre-relleno (dificultad 1): primer hueco fijo y readOnly', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="decompose" difficulty={1} answerMode="drag" />,
    );
    const target = Number(
      getByTestId('activity-instruction').textContent!.match(/(\d+)\s*=/)![1],
    );
    const slot0 = container.querySelector('[data-slot-id="dslot-0"]')! as HTMLElement;
    const prefilled = Number(slot0.textContent);
    expect(prefilled).toBeGreaterThan(0);
    expect(slot0.getAttribute('data-readonly')).toBe('true');
    // Tocar el hueco pre-rellenado no lo vacía
    fireEvent.click(slot0.parentElement!);
    expect(
      (container.querySelector('[data-slot-id="dslot-0"]')! as HTMLElement).textContent,
    ).toBe(String(prefilled));
    // Rellenar el hueco restante con target - prefilled → correct
    const remainder = target - prefilled;
    expect(remainder).toBeGreaterThan(0);
    const chip = chipValues(container).find((c) => Number(c.textContent) === remainder)!;
    expect(chip).toBeDefined();
    dragChipToSlot(
      container,
      chip,
      container.querySelector('[data-slot-id="dslot-1"]')! as HTMLElement,
    );
    fireEvent.click(checkBtn(container));
    expect(correctBanner(container)).toBeInTheDocument();
  });
});
