import { describe, it, expect, afterEach } from 'vitest';
import { render, fireEvent, within } from '@testing-library/react';
import App from '../src/App';

function section(container: HTMLElement, name: string): HTMLElement {
  return within(container).getByRole('region', { name });
}

function back(container: HTMLElement) {
  fireEvent.click(within(container).getByText('← Volver'));
}

afterEach(() => {
  window.history.pushState({}, '', '/');
});

describe('App — navegación', () => {
  it('muestra Home al iniciar con 4 manipulativos y 4 ejercicios', () => {
    const { container, getByRole } = render(<App />);
    expect(getByRole('heading', { name: 'Mathlab' })).toBeInTheDocument();
    for (const name of [
      'Rekenrek', 'Ábaco', 'Marco de diez', 'Recta numérica',
      'Descomposición', 'Series', 'Sumas', 'Restas',
    ]) {
      expect(section(container, name)).toBeInTheDocument();
    }
  });

  it('solo el ábaco tiene botón de tutorial', () => {
    const { container } = render(<App />);
    expect(within(section(container, 'Ábaco')).getByText('Tutorial')).toBeInTheDocument();
    expect(within(section(container, 'Rekenrek')).queryByText('Tutorial')).not.toBeInTheDocument();
  });

  it('Home → sandbox → volver', () => {
    const { container, getByRole } = render(<App />);
    fireEvent.click(within(section(container, 'Rekenrek')).getByText('Exploración libre'));
    expect(getByRole('heading', { name: 'Rekenrek — Exploración libre' })).toBeInTheDocument();
    expect(container.querySelectorAll('[role="slider"]').length).toBeGreaterThan(0);
    back(container);
    expect(getByRole('heading', { name: 'Mathlab' })).toBeInTheDocument();
  });

  it('Home → tutorial del ábaco → salir', () => {
    const { container, getByRole, getByText } = render(<App />);
    fireEvent.click(within(section(container, 'Ábaco')).getByText('Tutorial'));
    expect(getByText('Esto es un ábaco')).toBeInTheDocument();
    fireEvent.click(getByText('Salir del tutorial'));
    expect(getByRole('heading', { name: 'Mathlab' })).toBeInTheDocument();
  });

  it('Home → actividades → Empezar → ejercicio → volver a actividades', () => {
    const { container, getByRole, getByText, getByTestId } = render(<App />);
    fireEvent.click(within(section(container, 'Rekenrek')).getByText('Actividades'));
    expect(getByRole('heading', { name: 'Rekenrek — Actividades' })).toBeInTheDocument();
    fireEvent.click(getByText('Empezar'));
    expect(getByTestId('activity-instruction').textContent).toContain('Muestra el número');
    expect(getByTestId('activity-progress')).toHaveTextContent('1 / 10');
    // El "Volver" del runner regresa a la página de actividades, no a Home
    fireEvent.click(getByText('Volver'));
    expect(getByRole('heading', { name: 'Rekenrek — Actividades' })).toBeInTheDocument();
  });

  it('series es accesible desde Home y arranca una sesión de series', () => {
    const { container, getByRole, getByText, getByTestId } = render(<App />);
    fireEvent.click(within(section(container, 'Series')).getByText('Practicar'));
    expect(getByRole('heading', { name: 'Series' })).toBeInTheDocument();
    fireEvent.click(getByText('Empezar'));
    expect(getByTestId('activity-instruction')).toHaveTextContent('Completa la serie');
  });

  it('descomposición es accesible desde Home y arranca una sesión', () => {
    const { container, getByText, getByTestId } = render(<App />);
    fireEvent.click(within(section(container, 'Descomposición')).getByText('Practicar'));
    fireEvent.click(getByText('Empezar'));
    expect(getByTestId('activity-instruction').textContent).toMatch(/\d+\s*=/);
  });

  it('sumas es accesible desde Home y arranca con la recta y los operandos', () => {
    const { container, getByRole, getByText, getByTestId } = render(<App />);
    fireEvent.click(within(section(container, 'Sumas')).getByText('Practicar'));
    expect(getByRole('heading', { name: 'Sumas' })).toBeInTheDocument();
    fireEvent.click(getByText('Empezar'));
    expect(getByTestId('activity-instruction').textContent).toMatch(/¿Cuánto es \d+ \+ \d+\?/);
    expect(getByTestId('number-line')).toBeInTheDocument();
    expect(getByTestId('jump-btn-1')).toBeInTheDocument();
  });

  it('restas es accesible desde Home y arranca con el signo −', () => {
    const { container, getByRole, getByText, getByTestId } = render(<App />);
    fireEvent.click(within(section(container, 'Restas')).getByText('Practicar'));
    expect(getByRole('heading', { name: 'Restas' })).toBeInTheDocument();
    fireEvent.click(getByText('Empezar'));
    expect(getByTestId('activity-instruction').textContent).toMatch(/¿Cuánto es \d+ − \d+\?/);
    expect(getByTestId('number-line')).toBeInTheDocument();
  });

  it('sesión completa de sumas con caminos correctos muestra "Sesión completada"', () => {
    const { container, getByText, getByTestId } = render(<App />);
    fireEvent.click(within(section(container, 'Sumas')).getByText('Practicar'));
    fireEvent.click(getByText('Empezar'));
    for (let i = 0; i < 10; i++) {
      const instr = getByTestId('activity-instruction').textContent!;
      const [a, b] = (instr.match(/¿Cuánto es (\d+) \+ (\d+)\?/) ?? []).slice(1).map(Number);
      expect(a).toBeGreaterThan(0);
      // Greedy: el mayor salto que quepa en lo que falta, hasta aterrizar en a+b
      let current = a!;
      let guard = 0;
      while (current !== a! + b! && guard < 50) {
        guard++;
        const remaining = a! + b! - current;
        const btn = Array.from(
          container.querySelectorAll<HTMLButtonElement>('button[data-testid^="jump-btn-"]'),
        )
          .map((el) => ({ el, n: Number(el.getAttribute('data-testid')!.slice('jump-btn-'.length)) }))
          .filter(({ el, n }) => !el.disabled && n <= remaining)
          .sort((x, y) => y.n - x.n)[0]!;
        fireEvent.click(btn.el);
        current += btn.n;
      }
      fireEvent.click(getByText('Comprobar'));
      fireEvent.click(getByText('Siguiente →'));
    }
    expect(getByText('¡Sesión completada!')).toBeInTheDocument();
  });

  it('placement es accesible desde la recta numérica', () => {
    const { container, getByRole, getByText, getByTestId } = render(<App />);
    fireEvent.click(within(section(container, 'Recta numérica')).getByText('Actividades'));
    fireEvent.click(
      within(getByRole('group', { name: 'Ejercicio' })).getByText('Colocar en la recta'),
    );
    fireEvent.click(getByText('Empezar'));
    expect(getByTestId('activity-instruction').textContent).toMatch(/^Coloca el \d+ en la recta/);
  });

  it('completar una sesión muestra "Sesión completada" y permite repetir o volver', () => {
    const { container, getByRole, getByText, getByTestId } = render(<App />);
    fireEvent.click(within(section(container, 'Recta numérica')).getByText('Actividades'));
    fireEvent.click(within(getByRole('group', { name: 'Ejercicio' })).getByText('Colocar en la recta'));
    fireEvent.click(getByText('Empezar'));
    for (let i = 0; i < 10; i++) {
      // Un click sin acertar basta para que aparezca "Siguiente" (con el nivel 1 hay 6 posiciones)
      fireEvent.click(getByTestId('number-line'), { clientX: 40 });
      fireEvent.click(getByText('Siguiente →'));
    }
    expect(getByText('¡Sesión completada!')).toBeInTheDocument();
    fireEvent.click(getByText('Repetir'));
    expect(getByTestId('activity-progress')).toHaveTextContent('1 / 10');
    fireEvent.click(getByText('Volver'));
    expect(getByRole('heading', { name: 'Recta numérica — Actividades' })).toBeInTheDocument();
  });

  it('?dev abre el selector libre de ejercicios en vez de Home', () => {
    window.history.pushState({}, '', '/?dev');
    const { getByRole, getByLabelText, queryByRole } = render(<App />);
    expect(getByRole('heading', { name: 'Mathlab — modo desarrollo' })).toBeInTheDocument();
    expect(getByLabelText('Tipo')).toBeInTheDocument();
    expect(queryByRole('heading', { name: 'Mathlab' })).not.toBeInTheDocument();
  });
});
