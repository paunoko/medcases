import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StudentView } from './StudentView';
import { Modal } from '../components/common/Modal';
import { 
    GraduationCap, 
    Presentation, 
    MonitorPlay, 
    PlusCircle, 
    Pencil, 
    ChevronRight, 
    HelpCircle, 
    Activity, 
    ShieldCheck 
} from 'lucide-react';

const LanguageSlider = () => {
    const { i18n } = useTranslation();
    const languages = [
        { code: 'fi', label: 'FI', emoji: '🇫🇮' },
        { code: 'sv', label: 'SV', emoji: '🇸🇪' },
        { code: 'en', label: 'EN', emoji: '🇬🇧' }
    ];

    const currentCode = i18n.language.split('-')[0];
    const currentIndex = languages.findIndex(l => l.code === currentCode);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;

    return (
        <div className="bg-white border border-gray-200 p-1 rounded-full shadow-sm flex items-center relative h-10 min-w-[190px] overflow-hidden">
            <div className="absolute inset-1 z-0">
                <div 
                    className="absolute h-full bg-blue-600 rounded-full transition-all duration-300 ease-out shadow-sm"
                    style={{ 
                        width: `${100 / languages.length}%`,
                        left: `${safeIndex * (100 / languages.length)}%` 
                    }}
                />
            </div>
            
            {languages.map((lang, idx) => (
                <button
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className={`flex-1 relative z-10 h-full flex items-center justify-center gap-1.5 px-2 transition-colors duration-300 rounded-full cursor-pointer select-none ${
                        safeIndex === idx ? 'text-white' : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <span className="text-base">{lang.emoji}</span>
                    <span className="font-bold text-xs tracking-tight">{lang.label}</span>
                </button>
            ))}
        </div>
    );
};

const RoleSlider = ({
    activeTab,
    onChange
}: {
    activeTab: 'student' | 'teacher';
    onChange: (tab: 'student' | 'teacher') => void;
}) => {
    const { t } = useTranslation();

    return (
        <div className="w-full bg-gray-200/80 p-1.5 rounded-2xl flex items-center relative shadow-inner select-none h-14 overflow-hidden">
            {/* Sliding Pill Indicator */}
            <div className="absolute inset-1.5 z-0">
                <div
                    className={`absolute h-full w-1/2 rounded-xl transition-all duration-300 ease-out shadow-md ${
                        activeTab === 'student'
                            ? 'left-0 bg-blue-600 shadow-blue-600/30'
                            : 'left-1/2 bg-purple-600 shadow-purple-600/30'
                    }`}
                />
            </div>

            {/* Student Tab Button */}
            <button
                type="button"
                onClick={() => onChange('student')}
                className={`flex-1 relative z-10 h-full flex items-center justify-center gap-2.5 font-extrabold text-sm sm:text-base transition-colors duration-300 rounded-xl cursor-pointer select-none ${
                    activeTab === 'student' ? 'text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
                <GraduationCap size={20} className={activeTab === 'student' ? 'text-white' : 'text-gray-500'} />
                <span>{t('landing.imStudent')}</span>
            </button>

            {/* Teacher Tab Button */}
            <button
                type="button"
                onClick={() => onChange('teacher')}
                className={`flex-1 relative z-10 h-full flex items-center justify-center gap-2.5 font-extrabold text-sm sm:text-base transition-colors duration-300 rounded-xl cursor-pointer select-none ${
                    activeTab === 'teacher' ? 'text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
                <Presentation size={20} className={activeTab === 'teacher' ? 'text-white' : 'text-gray-500'} />
                <span>{t('landing.imTeacher')}</span>
            </button>
        </div>
    );
};

export const LandingView = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
    const [inSession, setInSession] = useState(false);
    const [showAbout, setShowAbout] = useState(false);

    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
        }
    }, [location.state]);

    // Close about modal on Escape
    useEffect(() => {
        if (!showAbout) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowAbout(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showAbout]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/20 to-slate-100/60 flex flex-col relative overflow-hidden">
            {/* Ambient background glow decoration */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[540px] h-[540px] bg-blue-100/35 rounded-full blur-3xl pointer-events-none -z-0" />

            {/* TOP HEADER - Hidden when student is actively in a presentation session */}
            {!inSession && (
                <header className="w-full bg-white/90 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 z-20 shadow-xs">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                            <Activity size={24} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <h1 className="text-2xl font-black text-blue-950 tracking-tight">MedCases</h1>
                                <span className="hidden md:inline-block text-xs font-semibold text-gray-500 border-l border-gray-200 pl-2">
                                    {t('landing.tagline')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right actions: Info button & Language */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowAbout(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold text-gray-600 hover:text-blue-700 hover:bg-blue-50 border border-gray-200 transition-colors cursor-pointer"
                            title={t('landing.aboutApp')}
                        >
                            <HelpCircle size={18} className="text-blue-600" />
                            <span className="hidden sm:inline">{t('landing.aboutApp')}</span>
                        </button>
                        <LanguageSlider />
                    </div>
                </header>
            )}

            {/* MAIN CONTENT */}
            <main
                className={`flex-1 flex flex-col items-center w-full relative z-10 ${
                    inSession ? 'justify-center p-4' : 'justify-start pt-8 sm:pt-14 px-4 pb-12'
                }`}
            >
                {!inSession ? (
                    <div className="w-full max-w-md flex flex-col items-center gap-5">
                        {/* Role Slider */}
                        <RoleSlider activeTab={activeTab} onChange={setActiveTab} />

                        {/* Content Section */}
                        <div className="w-full">
                            {activeTab === 'student' ? (
                                <StudentView onSessionChange={setInSession} />
                            ) : (
                                <div className="w-full bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/60 border border-gray-100 space-y-3.5 animate-fade-in">
                                    <button
                                        onClick={() => navigate('/teacher')}
                                        className="w-full p-4 rounded-2xl border-2 border-gray-100 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 transition-all text-left flex items-center justify-between gap-4 group cursor-pointer shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                <MonitorPlay size={26} />
                                            </div>
                                            <div>
                                                <div className="font-extrabold text-gray-900 text-base leading-snug">
                                                    {t('landing.presentCase')}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5 font-medium">
                                                    {t('landing.presentCaseDesc')}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
                                    </button>

                                    <button
                                        onClick={() => navigate('/editor')}
                                        className="w-full p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-500 bg-white hover:bg-blue-50/40 transition-all text-left flex items-center justify-between gap-4 group cursor-pointer shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                <PlusCircle size={26} />
                                            </div>
                                            <div>
                                                <div className="font-extrabold text-gray-900 text-base leading-snug">
                                                    {t('landing.createNew')}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5 font-medium">
                                                    {t('landing.createNewDesc')}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
                                    </button>

                                    <button
                                        onClick={() => navigate('/editor?mode=edit')}
                                        className="w-full p-4 rounded-2xl border-2 border-gray-100 hover:border-purple-500 bg-white hover:bg-purple-50/40 transition-all text-left flex items-center justify-between gap-4 group cursor-pointer shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                <Pencil size={26} />
                                            </div>
                                            <div>
                                                <div className="font-extrabold text-gray-900 text-base leading-snug">
                                                    {t('landing.editExisting')}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5 font-medium">
                                                    {t('landing.editExistingDesc')}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all shrink-0" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex-1 flex flex-col items-center justify-center">
                        <StudentView onSessionChange={setInSession} />
                    </div>
                )}
            </main>

            {/* "MIKÄ MEDCASES ON?" INFO MODAL */}
            <Modal
                isOpen={showAbout}
                onClose={() => setShowAbout(false)}
                maxWidth="lg"
                showCloseButton
                theme="light"
            >
                <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                            <Activity size={28} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-blue-950 tracking-tight">MedCases</h3>
                            <p className="text-xs font-semibold text-gray-500">{t('landing.tagline')}</p>
                        </div>
                    </div>

                    <div className="space-y-5 text-gray-700 text-sm leading-relaxed">
                        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                            <div className="flex items-center gap-2 font-bold text-blue-950 mb-1 text-base">
                                <GraduationCap size={20} className="text-blue-600" />
                                <span>{t('landing.aboutStudentTitle')}</span>
                            </div>
                            <p className="text-gray-600">
                                {t('landing.aboutStudentText')}
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
                            <div className="flex items-center gap-2 font-bold text-purple-950 mb-1 text-base">
                                <Presentation size={20} className="text-purple-600" />
                                <span>{t('landing.aboutTeacherTitle')}</span>
                            </div>
                            <p className="text-gray-600">
                                {t('landing.aboutTeacherText')}
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                            <div className="flex items-center gap-2 font-bold text-emerald-950 mb-1 text-base">
                                <ShieldCheck size={20} className="text-emerald-600" />
                                <span>{t('landing.aboutPrivacyTitle')}</span>
                            </div>
                            <p className="text-gray-600">
                                {t('landing.aboutPrivacyText')}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowAbout(false)}
                        className="mt-6 w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-colors cursor-pointer"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </Modal>
        </div>
    );
};
