import { useState } from 'react';
import AbacusTutorial from './components/tutorial/AbacusTutorial';
import ActivitiesPage from './components/layout/ActivitiesPage';
import DevPage from './components/layout/DevPage';
import Home from './components/layout/Home';
import SandboxPage from './components/layout/SandboxPage';
import SessionPage from './components/layout/SessionPage';
import { EXERCISE_LABELS, MANIPULATIVE_EXERCISES, MANIPULATIVE_LABELS } from './components/layout/catalog';
import type { Page } from './components/layout/types';

/** `?dev` abre el selector libre de ejercicios en vez de la navegación real. */
function isDevMode(): boolean {
  return new URLSearchParams(window.location.search).has('dev');
}

/**
 * App — navegación por estado React (sin router ni URLs).
 * Home → sandbox / actividades / tutorial → sesión de ejercicios → vuelta.
 */
export default function App() {
  const [page, setPage] = useState<Page>({ type: 'home' });
  const [dev] = useState(isDevMode);

  const goHome = () => setPage({ type: 'home' });

  let content: React.JSX.Element;
  if (dev) {
    content = <DevPage />;
  } else {
    switch (page.type) {
      case 'home':
        content = <Home onNavigate={setPage} />;
        break;
      case 'sandbox':
        content = <SandboxPage manipulative={page.manipulative} onBack={goHome} />;
        break;
      case 'activities':
        content = (
          <ActivitiesPage
            title={`${MANIPULATIVE_LABELS[page.manipulative]} — Actividades`}
            exerciseTypes={MANIPULATIVE_EXERCISES[page.manipulative]}
            manipulative={page.manipulative}
            onStart={(config) => setPage({ type: 'activity-session', config, backTo: page })}
            onBack={goHome}
          />
        );
        break;
      case 'exercise-setup':
        content = (
          <ActivitiesPage
            title={EXERCISE_LABELS[page.exerciseType]}
            exerciseTypes={[page.exerciseType]}
            onStart={(config) => setPage({ type: 'activity-session', config, backTo: page })}
            onBack={goHome}
          />
        );
        break;
      case 'activity-session':
        content = <SessionPage config={page.config} onBack={() => setPage(page.backTo)} />;
        break;
      case 'tutorial-abacus':
        content = <AbacusTutorial onComplete={goHome} onBack={goHome} />;
        break;
    }
  }

  return <main className="mx-auto max-w-3xl p-4">{content}</main>;
}
