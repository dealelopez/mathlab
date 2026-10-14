# 15 — Home, navegación y ensamblaje

## Objetivo

Crear la pantalla principal, la navegación entre vistas, y conectar todos los componentes en una app completa y funcional. Al terminar, la app es usable de punta a punta: desde el Home se accede a cada manipulativo en modo sandbox o actividades guiadas, se completan sesiones de ejercicios, y se vuelve al inicio.

---

## Contexto

- Depende de: TODAS las tareas anteriores (01-14).
- Esta tarea no crea lógica nueva — ensambla todo lo construido.
- La navegación es por estado React en App.tsx. No hay router ni URLs.
- Las vistas son ~12: home, 4 sandboxes (uno por manipulativo), 4 páginas de actividades (una por manipulativo/tipo), tutorial del ábaco, y posiblemente una vista de selección de ejercicio por manipulativo.

---

## Archivos a crear/modificar

### src/App.tsx — Navegación por estado

**Estado de navegación:**

```ts
type Page =
  | { type: 'home' }
  | { type: 'sandbox'; manipulative: Manipulative }
  | { type: 'activities'; manipulative: Manipulative }
  | { type: 'activity-session'; config: ActivityConfig }
  | { type: 'tutorial-abacus' };

interface ActivityConfig {
  exerciseType: ExerciseType;
  difficulty: DifficultyLevel;
  manipulative?: Manipulative;
  answerMode: AnswerMode;
}
```

**Implementación:**

```tsx
export default function App() {
  const [page, setPage] = useState<Page>({ type: 'home' });

  const navigate = (newPage: Page) => setPage(newPage);
  const goHome = () => setPage({ type: 'home' });

  switch (page.type) {
    case 'home':
      return <Home onNavigate={navigate} />;
    case 'sandbox':
      return <SandboxPage manipulative={page.manipulative} onBack={goHome} />;
    case 'activities':
      return <ActivitiesPage manipulative={page.manipulative} onNavigate={navigate} onBack={goHome} />;
    case 'activity-session':
      return <ExerciseRunner {...page.config} onBack={() =>
        page.config.manipulative
          ? navigate({ type: 'activities', manipulative: page.config.manipulative })
          : goHome()
      } />;
    case 'tutorial-abacus':
      return <AbacusTutorial onComplete={goHome} onBack={goHome} />;
  }
}
```

---

### src/components/layout/Home.tsx

Pantalla principal con acceso a cada manipulativo.

**Props:**

```ts
interface HomeProps {
  onNavigate: (page: Page) => void;
}
```

**Layout:**

```
┌───────────────────────────────────────────────┐
│  🧮 Mathlab                                    │
│                                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │Rekenrek │  │  Ábaco  │  │Ten Frame│      │
│  │[Sandbox]│  │[Sandbox]│  │[Sandbox]│      │
│  │[Activ.] │  │[Activ.] │  │[Activ.] │      │
│  │         │  │[Tutorial]│  │         │      │
│  └─────────┘  └─────────┘  └─────────┘      │
│                                               │
│  ┌─────────┐                                  │
│  │  Recta  │                                  │
│  │numérica │                                  │
│  │[Sandbox]│                                  │
│  │[Activ.] │                                  │
│  └─────────┘                                  │
└───────────────────────────────────────────────┘
```

- Grid de tarjetas, una por manipulativo.
- Cada tarjeta tiene: nombre, y botones/links a "Sandbox" y "Actividades".
- El ábaco tiene además un botón "Tutorial".
- Diseño mínimo: tarjetas con borde, padding, botones simples. Sin iconos elaborados.

---

### src/components/layout/SandboxPage.tsx

Página de exploración libre de un manipulativo.

**Props:**

```ts
interface SandboxPageProps {
  manipulative: Manipulative;
  onBack: () => void;
}
```

**Contenido:**

- Barra superior: botón "← Volver" + título "Rekenrek — Exploración libre" (o similar).
- El manipulativo renderizado con estado local, interactivo.
- Controles de configuración debajo o al lado:
  - Rekenrek: selector de filas (1, 2, 5, 10).
  - Ábaco: selector de columnas (solo U, D+U, C+D+U).
  - TenFrame: selector de marcos (1, 2).
  - NumberLine: selector de rango (0-10, 0-20, 0-50, 0-100).
- Botón "Resetear" para volver al valor 0.
- El niño experimenta libremente sin validación ni feedback.

