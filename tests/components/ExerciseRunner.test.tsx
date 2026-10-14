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

  it('identify + recta: rótulos graduados (nunca todos los números)', () => {
    const { container } = render(
      <ExerciseRunner exerciseType="identify" difficulty={2} manipulative="numberline" />,
    );
    const nums = Array.from(container.querySelectorAll('[data-testid="numberline-number"]'));
    expect(nums.map((n) => n.textContent)).toEqual(['0', '5', '10']);
    // Pero las marcas de cada unidad siguen existiendo para contar
    expect(container.querySelectorAll('[data-testid="numberline-tick"]').length).toBeGreaterThan(
      nums.length,
    );
  });

  it('placement: rótulos graduados según el tramo', () => {
    const { container } = render(<ExerciseRunner exerciseType="placement" difficulty={3} />);
    const nums = Array.from(container.querySelectorAll('[data-testid="numberline-number"]'));
    expect(nums.map((n) => n.textContent)).toEqual(['0', '5', '10', '15', '20']);
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

  it('identify + rekenrek: readOnly con valor fijo y entrada por dígitos', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="identify" difficulty={1} manipulative="rekenrek" />,
    );
    const shown = Number(getByTestId('rekenrek-total').textContent!.match(/Total: (\d+)/)![1]);
    // readOnly: click no cambia el valor
    fireEvent.click(container.querySelectorAll('[role="slider"] circle')[0]!);
    expect(getByTestId('rekenrek-total')).toHaveTextContent(`Total: ${shown}`);
    // Un hueco por cifra (1-5 → 1 hueco) + teclado 0-9 del mismo componente que decompose
    expect(container.querySelectorAll('[data-slot-id^="islot-"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-testid="answer-chip"]')).toHaveLength(10);
    expect(container.textContent).toContain('Tu respuesta:');
  });

  function fillIdentify(container: HTMLElement, value: number) {
    String(value)
      .split('')
      .forEach((d, i) => {
        fireEvent.click(container.querySelector(`[data-slot-id="islot-${i}"]`)!);
        const chips = Array.from(container.querySelectorAll('[data-testid="answer-chip"]'));
        fireEvent.click(chips.find((c) => c.textContent === d)!);
      });
  }

  function answerIdentify(container: HTMLElement, value: number) {
    fillIdentify(container, value);
    fireEvent.click(checkBtn(container));
  }

  it('identify + rekenrek: respuesta correcta → feedback correct', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="identify" difficulty={1} manipulative="rekenrek" />,
    );
    const shown = Number(getByTestId('rekenrek-total').textContent!.match(/Total: (\d+)/)![1]);
    answerIdentify(container, shown);
    expect(correctBanner(container)).toBeInTheDocument();
  });

  it('identify + rekenrek: respuesta incorrecta → feedback incorrect', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="identify" difficulty={1} manipulative="rekenrek" />,
    );
    const shown = Number(getByTestId('rekenrek-total').textContent!.match(/Total: (\d+)/)![1]);
    answerIdentify(container, shown + 1);
    expect(incorrectBanner(container)).toBeInTheDocument();
  });

  it('identify: tocar un hueco lleno lo vacía (sin 0 atascado)', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="identify" difficulty={1} manipulative="rekenrek" />,
    );
    const shown = Number(getByTestId('rekenrek-total').textContent!.match(/Total: (\d+)/)![1]);
    const wrong = shown + 1; // rango 1-5: wrong es una cifra distinta
    fillIdentify(container, wrong);
    fireEvent.click(checkBtn(container));
    expect(incorrectBanner(container)).toBeInTheDocument();
    // Tocar el hueco lleno lo vacía
    const slot = container.querySelector('[data-slot-id="islot-0"]')! as HTMLElement;
    fireEvent.click(slot.parentElement!);
    expect(
      (container.querySelector('[data-slot-id="islot-0"]')! as HTMLElement).textContent,
    ).toBe('?');
    // Comprobar vacío → incorrecto, sin 0 atascado en el hueco
    fireEvent.click(checkBtn(container));
    expect(incorrectBanner(container)).toBeInTheDocument();
    expect(
      (container.querySelector('[data-slot-id="islot-0"]')! as HTMLElement).textContent,
    ).toBe('?');
  });

  it('identify free multicifra: un hueco por cifra compone el número', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="identify" difficulty={3} manipulative="rekenrek" />,
    );
    const shown = Number(
      getByTestId('rekenrek-total').textContent!.match(/Total: (\d+)/)![1],
    );
    const digits = String(shown).split('');
    expect(container.querySelectorAll('[data-slot-id^="islot-"]')).toHaveLength(digits.length);
    answerIdentify(container, shown);
    expect(correctBanner(container)).toBeInTheDocument();
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
    expect(container.querySelectorAll('[data-slot-id^="islot-"]')).toHaveLength(expectedRows);
  });

  it('identify + ábaco: número fijo visible y entrada por dígitos', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="identify" difficulty={2} manipulative="abacus" />,
    );
    expect(getByTestId('abacus-number')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot-id^="islot-"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-testid="answer-chip"]')).toHaveLength(10);
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

  it('decompose free: la tira de dígitos siempre está visible (0-9 + borrar)', () => {
    const { getByTestId } = render(
      <ExerciseRunner exerciseType="decompose" difficulty={2} answerMode="free" />,
    );
    const strip = getByTestId('decompose-strip');
    for (let d = 0; d <= 9; d++) {
      expect(strip.querySelector(`[data-testid="strip-${d}"]`)).toBeInTheDocument();
    }
    expect(strip.querySelector('[data-testid="strip-clear"]')).toBeInTheDocument();
  });

  it('decompose free: pulsar dígitos rellena y comprobar valida lo mostrado', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="decompose" difficulty={2} answerMode="free" />,
    );
    const target = Number(
      getByTestId('activity-instruction').textContent!.match(/(\d+)\s*=/)![1],
    );
    const prefilled = Number(
      (container.querySelector('[data-slot-id="dslot-0"]')! as HTMLElement).textContent,
    );
    const remainder = target - prefilled;
    expect(remainder).toBeGreaterThan(0);
    expect(remainder).toBeLessThanOrEqual(9);
    // El hueco 1 ya viene seleccionado; pulsar el dígito lo fija
    fireEvent.click(container.querySelector('[data-testid="strip-0"]')!);
    fireEvent.click(
      container.querySelector(`[data-testid="strip-${remainder}"]`)!,
    );
    expect(
      (container.querySelector('[data-slot-id="dslot-1"]')! as HTMLElement).textContent,
    ).toBe(String(remainder));
    // La tecla usada se marca pero sigue disponible
    expect(
      container.querySelector(`[data-testid="strip-${remainder}"]`)!.getAttribute('data-kind'),
    ).toBe('picked');
    fireEvent.click(checkBtn(container));
    expect(correctBanner(container)).toBeInTheDocument();
  });

  it('decompose free: pulsar otro dígito sustituye, no añade (nunca "35")', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="decompose" difficulty={2} answerMode="free" />,
    );
    const target = Number(
      getByTestId('activity-instruction').textContent!.match(/(\d+)\s*=/)![1],
    );
    const prefilled = Number(
      (container.querySelector('[data-slot-id="dslot-0"]')! as HTMLElement).textContent,
    );
    const remainder = target - prefilled;
    // Elegir hueco 1 y pulsar 3 y luego 5: el hueco muestra 5, no "35"
    fireEvent.click(container.querySelector('[data-slot-id="dslot-1"]')!);
    fireEvent.click(container.querySelector('[data-testid="strip-3"]')!);
    expect(
      (container.querySelector('[data-slot-id="dslot-1"]')! as HTMLElement).textContent,
    ).toBe('3');
    fireEvent.click(container.querySelector('[data-testid="strip-5"]')!);
    expect(
      (container.querySelector('[data-slot-id="dslot-1"]')! as HTMLElement).textContent,
    ).toBe('5');
    // Fijar el resto correcto y comprobar → correct
    fireEvent.click(
      container.querySelector(`[data-testid="strip-${remainder}"]`)!,
    );
    fireEvent.click(checkBtn(container));
    expect(correctBanner(container)).toBeInTheDocument();
  });

  it('decompose free: arrastrar un dígito de la tira al hueco lo coloca', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="decompose" difficulty={2} answerMode="free" />,
    );
    const target = Number(
      getByTestId('activity-instruction').textContent!.match(/(\d+)\s*=/)![1],
    );
    const prefilled = Number(
      (container.querySelector('[data-slot-id="dslot-0"]')! as HTMLElement).textContent,
    );
    const remainder = target - prefilled;
    const chips = Array.from(container.querySelectorAll('[data-testid^="strip-"]'));
    const chip = chips.find(
      (c) => c.textContent === String(remainder) && c.getAttribute('data-testid') !== 'strip-clear',
    )! as HTMLElement;
    dragChipToSlot(
      container,
      chip,
      container.querySelector('[data-slot-id="dslot-1"]')! as HTMLElement,
    );
    expect(
      (container.querySelector('[data-slot-id="dslot-1"]')! as HTMLElement).textContent,
    ).toBe(String(remainder));
    fireEvent.click(checkBtn(container));
    expect(correctBanner(container)).toBeInTheDocument();
  });

  it('decompose free: arrastrar al hueco bloqueado se ignora', () => {
    const { container } = render(
      <ExerciseRunner exerciseType="decompose" difficulty={2} answerMode="free" />,
    );
    const prefilled = (container.querySelector('[data-slot-id="dslot-0"]')! as HTMLElement)
      .textContent;
    const chips = Array.from(container.querySelectorAll('[data-testid^="strip-"]'));
    const chip = chips.find(
      (c) => c.textContent === '0' && c.getAttribute('data-testid') !== 'strip-clear',
    )! as HTMLElement;
    dragChipToSlot(
      container,
      chip,
      container.querySelector('[data-slot-id="dslot-0"]')! as HTMLElement,
    );
    expect(
      (container.querySelector('[data-slot-id="dslot-0"]')! as HTMLElement).textContent,
    ).toBe(prefilled);
  });

  it('decompose free: borrar vacía el hueco elegido', () => {
    const { container } = render(
      <ExerciseRunner exerciseType="decompose" difficulty={2} answerMode="free" />,
    );
    fireEvent.click(container.querySelector('[data-slot-id="dslot-1"]')!);
    fireEvent.click(container.querySelector('[data-testid="strip-4"]')!);
    expect(
      (container.querySelector('[data-slot-id="dslot-1"]')! as HTMLElement).textContent,
    ).toBe('4');
    fireEvent.click(container.querySelector('[data-testid="strip-clear"]')!);
    expect(
      (container.querySelector('[data-slot-id="dslot-1"]')! as HTMLElement).textContent,
    ).toBe('?');
    fireEvent.click(checkBtn(container));
    const banner = container.querySelector('[data-testid="feedback-banner"]')!;
    expect(banner.textContent).toContain('Rellena todos los huecos');
  });

  it('decompose free: partes que no suman → incorrect', () => {
    const { container } = render(
      <ExerciseRunner exerciseType="decompose" difficulty={2} answerMode="free" />,
    );
    // Hueco 1 = 0: suma distinta del target (las partes deben ser > 0)
    fireEvent.click(container.querySelector('[data-slot-id="dslot-1"]')!);
    fireEvent.click(container.querySelector('[data-testid="strip-0"]')!);
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
