import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StudentView } from './StudentView';
import { GraduationCap, Stethoscope, MonitorPlay, Sparkles, Pencil } from 'lucide-react';

const LanguageSlider = () => {
    const { i18n } = useTranslation();
    const languages = [
        { code: 'fi', label: 'FI', emoji: '🇫🇮' },
        { code: 'sv', label: 'SV', emoji: '🇸🇪' },
        { code: 'en', label: 'EN', emoji: '🇬🇧' }
    ];

    // Get current language index, defaulting to FI if not found
    const currentCode = i18n.language.split('-')[0];
    const currentIndex = languages.findIndex(l => l.code === currentCode);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;

    return (
        <div className="fixed top-4 right-4 z-[100] bg-white border border-gray-200 p-1.5 rounded-full shadow-lg flex items-center relative h-12 min-w-[210px] overflow-hidden">
            {/* Sliding background indicator container */}
            <div className="absolute inset-1.5 z-0">
                <div 
                    className="absolute h-full bg-blue-600 rounded-full transition-all duration-300 ease-out shadow-sm"
                    style={{ 
                        width: `${100/languages.length}%`,
                        left: `${safeIndex * (100/languages.length)}%` 
                    }}
                />
            </div>
            
            {languages.map((lang, idx) => (
                <button
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className={`flex-1 relative z-10 h-full flex items-center justify-center gap-2 px-2 transition-colors duration-300 rounded-full ${
                        safeIndex === idx ? 'text-white' : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <span className="text-xl">{lang.emoji}</span>
                    <span className="font-bold text-sm tracking-tight">{lang.label}</span>
                </button>
            ))}
        </div>
    );
};

export const LandingView = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
    const [inSession, setInSession] = useState(false);

    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
        }
    }, [location.state]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            <LanguageSlider />

            {/* Tabs - Hidden if student is in session */}
            {!inSession && (
                <div className="flex space-x-4 mt-8 mb-4 z-10">
                    <button
                        onClick={() => setActiveTab('student')}
                        className={`px-6 py-3 rounded-full font-bold text-lg transition-all ${activeTab === 'student'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <span className="flex items-center gap-2">{t('landing.imStudent')} <GraduationCap size={24} /></span>
                    </button>
                    <button
                        onClick={() => setActiveTab('teacher')}
                        className={`px-6 py-3 rounded-full font-bold text-lg transition-all ${activeTab === 'teacher'
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <span className="flex items-center gap-2">{t('landing.imTeacher')} <Stethoscope size={24} /></span>
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="w-full flex-1 flex flex-col items-center">
                {activeTab === 'student' ? (
                    <div className="w-full flex-1">
                        <StudentView onSessionChange={setInSession} />
                    </div>
                ) : (
                    <div className="w-full max-w-md p-4 mt-8">
                        <div className="bg-white p-8 rounded-xl shadow-xl space-y-4">
                            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">{t('landing.teacherActions')}</h2>

                            <button
                                onClick={() => navigate('/teacher')}
                                className="w-full p-4 bg-green-100 text-green-800 rounded-lg font-bold text-lg hover:bg-green-200 transition-colors text-left flex items-center gap-3"
                            >
                                <MonitorPlay size={28} /> {t('landing.presentCase')}
                            </button>

                            <button
                                onClick={() => navigate('/editor')}
                                className="w-full p-4 bg-blue-100 text-blue-800 rounded-lg font-bold text-lg hover:bg-blue-200 transition-colors text-left flex items-center gap-3"
                            >
                                <Sparkles size={28} /> {t('landing.createNew')}
                            </button>

                            <button
                                onClick={() => navigate('/editor?mode=edit')}
                                className="w-full p-4 bg-yellow-100 text-yellow-800 rounded-lg font-bold text-lg hover:bg-yellow-200 transition-colors text-left flex items-center gap-3"
                            >
                                <Pencil size={28} /> {t('landing.editExisting')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
