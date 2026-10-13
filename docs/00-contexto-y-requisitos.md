# 00 — Contexto y Requisitos

## Perfil del usuario

| Área | Detalle |
|------|---------|
| Uso | Individual — un niño practica solo o acompañado de un adulto |
| Edad objetivo | 3-8 años (infantil + primaria baja) |
| Dispositivos | iPad / iPhone (Safari), tablet Android (Firefox/Chrome), desktop |
| Interacción | Touch (principal) + mouse (secundario) |
| Sesiones | Cortas, tipo Smartick (~15 min), pero sin restricción estricta al inicio |

---

## Metodologías de referencia

### Innovamat

- Enfoque **CPA (Concreto → Pictórico → Abstracto)**: el niño primero manipula, luego ve representaciones visuales, luego trabaja con símbolos.
- **Manipulativos** como herramienta central: rekenrek, ábaco, marcos de diez, recta numérica, bloques base 10.
- **Múltiples representaciones** del mismo concepto: un número se puede ver en el rekenrek, en el ábaco, en un ten frame, y en la recta numérica.
- Exploración libre antes de la instrucción dirigida.
- Foco en comprensión profunda, no en velocidad de cálculo.

### Smartick

- Sesiones cortas y diarias (15 minutos).
- **Dificultad adaptativa**: el sistema ajusta la dificultad según el rendimiento del niño.
- **Feedback inmediato**: el niño sabe al instante si acertó o falló.
- **Generación procedural**: los ejercicios no se repiten, se generan algorítmicamente.
- Variedad de tipos de ejercicio para mantener la atención.

### Lo que tomamos de cada una

| De Innovamat | De Smartick |
|---|---|
| Manipulativos interactivos como eje | Generación procedural de ejercicios |
| Modo sandbox (exploración libre) | Feedback inmediato |
| Múltiples representaciones del mismo concepto | Dificultad adaptable |
| Enfoque CPA | Sesiones cortas (timer como idea) |

---

## Requisitos funcionales

### Manipulativos interactivos

1. **Rekenrek (rack aritmético)**: 1-10 filas de 10 cuentas (5 rojas + 5 blancas). El niño desliza cuentas para representar cantidades. Configurable en número de filas.
2. **Ábaco escolar occidental**: N filas de 10 cuentas, cada fila = valor posicional (Unidades, Decenas, Centenas). Muestra el número compuesto. Incluye tutorial interactivo paso a paso para aprender a usarlo.
3. **Marco de diez (Ten Frame)**: cuadrícula 2×5 donde se colocan fichas. Simple o doble (hasta 20). Click para añadir/quitar fichas.
4. **Recta numérica (Number Line)**: línea horizontal con marcas y números. Rango y visibilidad de números configurables. El niño coloca marcadores tocando la recta.

### Modos de uso

5. **Modo sandbox**: exploración libre de cada manipulativo sin ejercicios ni validación. El niño experimenta.
6. **Modo actividades guiadas**: ejercicios con instrucción, validación y feedback. Generados proceduralmente.

### Tipos de ejercicio

7. **Representar**: "Muestra el número N en el [manipulativo]" — el niño manipula hasta llegar al valor pedido.
8. **Identificar**: se muestra un manipulativo con un valor, el niño escribe qué número es.
9. **Descomponer con opciones**: "8 = ___ + ___" con piezas arrastrables predefinidas (correctas + distractores).
10. **Descomponer sin opciones**: "8 = ___ + ___" con entrada libre (el niño escribe los números).
11. **Completar series**: "2, 4, 6, ___, ___" — reconocer y continuar patrones numéricos. Con o sin opciones.
12. **Posicionar en recta**: "Coloca el 7 en la recta" — el niño toca la posición correcta en la recta numérica.

### Motor de ejercicios

13. **Generación procedural**: cada ejercicio se genera algorítmicamente. Nunca se repite el mismo ejercicio consecutivamente. El motor mantiene un historial de ejercicios recientes.
14. **Dificultad adaptable**: un parámetro numérico (1-5) que se traduce a rangos concretos (números más grandes, más opciones, menos pistas). Cambiar la dificultad = cambiar un valor en un mapa de configuración.
15. **Validación pura**: la lógica de validación es TypeScript puro, sin React. Cada tipo de ejercicio tiene su generador y su validador.

### Interacción

