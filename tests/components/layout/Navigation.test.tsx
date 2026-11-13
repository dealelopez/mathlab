import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import Navigation from '../../../src/components/layout/Navigation';

describe('Navigation', () => {
  it('muestra el título y el botón "← Volver"', () => {
    const { getByRole, getByText } = render(<Navigation title="Rekenrek — Actividades" onBack={() => {}} />);
    expect(getByRole('heading', { name: 'Rekenrek — Actividades' })).toBeInTheDocument();
    expect(getByText('← Volver')).toBeInTheDocument();
  });

  it('pulsar "← Volver" llama a onBack', () => {
    const onBack = vi.fn();
    const { getByText } = render(<Navigation title="X" onBack={onBack} />);
    fireEvent.click(getByText('← Volver'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