---

### src/components/layout/ActivitiesPage.tsx

Página de selección de actividad para un manipulativo.

**Props:**

```ts
interface ActivitiesPageProps {
  manipulative: Manipulative;
  onNavigate: (page: Page) => void;
  onBack: () => void;
}
```

**Contenido:**

- Barra superior: "← Volver" + título "Rekenrek — Actividades".
- Selectores:
  - **Tipo de ejercicio**: Representar, Identificar. (Decompose y Series no dependen de manipulativo, pero pueden estar accesibles globalmente).
  - **Dificultad**: 1-5 (botones o slider).
  - **Modo de respuesta**: drag / free (solo para decompose y series).
- Botón "Empezar" → navega a `activity-session` con la config seleccionada.

Para ejercicios que no dependen de manipulativo (decompose, series), podrían estar en el Home como categorías separadas, o accesibles desde cualquier ActivitiesPage. Decisión de diseño:
- **Opción A**: Decompose y Series como tarjetas separadas en Home (al mismo nivel que los manipulativos).
- **Opción B**: Dentro de cada manipulativo (pero no tiene mucho sentido para series que no usan manipulativo).
- **Recomendación: Opción A**. Home tiene 4 manipulativos + 2 tipos de ejercicio adicionales:

```
Home:
├── Manipulativos
│   ├── Rekenrek (sandbox + actividades: representar, identificar)
│   ├── Ábaco (sandbox + tutorial + actividades: representar, identificar)
│   ├── Ten Frame (sandbox + actividades: representar, identificar)
│   └── Recta numérica (sandbox + actividades: identificar, posicionar)
└── Ejercicios
    ├── Descomposición (actividades: drag / free)
    └── Series (actividades: drag / free)
```

---

### src/components/layout/Navigation.tsx

Barra de navegación reutilizable.

**Props:**

```ts
interface NavigationProps {
  title: string;
  onBack: () => void;
}
```

**Renderizado:**

- Botón "← Volver" a la izquierda.
- Título centrado (o a la derecha del botón).
- Diseño mínimo: una barra horizontal con padding.

---

## Flujo de navegación completo

```
Home
 ├── Rekenrek
 │    ├── Sandbox → RekenrekSandbox (exploración libre con controles)
 │    └── Actividades → Selectores → ExerciseRunner (represent/identify)
 ├── Ábaco
 │    ├── Tutorial → AbacusTutorial (7 pasos)
 │    ├── Sandbox → AbacusSandbox
 │    └── Actividades → Selectores → ExerciseRunner
 ├── Ten Frame
 │    ├── Sandbox → TenFrameSandbox
 │    └── Actividades → Selectores → ExerciseRunner
 ├── Recta numérica
 │    ├── Sandbox → NumberLineSandbox
 │    └── Actividades → Selectores → ExerciseRunner (identificar, posicionar)
 ├── Descomposición
 │    └── Selectores (dificultad + modo) → ExerciseRunner (decompose)
 └── Series
      └── Selectores (dificultad + modo) → ExerciseRunner (series)
```

---

## Tests

### tests/components/Navigation.test.tsx

```
- "← Volver" visible
- Click en "← Volver" llama onBack
- Título visible
```

### tests/App.test.tsx

```
- Home se muestra al iniciar
- Click en "Rekenrek Sandbox" → sandbox del rekenrek visible
- "← Volver" desde sandbox → vuelve a Home
- Click en "Ábaco Tutorial" → tutorial visible
- Click en "Rekenrek Actividades" → página de selección visible
- Click en "Empezar" → ExerciseRunner visible con ejercicio generado
- Completar sesión (o volver) → vuelve a actividades o Home
```

---

## Criterio de éxito

- [ ] Home muestra tarjetas para los 4 manipulativos + 2 tipos de ejercicio
- [ ] Navegación funciona en todas las direcciones (home → detalle → back)
- [ ] Sandbox de cada manipulativo: manipulativo interactivo con controles de configuración
- [ ] Actividades de cada manipulativo: selectores → ExerciseRunner → sesión completa
- [ ] Tutorial del ábaco accesible desde Home y completable
- [ ] Descomposición y Series accesibles como ejercicios independientes
- [ ] Flujo completo end-to-end funciona: Home → elegir → practicar → volver
- [ ] Todos los tests pasan
- [ ] La app es usable en móvil (responsive básico)
