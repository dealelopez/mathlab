import '@testing-library/jest-dom/vitest';

// Polyfill mínimo de PointerEvent para jsdom (no lo implementa).
// Hereda de MouseEvent para conservar clientX/clientY en los tests.
// Sin esto, fireEvent.pointerDown(el, { clientX }) pierde las coordenadas.
if (typeof window !== 'undefined' && typeof (window as unknown as Record<string, unknown>).PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;

    constructor(type: string, init: (MouseEventInit & { pointerId?: number; pointerType?: string; isPrimary?: boolean }) = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? 'mouse';
      this.isPrimary = init.isPrimary ?? true;
    }
  }
  (window as unknown as Record<string, unknown>).PointerEvent = PointerEventPolyfill;
  (globalThis as unknown as Record<string, unknown>).PointerEvent = PointerEventPolyfill;
}

// setPointerCapture/releasePointerCapture no existen en jsdom: no-ops.
if (typeof Element !== 'undefined') {
  if (typeof (Element.prototype as unknown as Record<string, unknown>).setPointerCapture === 'undefined') {
    (Element.prototype as unknown as Record<string, unknown>).setPointerCapture = () => {};
  }
  if (typeof (Element.prototype as unknown as Record<string, unknown>).releasePointerCapture === 'undefined') {
    (Element.prototype as unknown as Record<string, unknown>).releasePointerCapture = () => {};
  }
  if (typeof (Element.prototype as unknown as Record<string, unknown>).hasPointerCapture === 'undefined') {
    (Element.prototype as unknown as Record<string, unknown>).hasPointerCapture = () => false;
  }
}
