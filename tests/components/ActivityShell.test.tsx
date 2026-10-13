import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import ActivityShell from '../../src/components/activities/ActivityShell';

function setup(props = {}) {
  return render(
    <ActivityShell
      instruction="Muestra el número 13"
      onCheck={() => {}}
      feedback={null}
      onNext={() => {}}
      exerciseNumber={3}
      totalExercises={10}
      {...props}
    >
      <div data-testid="child-content">contenido</div>
    </ActivityShell>,
  );
}

function checkBtn(container: HTMLElement): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll('button')).find(
    (b) => b.textContent === 'Comprobar',
  ) as HTMLButtonElement | undefined;
}

function nextBtn(container: HTMLElement): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll('button')).find((b) =>
    b.textContent?.startsWith('Siguiente'),
  ) as HTMLButtonElement | undefined;
}

describe('ActivityShell', () => {
  it('renderiza la instrucción como texto visible', () => {
    const { getByTestId } = setup();
    expect(getByTestId('activity-instruction')).toHaveTextContent('Muestra el número 13');
  });

  it('renderiza los children', () => {
    const { getByTestId } = setup();
    expect(getByTestId('child-content')).toBeInTheDocument();
  });

  it('botón "Comprobar" visible por defecto', () => {
    const { container } = setup();
    expect(checkBtn(container)).toBeInTheDocument();
  });

  it('click en "Comprobar" llama onCheck', () => {
    const onCheck = vi.fn();
    const { container } = setup({ onCheck });
    fireEvent.click(checkBtn(container)!);
    expect(onCheck).toHaveBeenCalledTimes(1);
  });

  it("feedback='correct': FeedbackBanner visible con tipo correcto", () => {
    const { getByTestId } = setup({ feedback: 'correct' });
    const banner = getByTestId('feedback-banner');
    expect(banner).toHaveAttribute('data-type', 'correct');
  });

  it("feedback='incorrect': FeedbackBanner visible con tipo incorrecto", () => {
    const { getByTestId } = setup({ feedback: 'incorrect' });
    const banner = getByTestId('feedback-banner');
    expect(banner).toHaveAttribute('data-type', 'incorrect');
  });

  it("feedback='correct': botón Siguiente visible y Comprobar oculto", () => {
    const { container } = setup({ feedback: 'correct' });
    expect(nextBtn(container)).toBeInTheDocument();
    expect(checkBtn(container)).toBeUndefined();
  });

  it('click en "Siguiente" llama onNext', () => {
    const onNext = vi.fn();
    const { container } = setup({ feedback: 'correct', onNext });
    fireEvent.click(nextBtn(container)!);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('progreso muestra "3 / 10"', () => {
    const { getByTestId } = setup({ exerciseNumber: 3, totalExercises: 10 });
    expect(getByTestId('activity-progress')).toHaveTextContent('3 / 10');
  });

  it('showCheckButton=false: botón "Comprobar" no se renderiza', () => {
    const { container } = setup({ showCheckButton: false });
    expect(checkBtn(container)).toBeUndefined();
  });

  it("feedback='incorrect' con hint: muestra la pista", () => {
    const { getByTestId } = setup({ feedback: 'incorrect', hint: 'Cuenta de dos en dos' });
    expect(getByTestId('feedback-banner')).toHaveAttribute('data-type', 'incorrect');
    expect(getByTestId('feedback-hint')).toHaveTextContent('Cuenta de dos en dos');
  });
});
