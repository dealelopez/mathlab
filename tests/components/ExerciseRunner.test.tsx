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
    // 1 fila (dificultad 1) con valor 0
    const sliders = Array.from(container.querySelectorAll('[role="slider"]'));
    expect(sliders).toHaveLength(1);
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

  it('identify + rekenrek: readOnly con valor fijo y AnswerSlot para responder', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="identify" difficulty={1} manipulative="rekenrek" />,
    );
    const shown = Number(getByTestId('rekenrek-total').textContent!.match(/Total: (\d+)/)![1]);
    // readOnly: click no cambia el valor
    fireEvent.click(container.querySelectorAll('[role="slider"] circle')[0]!);
    expect(getByTestId('rekenrek-total')).toHaveTextContent(`Total: ${shown}`);
    // Slot de respuesta visible
    expect(getByTestId('answer-slot')).toBeInTheDocument();
    expect(container.textContent).toContain('Tu respuesta:');
  });

  function answerIdentify(
    container: HTMLElement,
    getByTestId: (id: string) => HTMLElement,
    value: number,
  ) {
    fireEvent.click(getByTestId('answer-slot'));
    String(value)
      .split('')
      .forEach((d) => fireEvent.click(getByTestId(`numpad-${d}`)));
    fireEvent.click(getByTestId('numpad-confirm'));
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

  it('identify + ábaco: número fijo visible y slot de respuesta', () => {
    const { container, getByTestId } = render(
      <ExerciseRunner exerciseType="identify" difficulty={2} manipulative="abacus" />,
    );
    expect(getByTestId('abacus-number')).toBeInTheDocument();
    expect(getByTestId('answer-slot')).toBeInTheDocument();
    expect(container.querySelectorAll('[role="slider"]')).toHaveLength(1);
  });

  it('cambiar dificultad de 2 a 4 cambia las filas del rekenrek (2→5)', () => {
    const { container, rerender } = render(
      <ExerciseRunner exerciseType="represent" difficulty={2} manipulative="rekenrek" />,
    );
    expect(container.querySelectorAll('[role="slider"]')).toHaveLength(2);
    rerender(<ExerciseRunner exerciseType="represent" difficulty={4} manipulative="rekenrek" />);
    expect(container.querySelectorAll('[role="slider"]')).toHaveLength(5);
  });
});
