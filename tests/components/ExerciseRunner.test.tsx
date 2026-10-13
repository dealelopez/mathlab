import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import ExerciseRunner from '../../src/components/activities/ExerciseRunner';

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
      const check = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent === 'Comprobar',
      )!;
      fireEvent.click(check);
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
});
