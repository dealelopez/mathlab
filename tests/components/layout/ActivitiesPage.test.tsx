import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, within } from '@testing-library/react';
import ActivitiesPage from '../../../src/components/layout/ActivitiesPage';
import type { ExerciseType, Manipulative } from '../../../src/types';

function setup(exerciseTypes: ExerciseType[], manipulative?: Manipulative) {
  const onStart = vi.fn();
  const onBack = vi.fn();
  const utils = render(
    <ActivitiesPage
      title="Prueba"
      exerciseTypes={exerciseTypes}
      manipulative={manipulative}
      onStart={onStart}
      onBack={onBack}
    />,
  );
  const group = (name: string) => utils.getByRole('group', { name });
  const levelButtons = () =>
    within(group('Nivel'))
      .getAllByRole('button')
      .map((b) => b.textContent);
  return { ...utils, onStart, onBack, group, levelButtons };
}

describe('ActivitiesPage', () => {
  it('rekenrek solo ofrece los niveles 1-3 (números hasta 20)', () => {
    const { levelButtons } = setup(['represent', 'identify'], 'rekenrek');
    expect(levelButtons()).toEqual(['1', '2', '3']);
  });

  it('el ábaco ofrece los 5 niveles', () => {
    const { levelButtons } = setup(['represent', 'identify'], 'abacus');
    expect(levelButtons()).toEqual(['1', '2', '3', '4', '5']);
  });

  it('"Empezar" lanza la configuración elegida con el manipulativo', () => {
    const { getByText, group, onStart } = setup(['represent', 'identify'], 'tenframe');
    fireEvent.click(within(group('Ejercicio')).getByText('Identificar'));
    fireEvent.click(within(group('Nivel')).getByText('3'));
    fireEvent.click(within(group('Respuesta')).getByText('Libre'));
    fireEvent.click(getByText('Empezar'));
    expect(onStart).toHaveBeenCalledWith({
      exerciseType: 'identify',
      difficulty: 3,
      manipulative: 'tenframe',
      answerMode: 'free',
    });
  });

  it('muestra el rango numérico del nivel elegido', () => {
    const { getByText, group } = setup(['identify'], 'abacus');
    expect(getByText('Números del 1 al 5')).toBeInTheDocument();
    fireEvent.click(within(group('Nivel')).getByText('5'));
    expect(getByText('Números del 1 al 100')).toBeInTheDocument();
  });

  it('con un solo tipo de ejercicio no muestra el selector de ejercicio', () => {
    const { queryByRole } = setup(['series']);
    expect(queryByRole('group', { name: 'Ejercicio' })).not.toBeInTheDocument();
  });

  it('series y descomposición lanzan sin manipulativo', () => {
    const { getByText, onStart } = setup(['series']);
    fireEvent.click(getByText('Empezar'));
    expect(onStart).toHaveBeenCalledWith({
      exerciseType: 'series',
      difficulty: 1,
      manipulative: undefined,
      answerMode: 'drag',
    });
  });

  it('identify en la recta numérica sí ofrece el modo de respuesta', () => {
    const { queryByRole } = setup(['identify', 'placement'], 'numberline');
    expect(queryByRole('group', { name: 'Respuesta' })).toBeInTheDocument();
  });

  it('cambiar a placement oculta el modo de respuesta', () => {
    const { group, queryByRole } = setup(['identify', 'placement'], 'numberline');
    fireEvent.click(within(group('Ejercicio')).getByText('Colocar en la recta'));
    expect(queryByRole('group', { name: 'Respuesta' })).not.toBeInTheDocument();
  });

  it('"← Volver" llama a onBack', () => {
    const { getByText, onBack } = setup(['series']);
    fireEvent.click(getByText('← Volver'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
