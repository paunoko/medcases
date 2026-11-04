import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StudentView } from './StudentView';
import { Modal } from '../components/common/Modal';
import { AppHeader } from '../components/common/AppHeader';
import { CaseFileDropzone } from '../components/common/CaseFileDropzone';
import { 
    GraduationCap, 
    Presentation, 
    MonitorPlay, 
    PlusCircle, 
    Pencil, 
    ChevronRight, 
    ChevronLeft,
    Activity, 
    ShieldCheck,
    Stethoscope,
    BookOpen,
    Smartphone,
    Sparkles,
    Heart,
    Code2,
    ExternalLink
} from 'lucide-react';

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

const ROLE_STORAGE_KEY = 'medcases_selected_role';

const getInitialRole = (locationStateTab?: unknown): 'student' | 'teacher' => {
    if (locationStateTab === 'student' || locationStateTab === 'teacher') {
        return locationStateTab;
    }
    try {
        const saved = localStorage.getItem(ROLE_STORAGE_KEY);
        if (saved === 'teacher' || saved === 'student') {
            return saved;
        }
    } catch {
        // Fallback for sandboxed environments / restricted storage
    }
    return 'student';
};

export const LandingView = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'student' | 'teacher'>(() => getInitialRole(location.state?.tab));
    const [teacherAction, setTeacherAction] = useState<'menu' | 'present' | 'edit'>('menu');
    const [inSession, setInSession] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [aboutTab, setAboutTab] = useState<'teacher' | 'student' | 'author'>('teacher');

    const handleRoleChange = (tab: 'student' | 'teacher') => {
        setActiveTab(tab);
        setTeacherAction('menu');
        try {
            localStorage.setItem(ROLE_STORAGE_KEY, tab);
        } catch {
            // Ignore storage errors
        }
    };

    useEffect(() => {
        if (location.state?.tab === 'student' || location.state?.tab === 'teacher') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveTab(location.state.tab);
            setTeacherAction('menu');
            try {
                localStorage.setItem(ROLE_STORAGE_KEY, location.state.tab);
            } catch {
                // Ignore storage errors
            }
        }
    }, [location.state]);

    // Close about modal or reset teacher action on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showAbout) {
                    setShowAbout(false);
                } else if (teacherAction !== 'menu') {
                    setTeacherAction('menu');
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showAbout, teacherAction]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/20 to-slate-100/60 flex flex-col relative overflow-hidden">
            {/* Ambient background glow decoration */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[540px] h-[540px] bg-blue-100/35 rounded-full blur-3xl pointer-events-none -z-0" />

            {/* TOP HEADER - Hidden when student is actively in a presentation session */}
            {!inSession && (
                <AppHeader showAboutButton onAboutClick={() => { setAboutTab('teacher'); setShowAbout(true); }} />
            )}

            {/* MAIN CONTENT */}
            <main
                className={`flex-1 flex flex-col items-center w-full relative z-10 ${
                    inSession ? 'justify-center p-4' : 'justify-start pt-8 sm:pt-14 px-4 pb-12'
                }`}
            >
                <div className={`w-full flex flex-col items-center ${inSession ? 'flex-1 justify-center' : 'max-w-md gap-5'}`}>
                    {/* Role Slider - Hidden when student is actively in a presentation session */}
                    {!inSession && (
                        <RoleSlider activeTab={activeTab} onChange={handleRoleChange} />
                    )}

                    {/* Content Section */}
                    <div className={`w-full ${inSession ? 'flex-1 flex flex-col items-center justify-center' : ''}`}>
                        {activeTab === 'student' ? (
                            <StudentView onSessionChange={setInSession} />
                        ) : (
                            <div className="w-full bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/60 border border-gray-100 flex flex-col animate-fade-in transition-all">
                                {/* Back navigation button in top-left */}
                                <div
                                    className={`transition-all duration-300 ease-out overflow-hidden flex items-center justify-between ${
                                        teacherAction !== 'menu' ? 'max-h-10 opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0 pointer-events-none'
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setTeacherAction('menu')}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer group py-0.5"
                                    >
                                        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                                        <span>{t('common.back', { defaultValue: 'Takaisin' })}</span>
                                    </button>
                                </div>

                                {/* 1. Esitä potilastapauksia */}
                                <button
                                    type="button"
                                    disabled={teacherAction === 'present'}
                                    onClick={() => setTeacherAction('present')}
                                    className={`w-full text-left flex items-center justify-between gap-4 transition-all duration-300 ease-out overflow-hidden ${
                                        teacherAction === 'edit'
                                            ? 'max-h-0 opacity-0 mb-0 p-0 border-0 pointer-events-none'
                                            : teacherAction === 'present'
                                            ? 'max-h-36 opacity-100 mb-4 p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/70 shadow-sm cursor-default'
                                            : 'max-h-36 opacity-100 mb-3.5 p-4 rounded-2xl border-2 border-gray-100 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 shadow-sm hover:shadow-md cursor-pointer group'
                                    }`}
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                                            teacherAction === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-100 text-emerald-700 group-hover:scale-105'
                                        }`}>
                                            <MonitorPlay size={26} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-extrabold text-gray-900 text-base leading-snug">
                                                {t('landing.presentCase')}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5 font-medium leading-relaxed">
                                                {t('landing.presentCaseDesc')}
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight
                                        size={20}
                                        className={`text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0 ${
                                            teacherAction === 'present' ? 'opacity-0 w-0 -mr-4' : 'opacity-100'
                                        }`}
                                    />
                                </button>

                                {/* 2. Luo uusi tapaus */}
                                <button
                                    type="button"
                                    disabled={teacherAction !== 'menu'}
                                    onClick={() => navigate('/editor')}
                                    className={`w-full text-left flex items-center justify-between gap-4 transition-all duration-300 ease-out overflow-hidden ${
                                        teacherAction === 'menu'
                                            ? 'max-h-36 opacity-100 mb-3.5 p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-500 bg-white hover:bg-blue-50/40 shadow-sm hover:shadow-md cursor-pointer group'
                                            : 'max-h-0 opacity-0 mb-0 p-0 border-0 pointer-events-none'
                                    }`}
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <PlusCircle size={26} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-extrabold text-gray-900 text-base leading-snug">
                                                {t('landing.createNew')}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5 font-medium leading-relaxed">
                                                {t('landing.createNewDesc')}
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
                                </button>

                                {/* 3. Muokkaa tapausta */}
                                <button
                                    type="button"
                                    disabled={teacherAction === 'edit'}
                                    onClick={() => setTeacherAction('edit')}
                                    className={`w-full text-left flex items-center justify-between gap-4 transition-all duration-300 ease-out overflow-hidden ${
                                        teacherAction === 'present'
                                            ? 'max-h-0 opacity-0 mb-0 p-0 border-0 pointer-events-none'
                                            : teacherAction === 'edit'
                                            ? 'max-h-36 opacity-100 mb-4 p-4 rounded-2xl border-2 border-purple-500 bg-purple-50/70 shadow-sm cursor-default'
                                            : 'max-h-36 opacity-100 mb-0 p-4 rounded-2xl border-2 border-gray-100 hover:border-purple-500 bg-white hover:bg-purple-50/40 shadow-sm hover:shadow-md cursor-pointer group'
                                    }`}
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                                            teacherAction === 'edit' ? 'bg-purple-100 text-purple-700' : 'bg-purple-100 text-purple-700 group-hover:scale-105'
                                        }`}>
                                            <Pencil size={26} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-extrabold text-gray-900 text-base leading-snug">
                                                {t('landing.editExisting')}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5 font-medium leading-relaxed">
                                                {t('landing.editExistingDesc')}
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight
                                        size={20}
                                        className={`text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all shrink-0 ${
                                            teacherAction === 'edit' ? 'opacity-0 w-0 -mr-4' : 'opacity-100'
                                        }`}
                                    />
                                </button>

                                {/* In-place Dropzone Container */}
                                <div
                                    className={`transition-all duration-300 ease-out overflow-hidden ${
                                        teacherAction !== 'menu' ? 'max-h-[500px] opacity-100 mt-1 pointer-events-auto' : 'max-h-0 opacity-0 mt-0 pointer-events-none'
                                    }`}
                                >
                                    <CaseFileDropzone
                                        variant={teacherAction === 'present' ? 'emerald' : 'purple'}
                                        onFileSelected={(file) => {
                                            if (teacherAction === 'present') {
                                                navigate('/teacher', { state: { file } });
                                            } else {
                                                navigate('/editor?mode=edit', { state: { file } });
                                            }
                                        }}
                                    />

                                    {/* Cancel button at the bottom center */}
                                    <div className="mt-3.5 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setTeacherAction('menu')}
                                            className="text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors cursor-pointer py-1"
                                        >
                                            {t('common.cancel', { defaultValue: 'Peruuta' })}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* "MIKÄ MEDCASES ON?" INFO MODAL */}
            <Modal
                isOpen={showAbout}
                onClose={() => setShowAbout(false)}
                maxWidth="2xl"
                position="top"
                showCloseButton
                theme="light"
            >
                <div className="p-6 sm:p-8 max-h-[88vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center gap-3.5 mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/25 shrink-0">
                            <Activity size={26} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                <span>MedCases</span>
                                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">v2.0</span>
                            </h3>
                            <p className="text-xs font-semibold text-gray-500 mt-0.5">{t('landing.aboutSubtitle')}</p>
                        </div>
                    </div>

                    {/* Segmented Tab Bar */}
                    <div className="bg-gray-100/90 p-1 rounded-2xl flex items-center gap-1 mb-6 border border-gray-200/60 select-none">
                        <button
                            type="button"
                            onClick={() => setAboutTab('teacher')}
                            className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                aboutTab === 'teacher'
                                    ? 'bg-white text-purple-700 shadow-sm border border-purple-100'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            <Presentation size={17} className={aboutTab === 'teacher' ? 'text-purple-600' : 'text-gray-400'} />
                            <span>{t('landing.aboutTabTeacher')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setAboutTab('student')}
                            className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                aboutTab === 'student'
                                    ? 'bg-white text-blue-700 shadow-sm border border-blue-100'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            <GraduationCap size={17} className={aboutTab === 'student' ? 'text-blue-600' : 'text-gray-400'} />
                            <span>{t('landing.aboutTabStudent')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setAboutTab('author')}
                            className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                aboutTab === 'author'
                                    ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            <Stethoscope size={17} className={aboutTab === 'author' ? 'text-emerald-600' : 'text-gray-400'} />
                            <span>{t('landing.aboutTabAuthor')}</span>
                        </button>
                    </div>

                    {/* Tab 1: Teacher */}
                    {aboutTab === 'teacher' && (
                        <div className="space-y-4 animate-fade-in text-gray-700 text-sm">
                            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100/90 flex gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-purple-950 text-base mb-1">
                                        {t('landing.aboutTeacherT1')}
                                    </h4>
                                    <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                                        {t('landing.aboutTeacherD1')}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 border border-gray-100 flex gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                                    <MonitorPlay size={20} />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-gray-900 text-base mb-1">
                                        {t('landing.aboutTeacherT2')}
                                    </h4>
                                    <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                                        {t('landing.aboutTeacherD2')}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 border border-gray-100 flex gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-gray-900 text-base mb-1">
                                        {t('landing.aboutTeacherT3')}
                                    </h4>
                                    <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                                        {t('landing.aboutTeacherD3')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Student */}
                    {aboutTab === 'student' && (
                        <div className="space-y-4 animate-fade-in text-gray-700 text-sm">
                            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100/90 flex gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                                    <Smartphone size={20} />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-blue-950 text-base mb-1">
                                        {t('landing.aboutStudentT1')}
                                    </h4>
                                    <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                                        {t('landing.aboutStudentD1')}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 border border-gray-100 flex gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-gray-900 text-base mb-1">
                                        {t('landing.aboutStudentT2')}
                                    </h4>
                                    <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                                        {t('landing.aboutStudentD2')}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 border border-gray-100 flex gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-gray-900 text-base mb-1">
                                        {t('landing.aboutStudentT3')}
                                    </h4>
                                    <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                                        {t('landing.aboutStudentD3')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Author & Freedom */}
                    {aboutTab === 'author' && (
                        <div className="space-y-4 animate-fade-in text-gray-700 text-sm">
                            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100/90 flex gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                                    <Stethoscope size={20} />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-emerald-950 text-base mb-1">
                                        {t('landing.aboutAuthorT1')}
                                    </h4>
                                    <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                                        {t('landing.aboutAuthorD1')}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 border border-gray-100 flex gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                                    <Heart size={20} className="text-rose-600" />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-gray-900 text-base mb-1">
                                        {t('landing.aboutAuthorT2')}
                                    </h4>
                                    <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                                        {t('landing.aboutAuthorD2')}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 border border-gray-100 flex gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                                    <Code2 size={20} />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-gray-900 text-base mb-1">
                                        {t('landing.aboutAuthorT3')}
                                    </h4>
                                    <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                                        {t('landing.aboutAuthorD3')}
                                    </p>
                                </div>
                            </div>

                            {/* GitHub Action Banner */}
                            <div className="pt-2 flex justify-center">
                                <a
                                    href="https://github.com/paunoko/medcases"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-extrabold text-xs sm:text-sm transition-all shadow-md shadow-gray-900/15 active:scale-[0.99] cursor-pointer"
                                >
                                    <Code2 size={18} />
                                    <span>{t('landing.aboutGitHubButton')}</span>
                                    <ExternalLink size={15} className="text-gray-400" />
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Bottom Close */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setShowAbout(false)}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold py-3.5 rounded-xl transition-colors cursor-pointer text-sm"
                        >
                            {t('common.close')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
