import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, within } from '@testing-library/react';
import SandboxPage from '../../../src/components/layout/SandboxPage';

function sliders(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[role="slider"]'));
}

describe('SandboxPage', () => {
  it('muestra título con el nombre del manipulativo y vuelve con "← Volver"', () => {
    const onBack = vi.fn();
    const { getByRole, getByText } = render(<SandboxPage manipulative="rekenrek" onBack={onBack} />);
    expect(getByRole('heading', { name: 'Rekenrek — Exploración libre' })).toBeInTheDocument();
    fireEvent.click(getByText('← Volver'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('rekenrek: selector de filas y reinicio', () => {
    const { container, getByRole, getByText, getByTestId } = render(
      <SandboxPage manipulative="rekenrek" onBack={() => {}} />,
    );
    expect(sliders(container)).toHaveLength(2);
    fireEvent.click(container.querySelectorAll('[role="slider"] circle')[2]!);
    expect(getByTestId('rekenrek-total')).toHaveTextContent('Total: 3');
    fireEvent.click(getByText('Empezar de nuevo'));
    expect(getByTestId('rekenrek-total')).toHaveTextContent('Total: 0');
    fireEvent.click(within(getByRole('group', { name: 'Filas' })).getByText('1'));
    expect(sliders(container)).toHaveLength(1);
  });

  it('ábaco: el selector de columnas cambia el número de filas', () => {
    const { container, getByRole } = render(<SandboxPage manipulative="abacus" onBack={() => {}} />);
    const group = getByRole('group', { name: 'Columnas' });
    expect(sliders(container)).toHaveLength(1);
    fireEvent.click(within(group).getByText('Decenas y unidades'));
    expect(sliders(container)).toHaveLength(2);
    fireEvent.click(within(group).getByText('Centenas, decenas y unidades'));
    expect(sliders(container)).toHaveLength(3);
  });

  it('ábaco: mover cuentas actualiza el número y "Empezar de nuevo" lo pone a 0', () => {
    const { container, getByTestId, getByText } = render(
      <SandboxPage manipulative="abacus" onBack={() => {}} />,
    );
    fireEvent.click(container.querySelectorAll('[role="slider"] circle')[4]!);
    expect(getByTestId('abacus-number')).toHaveTextContent('5');
    fireEvent.click(getByText('Empezar de nuevo'));
    expect(getByTestId('abacus-number')).toHaveTextContent('0');
  });

  it('marco de diez: 1 o 2 marcos', () => {
    const { container, getByRole } = render(<SandboxPage manipulative="tenframe" onBack={() => {}} />);
    expect(container.querySelectorAll('[data-testid="tenframe-cell"]')).toHaveLength(10);
    fireEvent.click(within(getByRole('group', { name: 'Marcos' })).getByText('2 marcos'));
    expect(container.querySelectorAll('[data-testid="tenframe-cell"]')).toHaveLength(20);
  });

  it('marco de diez: tocar una celda suma una ficha', () => {
    const { container, getByTestId } = render(<SandboxPage manipulative="tenframe" onBack={() => {}} />);
    fireEvent.click(container.querySelectorAll('[data-testid="tenframe-cell"]')[0]!);
    expect(getByTestId('tenframe-value')).toHaveTextContent('1');
  });

  it('recta: tocar coloca un marcador y cambiar de rango lo quita', () => {
    const { container, getByRole, getByTestId } = render(
      <SandboxPage manipulative="numberline" onBack={() => {}} />,
    );
    // Rango 0-10: 500 de ancho, PAD 40 → 42 px por unidad
    fireEvent.click(getByTestId('number-line'), { clientX: 40 + 7 * 42 });
    expect(container.querySelector('[data-testid="numberline-marker"]')!.getAttribute('data-position')).toBe('7');
    fireEvent.click(within(getByRole('group', { name: 'Rango' })).getByText('0 a 50'));
    expect(container.querySelector('[data-testid="numberline-marker"]')).not.toBeInTheDocument();
  });

  it('recta: en rangos largos rotula solo los múltiplos de 10', () => {
    const { container, getByRole } = render(<SandboxPage manipulative="numberline" onBack={() => {}} />);
    fireEvent.click(within(getByRole('group', { name: 'Rango' })).getByText('0 a 100'));
    const nums = Array.from(container.querySelectorAll('[data-testid="numberline-number"]')).map(
      (n) => n.textContent,
    );
    expect(nums).toEqual(['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100']);
  });
});
