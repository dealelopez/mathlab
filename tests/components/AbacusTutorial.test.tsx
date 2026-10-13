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

  it('en paso de ejercicio (3): Siguiente deshabilitado hasta que value === 3', () => {
    const { container } = setup();
    goToStep3(container);
    expect(nextBtn(container).disabled).toBe(true);
  });

  it('en paso de ejercicio: respuesta correcta habilita Siguiente', () => {
    const { container } = setup();
    goToStep3(container);
    // Fila U (value=0): click en cuenta índice 2 (inactiva) → value=3
    const slider = container.querySelector('[role="slider"]')!;
    fireEvent.click(slider.querySelectorAll('circle')[2]!);
    expect(nextBtn(container).disabled).toBe(false);
    expect(container.textContent).toContain('¡Correcto!');
  });

  it('al completar paso 7: se llama onComplete', () => {
    const onComplete = vi.fn();
    const { container } = setup({ onComplete });
    goToStep3(container);
    // Paso 3: resolver (U → 3)
    fireEvent.click(container.querySelector('[role="slider"]')!.querySelectorAll('circle')[2]!);
    fireEvent.click(nextBtn(container)); // → paso 4
    fireEvent.click(nextBtn(container)); // → paso 5
    // Paso 5: formar 25 (D → 2, U → 5)
    const sliders5 = Array.from(container.querySelectorAll('[role="slider"]'));
    fireEvent.click(sliders5[0]!.querySelectorAll('circle')[1]!);
    fireEvent.click(sliders5[1]!.querySelectorAll('circle')[4]!);
    fireEvent.click(nextBtn(container)); // → paso 6
    fireEvent.click(nextBtn(container)); // → paso 7
    // Paso 7: formar 142 (C → 1, D → 4, U → 2)
    const sliders7 = Array.from(container.querySelectorAll('[role="slider"]'));
    fireEvent.click(sliders7[0]!.querySelectorAll('circle')[0]!);
    fireEvent.click(sliders7[1]!.querySelectorAll('circle')[3]!);
    fireEvent.click(sliders7[2]!.querySelectorAll('circle')[1]!);
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
