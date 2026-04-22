import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UIProvider } from './context/UIContext';
import { EditorView, TeacherView, LandingView } from './views';

function App() {
  const { t } = useTranslation();

  return (
    <UIProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<LandingView />} />
        <Route path="/teacher" element={<TeacherView />} />
        <Route path="/editor" element={<EditorView />} />

        {/* Dev Menu: Facilitates testing */}
        <Route path="/menu" element={
          <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-gray-50">
            <h1 className="text-4xl font-bold text-gray-800">MedCases Dev Menu</h1>
            <Link to="/" className="px-8 py-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 w-64 text-center">{t('landing.imStudent')}</Link>
            <Link to="/teacher" className="px-8 py-4 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 w-64 text-center">{t('landing.imTeacher')}</Link>
            <Link to="/editor" className="px-8 py-4 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-900 w-64 text-center">{t('common.edit') + ' (Editor)'}</Link>
          </div>
        } />
      </Routes>
      </BrowserRouter>
    </UIProvider>
  );
}

export default App;