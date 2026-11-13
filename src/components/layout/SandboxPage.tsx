import { useState } from 'react';
import type { Manipulative } from '../../types';
import { visibleNumbersFor } from '../../engine/generators/placement';
import Rekenrek from '../manipulatives/Rekenrek';
import Abacus from '../manipulatives/Abacus';
import { toAbacusColumns } from '../manipulatives/abacusColumns';
import TenFrame from '../manipulatives/TenFrame';
import NumberLine from '../manipulatives/NumberLine';
import Navigation from './Navigation';
import OptionGroup from './OptionGroup';
import { MANIPULATIVE_LABELS } from './catalog';

export interface SandboxPageProps {
  manipulative: Manipulative;
  onBack: () => void;
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 cursor-pointer self-start rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-base font-semibold"
    >
      Empezar de nuevo
    </button>
  );
}

function RekenrekSandbox() {
  // Un rekenrek real tiene 2 filas; la fila única sirve para contar hasta 10.
  const [rows, setRows] = useState(2);
  const [value, setValue] = useState(0);
  return (
    <>
      <OptionGroup
        label="Filas"
        options={[
          { value: 1, label: '1' },
          { value: 2, label: '2' },
        ]}
        value={rows}
        onChange={(r) => {
          setRows(r);
          setValue(0);
        }}
      />
      <Rekenrek rows={rows} value={value} onChange={(_values, total) => setValue(total)} />
      <ResetButton onClick={() => setValue(0)} />
    </>
  );
}

const ABACUS_OPTIONS = [
  { value: 'U', label: 'Unidades' },
  { value: 'DU', label: 'Decenas y unidades' },
  { value: 'CDU', label: 'Centenas, decenas y unidades' },
];

function AbacusSandbox() {
  const [columns, setColumns] = useState('U');
  const [value, setValue] = useState(0);
  return (
    <>
      <OptionGroup
        label="Columnas"
        options={ABACUS_OPTIONS}
        value={columns}
        onChange={(c) => {
          setColumns(c);
          setValue(0);
        }}
      />
      <Abacus columns={toAbacusColumns(columns.split(''))} value={value} onChange={setValue} />
      <ResetButton onClick={() => setValue(0)} />
    </>
  );
}

function TenFrameSandbox() {
  const [frames, setFrames] = useState(1);
  const [value, setValue] = useState(0);
  return (
    <>
      <OptionGroup
        label="Marcos"
        options={[
          { value: 1, label: '1 marco' },
          { value: 2, label: '2 marcos' },
        ]}
        value={frames}
        onChange={(f) => {
          setFrames(f);
          setValue(0);
        }}
      />
      <TenFrame frames={frames} value={value} onChange={setValue} />
      <ResetButton onClick={() => setValue(0)} />
    </>
  );
}

const RANGES: { value: number; label: string }[] = [
  { value: 10, label: '0 a 10' },
  { value: 20, label: '0 a 20' },
  { value: 50, label: '0 a 50' },
  { value: 100, label: '0 a 100' },
];

/** Separación entre marcas: 1 hasta 20, 5 hasta 50, 10 en 100 (siempre unas 10-20 marcas). */
function stepFor(max: number): number {
  return max <= 20 ? 1 : max <= 50 ? 5 : 10;
}

function NumberLineSandbox() {
  const [max, setMax] = useState(10);
  const [position, setPosition] = useState<number | null>(null);
  return (
    <>
      <OptionGroup
        label="Rango"
        options={RANGES}
        value={max}
        onChange={(m) => {
          setMax(m);
          setPosition(null);
        }}
      />
      <div className="max-w-full overflow-x-auto">
        <NumberLine
          min={0}
          max={max}
          step={stepFor(max)}
          showNumbers={max <= 20 ? true : visibleNumbersFor(0, max)}
          interactive="place"
          onPlaceMarker={setPosition}
          markers={
            position === null
              ? []
              : [{ position, color: '#EF4444', label: String(position) }]
          }
        />
      </div>
      <ResetButton onClick={() => setPosition(null)} />
    </>
  );
}

const SANDBOXES: Record<Manipulative, () => React.JSX.Element> = {
  rekenrek: RekenrekSandbox,
  abacus: AbacusSandbox,
  tenframe: TenFrameSandbox,
  numberline: NumberLineSandbox,
};

/** Exploración libre de un manipulativo: sin ejercicio, validación ni feedback. */
export default function SandboxPage({ manipulative, onBack }: SandboxPageProps) {
  const Sandbox = SANDBOXES[manipulative];
  return (
    <div className="flex flex-col gap-4">
      <Navigation title={`${MANIPULATIVE_LABELS[manipulative]} — Exploración libre`} onBack={onBack} />
      <Sandbox />
    </div>
  );
}
