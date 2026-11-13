export interface NavigationProps {
  /** Título de la página actual */
  title: string;
  /** Callback del botón "← Volver" */
  onBack: () => void;
}

/** Barra superior: botón de volver y título de la página. */
export default function Navigation({ title, onBack }: NavigationProps) {
  return (
    <header className="mb-4 flex items-center gap-3 border-b pb-3">
      <button
        type="button"
        onClick={onBack}
        className="min-h-11 cursor-pointer rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-base font-semibold"
      >
        ← Volver
      </button>
      <h1 className="text-xl font-bold">{title}</h1>
    </header>
  );
}
