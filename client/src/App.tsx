import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UIProvider } from './context/UIContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingView } from './views/LandingView';

const TeacherView = lazy(() => import('./views/TeacherView').then(m => ({ default: m.TeacherView })));
const EditorView = lazy(() => import('./views/EditorView').then(m => ({ default: m.EditorView })));

function App() {
  const { t } = useTranslation();

  const fallback = (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-gray-500 font-bold animate-pulse">
      {t('common.loading', { defaultValue: 'Ladataan...' })}
    </div>
  );

  return (
    <ErrorBoundary>
      <UIProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Suspense fallback={fallback}>
            <Routes>
              <Route path="/" element={<LandingView />} />
              <Route path="/teacher" element={<TeacherView />} />
              <Route path="/editor" element={<EditorView />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </UIProvider>
    </ErrorBoundary>
  );
}

export default App;