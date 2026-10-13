import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import AbacusTutorial from '../../src/components/tutorial/AbacusTutorial';

function setup(props = {}) {
  return render(
    <AbacusTutorial onComplete={() => {}} onBack={() => {}} {...props} />,
  );
}

function nextBtn(container: HTMLElement): HTMLButtonElement {
  const btns = Array.from(container.querySelectorAll('button'));
  const b = btns.find((x) => x.textContent === 'Siguiente');
  if (!b) throw new Error('Botón Siguiente no encontrado');
  return b as HTMLButtonElement;
}

function backBtn(container: HTMLElement): HTMLButtonElement {
  const btns = Array.from(container.querySelectorAll('button'));
  const b = btns.find((x) => x.textContent === 'Anterior');
  if (!b) throw new Error('Botón Anterior no encontrado');
  return b as HTMLButtonElement;
}

/** Avanza hasta el paso de ejercicio 3 (dos Siguiente desde el paso 1). */
function goToStep3(container: HTMLElement) {
  fireEvent.click(nextBtn(container)); // paso 1 → 2
  fireEvent.click(nextBtn(container)); // paso 2 → 3
}

/** Lee el número objetivo del título del paso actual. */
function readTarget(container: HTMLElement): number {
  const title = container.querySelector('[data-testid="tutorial-title"]')!.textContent ?? '';
  const m = title.match(/\d+/);
  if (!m) throw new Error(`Sin objetivo en título: "${title}"`);
  return Number(m[0]);
}

/**
 * Resuelve el paso de ejercicio actual: parte de 0, así que un solo click
 * por fila en la cuenta (dígito-1) fija cada dígito (los 0 no necesitan click).
 */
function solveCurrentStep(container: HTMLElement) {
  const target = readTarget(container);
  const sliders = Array.from(container.querySelectorAll('[role="slider"]'));
  const digits = String(target).padStart(sliders.length, '0').split('').map(Number);
  sliders.forEach((slider, i) => {
    const d = digits[i]!;
    if (d > 0) fireEvent.click(slider.querySelectorAll('circle')[d - 1]!);
  });
}

describe('AbacusTutorial', () => {
  it('empieza en paso 1', () => {
    const { getByTestId } = setup();
    expect(getByTestId('tutorial-title')).toHaveTextContent('Esto es un ábaco');
  });

  it('botón Siguiente avanza al paso 2', () => {
    const { container, getByTestId } = setup();
    fireEvent.click(nextBtn(container));
    expect(getByTestId('tutorial-title')).toHaveTextContent('Las unidades');
  });

  it('botón Anterior retrocede al paso 1', () => {
    const { container, getByTestId } = setup();
    fireEvent.click(nextBtn(container));
    fireEvent.click(backBtn(container));
    expect(getByTestId('tutorial-title')).toHaveTextContent('Esto es un ábaco');
  });

  it('en paso de ejercicio (3): Siguiente deshabilitado hasta acertar', () => {
    const { container } = setup();
    goToStep3(container);
    expect(nextBtn(container).disabled).toBe(true);
  });

  it('en paso de ejercicio: respuesta correcta habilita Siguiente', () => {
    const { container } = setup();
    goToStep3(container);
    solveCurrentStep(container);
    expect(nextBtn(container).disabled).toBe(false);
    expect(container.textContent).toContain('¡Correcto!');
  });

  it('cada montaje pide números distintos (objetivos aleatorios)', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const { container, unmount } = setup();
      goToStep3(container);
      seen.add(container.querySelector('[data-testid="tutorial-title"]')!.textContent ?? '');
      unmount();
    }
    // Con objetivos 1-9 sería casi imposible ver siempre el mismo en 10 intentos
    expect(seen.size).toBeGreaterThan(1);
  });

  it('al completar paso 7: se llama onComplete', () => {
    const onComplete = vi.fn();
    const { container } = setup({ onComplete });
    goToStep3(container);
    solveCurrentStep(container); // paso 3
    fireEvent.click(nextBtn(container)); // → paso 4
    fireEvent.click(nextBtn(container)); // → paso 5
    solveCurrentStep(container); // paso 5
    fireEvent.click(nextBtn(container)); // → paso 6
    fireEvent.click(nextBtn(container)); // → paso 7
    solveCurrentStep(container); // paso 7
    fireEvent.click(nextBtn(container)); // → onComplete
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('indicador de progreso muestra el paso actual', () => {
    const { container, getByTestId } = setup();
    expect(getByTestId('progress-dot-1')).toHaveAttribute('aria-current', 'step');
    fireEvent.click(nextBtn(container));
    expect(getByTestId('progress-dot-2')).toHaveAttribute('aria-current', 'step');
    expect(container.querySelector('[data-testid="tutorial-progress"]')!.children).toHaveLength(7);
  });
});