16. **Touch + mouse**: Pointer Events API para unificar. Las cuentas del ábaco/rekenrek se deslizan. Las fichas del ten frame y las piezas de respuesta se arrastran. `touch-action: none` en elementos interactivos.
17. **Feedback visual**: banner correcto (verde) / incorrecto (naranja suave, no rojo agresivo) tras comprobar.

---

## Requisitos no funcionales

1. **Tests exhaustivos**: el motor de ejercicios (generadores, validadores, dificultad) debe tener cobertura completa. Los componentes manipulativos deben tener tests de renderizado e interacción.
2. **Componentes reutilizables y configurables**: cada componente debe ser configurable vía props para cubrir el mayor rango de opciones posible. `BeadRow` es la misma primitiva para rekenrek y ábaco.
3. **Diseño mínimo funcional**: Tailwind para layout y espaciado básico. Sin diseño visual pulido en v1 — la capa visual se itera después.
4. **Proyecto independiente**: no depende de Astro ni de ningún otro proyecto. Se arranca con `npm run dev`.
5. **Rendimiento en dispositivos móviles**: SVG para manipulativos (ligero, escalable). Sin librerías pesadas.

---

## Decisiones técnicas

| Decisión | Elección | Razón |
|----------|----------|-------|
| Framework | React 19 | Estado complejo, múltiples componentes interactivos. No necesita SSR → no Next.js |
| Bundler | Vite 6 | Rápido, estándar para React standalone |
| CSS | Tailwind 4 (CSS-first, `@tailwindcss/vite`) | Consistente con otros proyectos. Sin `tailwind.config.ts` |
| Lenguaje | TypeScript 5 | Tipos para interfaces de componentes y engine |
| Tests | Vitest + React Testing Library + jsdom | Integrado con Vite, rápido, estándar |
| Renderizado manipulativos | SVG inline en React | Escalable, interactivo, sin dependencias |
| Touch/mouse | Pointer Events API | Unifica ambos. Soportado en iOS Safari 13+ |
| Drag & drop | Custom con usePointerDrag | Sin librerías externas. Control total sobre el comportamiento |
| Navegación | Estado React en App.tsx | ~10 vistas, no justifica router externo |
| Generación aleatoria | Math.random con utilidades propias | Sin dependencias. Historial para no repetir |
| Routing | No | Cada vista es un estado, no una URL |
| State management | useState / useReducer local | Sin Redux/Zustand. El estado es local a cada vista |
| Dependencias externas | Ninguna más allá de React + Vite + Tailwind | Proyecto ligero, sin recharts/d3/lodash |

---

## Conceptos matemáticos cubiertos por edad

### Infantil (3-6 años) — Dificultad 1-2

| Concepto | Manipulativo principal | Tipo de ejercicio |
|---|---|---|
| Conteo hasta 5 | Rekenrek (1 fila), TenFrame | Representar |
| Conteo hasta 10 | Rekenrek (1-2 filas), TenFrame | Representar, Identificar |
| Subitizing (reconocer cantidades sin contar) | Rekenrek, TenFrame | Identificar |
| Comparación (mayor/menor) | Rekenrek, TenFrame | (futuro) |
| Composición/descomposición hasta 5 | TenFrame | Descomponer |
| Series simples (+1, +2) | — | Series |
| Posición en recta 0-10 | Recta numérica | Posicionar |

### Primaria baja (6-8 años) — Dificultad 3-5

| Concepto | Manipulativo principal | Tipo de ejercicio |
|---|---|---|
| Valor posicional (U, D) | Ábaco | Representar, Identificar |
| Valor posicional (U, D, C) | Ábaco | Representar, Identificar |
| Sumas hasta 20 | Rekenrek (2 filas) | Representar |
| Sumas con decenas | Ábaco | Representar |
| Complementarios del 10 | TenFrame | Descomponer |
| Descomposición de números mayores | — | Descomponer |
| Series con saltos de 5, 10 | — | Series |
| Posición en recta 0-100 | Recta numérica | Posicionar |

---

## Lo que NO incluye v1

- Resta como tipo de ejercicio explícito (los manipulativos sí permiten explorarla en sandbox).
- Multiplicación / división.
- Fracciones / decimales.
- Persistencia de datos (localStorage para progreso).
- Temporizador de sesión (está planteado como idea, no como funcionalidad de v1).
- Gamificación (puntos, estrellas, niveles desbloqueables).
- Adaptación automática de dificultad (el niño o adulto elige el nivel manualmente).
- Sonidos / audio.
- Modo multijugador.
- Internacionalización (todo en español).
