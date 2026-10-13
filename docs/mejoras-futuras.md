# Mejoras futuras (menores)

Lista de fricciones detectadas probando la app. No son bugs (el comportamiento
actual es el especificado), sino UX a corregir más adelante.

---

## TENFRAME-01 — Interacción de rellenado del TenFrame (menor)

**Detectado:** probando el TenFrame en iPad.

**Problema:**
- Añadir fichas exige un click/toque por ficha (+1 cada vez).
- Tocar una celda que ya tiene ficha resta (−1, quita la última).
- Cuando el marco está lleno o el valor no cuadra, el niño se atasca: para
  dejarlo "bien" tiene que haber contado antes, lo que anula la gracia del
  manipulativo (el marco debería *ayudar* a contar, no exigirlo por adelantado).

**Dirección propuesta (a decidir):**
- Tocar una celda vacía rellena *hasta esa celda* en vez de +1.
- Tocar una celda llena vacía *hasta esa celda* (o solo esa) en vez de −1 global.
- Alternativas: pintar arrastrando el dedo por las celdas, o botones +/−
  grandes como alternativa al toque por celda.

**Alcance:** `src/components/manipulatives/TenFrame.tsx` + tests en
`tests/components/TenFrame.test.tsx` (cambia la semántica de click).
