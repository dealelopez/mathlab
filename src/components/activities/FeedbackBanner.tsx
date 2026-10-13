export interface FeedbackBannerProps {
  /** Tipo de feedback */
  type: 'correct' | 'incorrect' | 'hint';
  /** Mensaje a mostrar */
  message: string;
  /** Test id (default 'feedback-banner') */
  testId?: string;
}

const STYLES: Record<FeedbackBannerProps['type'], string> = {
  correct: 'border-green-500 bg-green-50 text-green-800',
  incorrect: 'border-orange-400 bg-orange-50 text-orange-800',
  hint: 'border-blue-400 bg-blue-50 text-blue-800',
};

/**
 * FeedbackBanner — retroalimentación amable (nunca rojo agresivo: es un niño).
 */
export default function FeedbackBanner({ type, message, testId = 'feedback-banner' }: FeedbackBannerProps) {
  return (
    <div
      data-testid={testId}
      data-type={type}
      role="status"
      className={`feedback-enter rounded-lg border-2 px-4 py-2 text-lg font-semibold ${STYLES[type]}`}
    >
      {message}
    </div>
  );
}
