export interface OptionGroupProps<T extends string | number> {
  /** Nombre del grupo (se muestra y se usa como etiqueta accesible) */
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Selector de una opción entre varias, con botones grandes aptos para táctil. */
export default function OptionGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: OptionGroupProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(o.value)}
              className={`min-h-11 min-w-11 cursor-pointer rounded-lg border-2 px-4 py-2 text-base font-semibold ${
                selected
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-300 bg-white text-slate-800'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
