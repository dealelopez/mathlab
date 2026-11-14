import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import ExerciseRunner from '../../src/components/activities/ExerciseRunner';
import { ExerciseEngine } from '../../src/engine/engine';
import type { Exercise } from '../../src/engine/types';

/**
 * Renderiza y captura el ejercicio generado. En identify la respuesta NO se muestra en
 * pantalla, así que los tests la leen del ejercicio y no del DOM.
 */
function renderCapturing(ui: React.ReactElement) {
  const generate = vi.spyOn(ExerciseEngine.prototype, 'generate');
  try {
    const utils = render(ui);
    const exercise = generate.mock.results[generate.mock.results.length - 1]!.value as Exercise;
    return { ...utils, exercise, shown: exercise.correctAnswer as number };
  } finally {
    generate.mockRestore();
  }
}

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

  // Recta 0-10 (dificultad 2, tolerancia 0): 500 de ancho, PAD 40 → 42 px por unidad.
  function clickLineAt(container: HTMLElement, value: number) {
    fireEvent.click(container.querySelector('[data-testid="number-line"]')!, {
      clientX: 40 + value * 42,
    });
  }

  function placementTarget(container: HTMLElement): number {
    return Number(
      container.querySelector('[data-testid="activity-instruction"]')!.textContent!.match(/(\d+)/)![1],
    );
  }

  function markerPosition(container: HTMLElement): string | null {
    return (
      container.querySelector('[data-testid="numberline-marker"]')?.getAttribute('data-position') ??
      null
    );
  }

  it('BUG-02 placement: tras acertar, tocar otra posición no cambia marcador ni feedback', () => {
    const { container } = render(<ExerciseRunner exerciseType="placement" difficulty={2} />);
    const target = placementTarget(container);
    const other = target === 0 ? 1 : 0;
    clickLineAt(container, target);
    expect(correctBanner(container)).toBeInTheDocument();
    expect(markerPosition(container)).toBe(String(target));

    clickLineAt(container, other);
    expect(correctBanner(container)).toBeInTheDocument();
    expect(incorrectBanner(container)).not.toBeInTheDocument();
    expect(markerPosition(container)).toBe(String(target));
  });

  it('BUG-02 placement: tras fallar, se puede reintentar y acertar', () => {
    const { container } = render(<ExerciseRunner exerciseType="placement" difficulty={2} />);
    const target = placementTarget(container);
    const wrong = target === 0 ? 1 : 0;
    clickLineAt(container, wrong);
    expect(incorrectBanner(container)).toBeInTheDocument();

    clickLineAt(container, target);
    expect(correctBanner(container)).toBeInTheDocument();
    expect(markerPosition(container)).toBe(String(target));
  });

  it('BUG-03 al montar se genera exactamente un ejercicio', () => {
    const generate = vi.spyOn(ExerciseEngine.prototype, 'generate');
    try {
      render(<ExerciseRunner exerciseType="represent" difficulty={2} manipulative="rekenrek" />);
      expect(generate).toHaveBeenCalledTimes(1);
    } finally {
      generate.mockRestore();
    }
  });

  it('BUG-03 un rerender con la misma config no regenera; un cambio de config sí', () => {
    const generate = vi.spyOn(ExerciseEngine.prototype, 'generate');
    try {
      const { rerender, getByTestId } = render(
        <ExerciseRunner exerciseType="represent" difficulty={2} manipulative="rekenrek" />,
      );
      const first = getByTestId('activity-instruction').textContent;
      rerender(<ExerciseRunner exerciseType="represent" difficulty={2} manipulative="rekenrek" />);
      expect(generate).toHaveBeenCalledTimes(1);
      expect(getByTestId('activity-instruction').textContent).toBe(first);

      rerender(<ExerciseRunner exerciseType="represent" difficulty={3} manipulative="rekenrek" />);
      expect(generate).toHaveBeenCalledTimes(2);
      expect(getByTestId('activity-progress')).toHaveTextContent('1 / 10');
    } finally {
      generate.mockRestore();
    }
  });

  it('BUG-03 cambiar de config reinicia la sesión (progreso y feedback)', () => {
    const { container, rerender, getByTestId } = render(
      <ExerciseRunner exerciseType="identify" difficulty={1} manipulative="rekenrek" />,
    );
    fireEvent.click(checkBtn(container));
    fireEvent.click(
      Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.startsWith('Siguiente'),
      )!,
    );
    expect(getByTestId('activity-progress')).toHaveTextContent('2 / 10');
    rerender(<ExerciseRunner exerciseType="identify" difficulty={2} manipulative="rekenrek" />);
    expect(getByTestId('activity-progress')).toHaveTextContent('1 / 10');
    expect(container.querySelector('[data-testid="feedback-banner"]')).not.toBeInTheDocument();
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
    const { container, shown } = renderCapturing(
      <ExerciseRunner exerciseType="identify" difficulty={1} manipulative="rekenrek" />,
    );
    const sliderTotal = () =>
      Array.from(container.querySelectorAll('[role="slider"]')).reduce(
        (acc, el) => acc + Number(el.getAttribute('aria-valuenow')),
        0,
      );
    expect(sliderTotal()).toBe(shown);
    // readOnly: click no cambia el valor
    fireEvent.click(container.querySelectorAll('[role="slider"] circle')[0]!);
    expect(sliderTotal()).toBe(shown);
    // Un hueco por cifra (1-5 → 1 hueco) + teclado 0-9 del mismo componente que decompose
    expect(container.querySelectorAll('[data-slot-id^="islot-"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-testid="answer-chip"]')).toHaveLength(10);
    expect(container.textContent).toContain('Tu respuesta:');
  });

  it('identify NO muestra la respuesta escrita (ni total, ni número, ni valor)', () => {
    for (const manipulative of ['rekenrek', 'abacus', 'tenframe'] as const) {
      const { queryByTestId, unmount } = render(
        <ExerciseRunner exerciseType="identify" difficulty={2} manipulative={manipulative} />,
      );
      expect(queryByTestId('rekenrek-total')).not.toBeInTheDocument();
      expect(queryByTestId('abacus-number')).not.toBeInTheDocument();
      expect(queryByTestId('tenframe-value')).not.toBeInTheDocument();
      unmount();
    }
  });

  it('identify + recta: el marcador no lleva el número escrito', () => {
    const { container } = render(
      <ExerciseRunner exerciseType="identify" difficulty={2} manipulative="numberline" />,
    );
    const marker = container.querySelector('[data-testid="numberline-marker"]')!;
    expect(marker.querySelector('text')).toBeNull();
  });

  it('represent sigue mostrando el valor que va construyendo el niño', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="represent" difficulty={1} manipulative="rekenrek" />,
    );
    fireEvent.click(container.querySelectorAll('[role="slider"] circle')[1]!);
    expect(getByTestId('rekenrek-total')).toHaveTextContent('Total: 2');
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
    const { container, shown } = renderCapturing(
      <ExerciseRunner exerciseType="identify" difficulty={1} manipulative="rekenrek" />,
    );
    
    answerIdentify(container, shown);
    expect(correctBanner(container)).toBeInTheDocument();
  });

  it('identify + rekenrek: respuesta incorrecta → feedback incorrect', () => {
    const { container, shown } = renderCapturing(
      <ExerciseRunner exerciseType="identify" difficulty={1} manipulative="rekenrek" />,
    );
    
    answerIdentify(container, shown + 1);
    expect(incorrectBanner(container)).toBeInTheDocument();
  });

  it('BUG-01 identify libre: comprobar sin responder avisa y no llama al validador', () => {
    const validate = vi.spyOn(ExerciseEngine.prototype, 'validate');
    try {
      const { container } = render(
        <ExerciseRunner exerciseType="identify" difficulty={1} manipulative="rekenrek" />,
      );
      fireEvent.click(checkBtn(container));
      expect(validate).not.toHaveBeenCalled();
      const banner = container.querySelector('[data-testid="feedback-banner"]')!;
      expect(banner.textContent).toContain('Escribe tu respuesta');
    } finally {
      validate.mockRestore();
    }
  });

  it('BUG-01 identify con opciones: comprobar sin responder avisa y no valida', () => {
    const validate = vi.spyOn(ExerciseEngine.prototype, 'validate');
    try {
      const { container } = render(
        <ExerciseRunner
          exerciseType="identify"
          difficulty={2}
          manipulative="rekenrek"
          answerMode="drag"
        />,
      );
      fireEvent.click(checkBtn(container));
      expect(validate).not.toHaveBeenCalled();
      expect(container.querySelector('[data-testid="feedback-banner"]')!.textContent).toContain(
        'Escribe tu respuesta',
      );
    } finally {
      validate.mockRestore();
    }
  });

  it('BUG-01 identify: tras avisar, una respuesta válida se valida con normalidad', () => {
    const { container, shown } = renderCapturing(
      <ExerciseRunner exerciseType="identify" difficulty={1} manipulative="rekenrek" />,
    );
    
    fireEvent.click(checkBtn(container));
    fillIdentify(container, shown);
    fireEvent.click(checkBtn(container));
    expect(correctBanner(container)).toBeInTheDocument();
  });

  it('identify: tocar un hueco lleno lo vacía (sin 0 atascado)', () => {
    const { container, shown } = renderCapturing(
      <ExerciseRunner exerciseType="identify" difficulty={1} manipulative="rekenrek" />,
    );
    
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
    const { container, shown } = renderCapturing(
      <ExerciseRunner exerciseType="identify" difficulty={3} manipulative="rekenrek" />,
    );
    
    const digits = String(shown).split('');
    expect(container.querySelectorAll('[data-slot-id^="islot-"]')).toHaveLength(digits.length);
    answerIdentify(container, shown);
    expect(correctBanner(container)).toBeInTheDocument();
  });

  it('identify con opciones: chips con números completos y flujo drag correcto', () => {
    const { container, shown } = renderCapturing(
      <ExerciseRunner
        exerciseType="identify"
        difficulty={2}
        manipulative="rekenrek"
        answerMode="drag"
      />,
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
    const { container, shown } = renderCapturing(
      <ExerciseRunner
        exerciseType="identify"
        difficulty={2}
        manipulative="rekenrek"
        answerMode="drag"
      />,
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
    const { container, shown } = renderCapturing(
      <ExerciseRunner exerciseType="identify" difficulty={2} manipulative="abacus" />,
    );
    expect(container.querySelectorAll('[data-slot-id^="islot-"]')).toHaveLength(
      String(shown).length,
    );
  });

  it('BUG-04 identify + ábaco (nivel 2): las cuentas muestran siempre el valor del ejercicio', () => {
    // Nivel 2: una columna [U] y rango 1-10. Con el valor 10 el ábaco se veía vacío.
    // Se repite sobre varias generaciones para no depender del azar.
    for (let i = 0; i < 40; i++) {
      const { container, shown, unmount } = renderCapturing(
        <ExerciseRunner exerciseType="identify" difficulty={2} manipulative="abacus" />,
      );
      expect(container.querySelector('[role="slider"]')!.getAttribute('aria-valuenow')).toBe(
        String(shown),
      );
      unmount();
    }
  });

  it('BUG-04 represent + ábaco (nivel 2): llenar las 10 cuentas representa el 10', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="represent" difficulty={2} manipulative="abacus" />,
    );
    const circles = container.querySelectorAll('[role="slider"] circle');
    fireEvent.click(circles[9]!);
    expect(getByTestId('abacus-number')).toHaveTextContent('10');
    expect(container.querySelector('[role="slider"]')!.getAttribute('aria-valuenow')).toBe('10');
  });

  it('identify + ábaco: valor solo en las cuentas y entrada por dígitos', () => {
    const { container, queryByTestId } = render(
      <ExerciseRunner exerciseType="identify" difficulty={2} manipulative="abacus" />,
    );
    expect(queryByTestId('abacus-number')).not.toBeInTheDocument();
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
    const first = chips[a]!;
    dragChipToSlot(
      container,
      first,
      container.querySelector('[data-slot-id="dslot-0"]')! as HTMLElement,
    );
    chips = chipValues(container);
    // Excluir el chip ya colocado: con partes iguales (3 + 3) hay dos chips con el mismo
    // valor y `find` devolvía el primero, que ya estaba usado (fallaba ~2 % de las veces).
    const second = chips.find((c) => c !== first && Number(c.textContent) === vals[b])!;
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
  describe('series', () => {
    /** Renderiza una sesión de series y devuelve también el ejercicio generado. */
    function renderSeries(difficulty: 1 | 2 | 3 | 4 | 5, answerMode: 'drag' | 'free') {
      const generate = vi.spyOn(ExerciseEngine.prototype, 'generate');
      const utils = render(
        <ExerciseRunner exerciseType="series" difficulty={difficulty} answerMode={answerMode} />,
      );
      const exercise = generate.mock.results[generate.mock.results.length - 1]!.value as Exercise;
      generate.mockRestore();
      return { ...utils, exercise, expected: exercise.correctAnswer as number[] };
    }

    function dragValueToSlot(container: HTMLElement, value: number, slotIndex: number) {
      const chip = chipValues(container).find((c) => Number(c.textContent) === value)!;
      dragChipToSlot(
        container,
        chip,
        container.querySelector(`[data-slot-id="sslot-${slotIndex}"]`)! as HTMLElement,
      );
    }

    function typeIntoSlot(container: HTMLElement, slotIndex: number, value: number) {
      fireEvent.click(container.querySelectorAll('[data-testid="answer-slot"]')[slotIndex]!);
      String(value)
        .split('')
        .forEach((d) => fireEvent.click(container.querySelector(`[data-testid="numpad-${d}"]`)!));
      fireEvent.click(container.querySelector('[data-testid="numpad-confirm"]')!);
    }

    it('drag: muestra los valores visibles como texto, los huecos y las opciones', () => {
      const { container, exercise, expected, getByTestId } = renderSeries(3, 'drag');
      expect(getByTestId('activity-instruction')).toHaveTextContent('Completa la serie');
      const visible = (exercise.setup.visibleValues ?? []).filter((v) => v !== null);
      expect(visible.length).toBeGreaterThanOrEqual(3);
      for (const v of visible) expect(container.textContent).toContain(String(v));
      expect(container.querySelectorAll('[data-slot-id^="sslot-"]')).toHaveLength(expected.length);
      expect(chipValues(container).length).toBeGreaterThan(expected.length);
    });

    it('drag: valores correctos en orden → feedback correct', () => {
      const { container, expected } = renderSeries(3, 'drag');
      expected.forEach((v, i) => dragValueToSlot(container, v, i));
      fireEvent.click(checkBtn(container));
      expect(correctBanner(container)).toBeInTheDocument();
    });

    it('drag: un valor que no es de la serie → feedback incorrect', () => {
      const { container, expected, exercise } = renderSeries(3, 'drag');
      const wrong = (exercise.setup.options ?? []).find((o) => !expected.includes(o))!;
      expected.forEach((v, i) => dragValueToSlot(container, i === 0 ? wrong : v, i));
      fireEvent.click(checkBtn(container));
      expect(incorrectBanner(container)).toBeInTheDocument();
    });

    it('drag: el orden importa (valores correctos intercambiados → incorrect)', () => {
      const { container, expected } = renderSeries(5, 'drag');
      expect(expected.length).toBeGreaterThanOrEqual(2);
      const swapped = [expected[1]!, expected[0]!, ...expected.slice(2)];
      swapped.forEach((v, i) => dragValueToSlot(container, v, i));
      fireEvent.click(checkBtn(container));
      expect(incorrectBanner(container)).toBeInTheDocument();
    });

    it('comprobar con algún hueco vacío avisa sin validar', () => {
      const { container } = renderSeries(3, 'drag');
      const validate = vi.spyOn(ExerciseEngine.prototype, 'validate');
      try {
        fireEvent.click(checkBtn(container));
        expect(validate).not.toHaveBeenCalled();
        expect(container.querySelector('[data-testid="feedback-banner"]')!.textContent).toContain(
          'Rellena todos los huecos',
        );
      } finally {
        validate.mockRestore();
      }
    });

    it('free: escribir los valores con el teclado numérico → correct', () => {
      const { container, expected } = renderSeries(3, 'free');
      expect(container.querySelectorAll('[data-testid="answer-slot"]')).toHaveLength(expected.length);
      expected.forEach((v, i) => typeIntoSlot(container, i, v));
      fireEvent.click(checkBtn(container));
      expect(correctBanner(container)).toBeInTheDocument();
    });

    it('free: un valor incorrecto → incorrect', () => {
      const { container, expected } = renderSeries(3, 'free');
      expected.forEach((v, i) => typeIntoSlot(container, i, i === 0 ? v + 1 : v));
      fireEvent.click(checkBtn(container));
      expect(incorrectBanner(container)).toBeInTheDocument();
    });

    it('tras acertar y pulsar Siguiente, aparece una serie nueva sin respuestas', () => {
      const { container, expected, getByTestId } = renderSeries(3, 'drag');
      expected.forEach((v, i) => dragValueToSlot(container, v, i));
      fireEvent.click(checkBtn(container));
      fireEvent.click(
        Array.from(container.querySelectorAll('button')).find((b) =>
          b.textContent?.startsWith('Siguiente'),
        )!,
      );
      expect(getByTestId('activity-progress')).toHaveTextContent('2 / 10');
      expect(container.querySelector('[data-testid="feedback-banner"]')).not.toBeInTheDocument();
      const slots = Array.from(container.querySelectorAll('[data-slot-id^="sslot-"]'));
      expect(slots.every((sl) => sl.textContent === '?')).toBe(true);
    });
  });

  describe('sumas y restas', () => {
    /** Renderiza una sesión del tipo dado y captura el ejercicio generado. */
    function renderOp(type: 'add' | 'subtract', difficulty: 1 | 2 | 3 | 4 | 5) {
      const utils = renderCapturing(
        <ExerciseRunner exerciseType={type} difficulty={difficulty} />,
      );
      return { ...utils, type };
    }

    /** Reintenta el render hasta que el ejercicio cumpla la condición (hay azar). */
    function renderUntil(
      type: 'add' | 'subtract',
      difficulty: 1 | 2 | 3 | 4 | 5,
      cond: (exercise: Exercise) => boolean,
    ) {
      for (let i = 0; i < 60; i++) {
        const utils = renderCapturing(
          <ExerciseRunner exerciseType={type} difficulty={difficulty} />,
        );
        if (cond(utils.exercise)) return { ...utils, type };
        utils.unmount();
      }
      throw new Error('no se encontró un ejercicio que cumpla la condición');
    }

    function jumpButtons(container: HTMLElement) {
      return Array.from(
        container.querySelectorAll<HTMLButtonElement>('button[data-testid^="jump-btn-"]'),
      ).map((el) => ({ el, n: Number(el.getAttribute('data-testid')!.slice('jump-btn-'.length)) }));
    }

    /** Llega de start a result pulsando siempre el mayor salto disponible que quepa. */
    function solveByGreedy(container: HTMLElement, start: number, result: number) {
      const sense = result >= start ? 1 : -1;
      let current = start;
      for (let guard = 0; guard < 200 && current !== result; guard++) {
        const remaining = Math.abs(result - current);
        const options = jumpButtons(container)
          .filter(({ el, n }) => !el.disabled && n <= remaining)
          .sort((x, y) => y.n - x.n);
        expect(options.length).toBeGreaterThan(0);
        fireEvent.click(options[0]!.el);
        current += sense * options[0]!.n;
      }
      expect(current).toBe(result);
    }

    /** El marcador en data-position dado (el rojo es el del último salto). */
    function markerAt(container: HTMLElement, position: number): Element | undefined {
      return Array.from(container.querySelectorAll('[data-testid="numberline-marker"]')).find(
        (m) => m.getAttribute('data-position') === String(position),
      );
    }

    it('suma nivel 1: instrucción con operandos y botones 1-5 (sin 10 ni 20)', () => {
      const { container, exercise, getByTestId } = renderOp('add', 1);
      const [a, b] = exercise.setup.operands!;
      expect(getByTestId('activity-instruction').textContent).toContain(`${a} + ${b}`);
      for (const n of [1, 2, 3, 4, 5]) {
        expect(container.querySelector(`[data-testid="jump-btn-${n}"]`)).toBeInTheDocument();
      }
      expect(container.querySelector('[data-testid="jump-btn-10"]')).not.toBeInTheDocument();
      expect(container.querySelector('[data-testid="jump-btn-20"]')).not.toBeInTheDocument();
    });

    it('suma nivel 2: hay botón +10', () => {
      const { container } = renderOp('add', 2);
      expect(container.querySelector('[data-testid="jump-btn-10"]')).toBeInTheDocument();
    });

    it('suma: camino de un solo salto del tamaño exacto → correcto', () => {
      const { container, exercise } = renderUntil('add', 2, (ex) => {
        const b = ex.setup.operands![1]!;
        return b <= 5 || b === 10;
      });
      const b = exercise.setup.operands![1]!;
      fireEvent.click(container.querySelector(`[data-testid="jump-btn-${b}"]`)!);
      fireEvent.click(checkBtn(container));
      expect(correctBanner(container)).toBeInTheDocument();
    });

    it('suma: camino de varios saltos → correcto', () => {
      const { container, exercise } = renderUntil('add', 2, (ex) => ex.setup.operands![1]! >= 3);
      const [a, b] = exercise.setup.operands!;
      fireEvent.click(container.querySelector('[data-testid="jump-btn-1"]')!);
      solveByGreedy(container, a + 1, a + b);
      fireEvent.click(checkBtn(container));
      expect(correctBanner(container)).toBeInTheDocument();
    });

    it('suma: muchos saltos de +1 → correcto', () => {
      const { container, exercise } = renderOp('add', 1);
      const [a, b] = exercise.setup.operands!;
      for (let i = 0; i < b; i++) {
        fireEvent.click(container.querySelector('[data-testid="jump-btn-1"]')!);
      }
      fireEvent.click(checkBtn(container));
      expect(correctBanner(container)).toBeInTheDocument();
      void a;
    });

    it('suma: quedarse corto → incorrecto con "Todavía no has llegado"', () => {
      const { container } = renderUntil('add', 2, (ex) => ex.setup.operands![1]! >= 2);
      fireEvent.click(container.querySelector('[data-testid="jump-btn-1"]')!);
      fireEvent.click(checkBtn(container));
      const banner = container.querySelector('[data-testid="feedback-banner"]')!;
      expect(banner.getAttribute('data-type')).toBe('incorrect');
      expect(banner.textContent).toContain('Todavía no has llegado');
    });

    it('suma: pasarse → incorrecto con "Te has pasado"', () => {
      const { container, exercise } = renderUntil(
        'add',
        2,
        (ex) => (ex.correctAnswer as number) < 20,
      );
      const [a, b] = exercise.setup.operands!;
      solveByGreedy(container, a, a + b);
      fireEvent.click(container.querySelector('[data-testid="jump-btn-1"]')!);
      fireEvent.click(checkBtn(container));
      const banner = container.querySelector('[data-testid="feedback-banner"]')!;
      expect(banner.textContent).toContain('Te has pasado');
    });

    it('deshacer quita un arco; empezar de nuevo los quita todos', () => {
      const { container } = renderUntil('add', 2, (ex) => ex.setup.operands![1]! >= 3);
      fireEvent.click(container.querySelector('[data-testid="jump-btn-1"]')!);
      fireEvent.click(container.querySelector('[data-testid="jump-btn-1"]')!);
      expect(container.querySelectorAll('[data-testid="numberline-jump"]')).toHaveLength(2);
      fireEvent.click(container.querySelector('[data-testid="jump-undo"]')!);
      expect(container.querySelectorAll('[data-testid="numberline-jump"]')).toHaveLength(1);
      fireEvent.click(container.querySelector('[data-testid="jump-clear"]')!);
      expect(container.querySelectorAll('[data-testid="numberline-jump"]')).toHaveLength(0);
    });

    it('cada arco lleva su etiqueta +N', () => {
      const { container } = renderUntil('add', 1, (ex) => ex.setup.operands![1]! >= 3);
      fireEvent.click(container.querySelector('[data-testid="jump-btn-1"]')!);
      fireEvent.click(container.querySelector('[data-testid="jump-btn-2"]')!);
      const labels = Array.from(
        container.querySelectorAll('[data-testid="numberline-jump-label"]'),
      );
      expect(labels.map((l) => l.textContent)).toEqual(['+1', '+2']);
    });

    it('comprobar sin saltos avisa y no llama al validador', () => {
      const validate = vi.spyOn(ExerciseEngine.prototype, 'validate');
      try {
        const { container } = render(<ExerciseRunner exerciseType="add" difficulty={1} />);
        fireEvent.click(checkBtn(container));
        expect(validate).not.toHaveBeenCalled();
        expect(container.querySelector('[data-testid="feedback-banner"]')!.textContent).toContain(
          'Haz al menos un salto',
        );
      } finally {
        validate.mockRestore();
      }
    });

    it('tras acertar, los botones de salto, deshacer y empezar de nuevo quedan desactivados', () => {
      const { container, exercise } = renderOp('add', 1);
      const [a, b] = exercise.setup.operands!;
      solveByGreedy(container, a, a + b);
      fireEvent.click(checkBtn(container));
      for (const { el } of jumpButtons(container)) expect(el.disabled).toBe(true);
      expect(
        (container.querySelector('[data-testid="jump-undo"]') as HTMLButtonElement).disabled,
      ).toBe(true);
      expect(
        (container.querySelector('[data-testid="jump-clear"]') as HTMLButtonElement).disabled,
      ).toBe(true);
    });

    it('tras fallar y deshacer, se puede acertar', () => {
      const { container, exercise } = renderUntil('add', 2, (ex) => ex.setup.operands![1]! >= 2);
      const [a, b] = exercise.setup.operands!;
      fireEvent.click(container.querySelector('[data-testid="jump-btn-1"]')!);
      fireEvent.click(checkBtn(container));
      expect(incorrectBanner(container)).toBeInTheDocument();
      fireEvent.click(container.querySelector('[data-testid="jump-undo"]')!);
      solveByGreedy(container, a, a + b);
      fireEvent.click(checkBtn(container));
      expect(correctBanner(container)).toBeInTheDocument();
    });

    it('regla 6.1: el marcador actual no lleva número y el texto no revela el resultado', () => {
      const { container, exercise, getByTestId } = renderOp('add', 1);
      const [a, b] = exercise.setup.operands!;
      const result = exercise.correctAnswer as number;
      fireEvent.click(container.querySelector('[data-testid="jump-btn-1"]')!);
      const red = markerAt(container, a + 1)!;
      expect(red).toBeDefined();
      expect(red.querySelector('text')).toBeNull();
      if (result !== a && result !== b) {
        expect(
          new RegExp(`\\b${result}\\b`).test(getByTestId('activity-instruction').textContent!),
        ).toBe(false);
      }
    });

    it('los botones que se salen de la recta están desactivados (nivel 2, +10 desde el inicio)', () => {
      const { container } = renderUntil('add', 2, (ex) => ex.setup.operands![0]! + 10 > 20);
      expect(
        (container.querySelector('[data-testid="jump-btn-10"]') as HTMLButtonElement).disabled,
      ).toBe(true);
    });

    it('invariante: cada botón está activo solo si el salto cabe en la recta', () => {
      for (const [type, difficulty] of [
        ['add', 3],
        ['subtract', 2],
      ] as const) {
        const { container, exercise, unmount } = renderOp(type, difficulty);
        const [lo, hi] = exercise.setup.numberLineRange!;
        const [start] = exercise.setup.operands!;
        const result = exercise.correctAnswer as number;
        const sense = result >= start ? 1 : -1;
        let current = start;
        for (let step = 0; step < 3; step++) {
          for (const { el, n } of jumpButtons(container)) {
            const next = current + sense * n;
            expect(el.disabled).toBe(next < lo || next > hi);
          }
          fireEvent.click(container.querySelector('[data-testid="jump-btn-1"]')!);
          current += sense;
        }
        unmount();
      }
    });

    it('resta: instrucción con −, primer salto baja del minuendo y camino correcto → correcto', () => {
      const { container, exercise, getByTestId } = renderOp('subtract', 2);
      const [m, b] = exercise.setup.operands!;
      expect(getByTestId('activity-instruction').textContent).toContain(`${m} − ${b}`);
      fireEvent.click(container.querySelector('[data-testid="jump-btn-1"]')!);
      expect(markerAt(container, m - 1)).toBeDefined();
      // La vista ya está en m−1 tras el primer salto: el solver parte de ahí.
      solveByGreedy(container, m - 1, m - b);
      fireEvent.click(checkBtn(container));
      expect(correctBanner(container)).toBeInTheDocument();
      void b;
    });

    it('resta: quedarse corto → incorrecto con "Todavía no has llegado"', () => {
      const { container } = renderUntil('subtract', 2, (ex) => ex.setup.operands![1]! >= 2);
      fireEvent.click(container.querySelector('[data-testid="jump-btn-1"]')!);
      fireEvent.click(checkBtn(container));
      const banner = container.querySelector('[data-testid="feedback-banner"]')!;
      expect(banner.textContent).toContain('Todavía no has llegado');
    });

    it('resta: cada arco lleva su etiqueta −N', () => {
      const { container } = renderUntil('subtract', 1, (ex) => ex.setup.operands![1]! >= 3);
      fireEvent.click(container.querySelector('[data-testid="jump-btn-1"]')!);
      fireEvent.click(container.querySelector('[data-testid="jump-btn-2"]')!);
      const labels = Array.from(
        container.querySelectorAll('[data-testid="numberline-jump-label"]'),
      );
      expect(labels.map((l) => l.textContent)).toEqual(['−1', '−2']);
    });

    it('suma nivel 3: recta 0-100 con números cada 10, saltos grandes y camino por decenas', () => {
      const { container, exercise } = renderOp('add', 3);
      expect(exercise.setup.numberLineRange).toEqual([0, 100]);
      const nums = Array.from(
        container.querySelectorAll('[data-testid="numberline-number"]'),
      ).map((n) => n.textContent);
      expect(nums).toEqual(['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100']);
      expect(container.querySelector('[data-testid="jump-btn-20"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="jump-btn-50"]')).toBeInTheDocument();
      const [a, b] = exercise.setup.operands!;
      solveByGreedy(container, a, a + b);
      fireEvent.click(checkBtn(container));
      expect(correctBanner(container)).toBeInTheDocument();
    });

    it('suma nivel 4: resultado > 100, recta en múltiplos de 100 y salto de 100', () => {
      const { container, exercise } = renderOp('add', 4);
      const [a] = exercise.setup.operands!;
      const result = exercise.correctAnswer as number;
      expect(result).toBeGreaterThan(100);
      const [winLo, winHi] = exercise.setup.numberLineRange!;
      expect(winLo % 100).toBe(0);
      expect(winHi % 100).toBe(0);
      expect(container.querySelector('[data-testid="jump-btn-100"]')).toBeInTheDocument();
      solveByGreedy(container, a, result);
      fireEvent.click(checkBtn(container));
      expect(correctBanner(container)).toBeInTheDocument();
    });

    it('suma nivel 5: recta vacía, solo el marcador de partida lleva número', () => {
      const { container, exercise } = renderOp('add', 5);
      expect(container.querySelectorAll('[data-testid="numberline-number"]')).toHaveLength(0);
      const [a, b] = exercise.setup.operands!;
      const marker = container.querySelector('[data-testid="numberline-marker"]')!;
      expect(marker.textContent).toContain(String(a));
      solveByGreedy(container, a, a + b);
      fireEvent.click(checkBtn(container));
      expect(correctBanner(container)).toBeInTheDocument();
    });

    it('resta nivel 4: minuendo > 100, ventana en múltiplos de 100 y saltos bajan hasta acertar', () => {
      const { container, exercise } = renderOp('subtract', 4);
      const [m, b] = exercise.setup.operands!;
      expect(m).toBeGreaterThan(100);
      expect(b).toBeGreaterThanOrEqual(1);
      const [winLo, winHi] = exercise.setup.numberLineRange!;
      expect(winLo % 100).toBe(0);
      expect(winHi % 100).toBe(0);
      solveByGreedy(container, m, m - b);
      fireEvent.click(checkBtn(container));
      expect(correctBanner(container)).toBeInTheDocument();
    });
  });
});
