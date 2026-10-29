import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
    Home, 
    Stethoscope, 
    Eye, 
    EyeOff, 
    PanelRightClose, 
    PanelRightOpen, 
    QrCode, 
    ChevronLeft, 
    ChevronRight, 
    X 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useUI } from '../context/UIContext';
import { loadCaseFromZip, revokeImageUrls } from '../utils/fileHelpers';
import { SlideRenderer } from '../components/SlideRenderer';
import { useTeacherSession, TEACHER_SESSION_KEY } from '../hooks/useTeacherSession';
import type { PatientCase } from '../types';

export const TeacherView = () => {
    const { t } = useTranslation();
    const { showAlert } = useUI();
    const navigate = useNavigate();
    // State for loaded data
    const [caseData, setCaseData] = useState<PatientCase | null>(null);
    const [images, setImages] = useState<Record<string, string>>({});

    const imagesRef = useRef<Record<string, string>>({});
    useEffect(() => {
        imagesRef.current = images;
    }, [images]);

    // Clean up all object URLs when teacher view unmounts
    useEffect(() => {
        return () => {
            revokeImageUrls(imagesRef.current);
        };
    }, []);

    const handleExit = () => {
        try {
            sessionStorage.removeItem(TEACHER_SESSION_KEY);
        } catch {}
        revokeImageUrls(imagesRef.current);
        setImages({});
        setCaseData(null);
    };

    // If no data, show upload screen
    if (!caseData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 relative">
                <button
                    onClick={() => navigate('/', { state: { tab: 'teacher' } })}
                    className="absolute top-4 left-4 bg-white p-2 rounded-full shadow hover:bg-gray-50 text-2xl"
                    title={t('common.home')}
                >
                    <Home size={24} />
                </button>
                <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">{t('teacher.viewTitle')} <Stethoscope size={24} /></h1>
                    <p className="text-gray-500 mb-6">{t('teacher.uploadFile')}</p>

                    <label className="block w-full border-2 border-dashed border-blue-300 rounded-lg p-8 cursor-pointer hover:bg-blue-50 transition-colors">
                        <span className="text-blue-600 font-bold">{t('teacher.selectFile')}</span>
                        <input
                            type="file"
                            className="hidden"
                            accept=".medcase,.zip"
                            onChange={async (e) => {
                                if (e.target.files?.[0]) {
                                    try {
                                        revokeImageUrls(imagesRef.current);
                                        const result = await loadCaseFromZip(e.target.files[0]);
                                        setImages(result.images);
                                        setCaseData(result.caseData);
                                    } catch (e) {
                                        console.error("Load failed", e);
                                        showAlert({
                                            title: t('teacher.uploadFailed'),
                                            message: e instanceof Error ? e.message : t('teacher.uploadFailedMsg'),
                                            variant: 'destructive'
                                        });
                                    }
                                }
                            }}
                        />
                    </label>
                </div>
            </div>
        );
    }

    return <Dashboard caseData={caseData} images={images} onExit={handleExit} />;
};

// Actual session
const Dashboard = ({ caseData, images, onExit }: { caseData: PatientCase, images: Record<string, string>, onExit: () => void }) => {
    const { t } = useTranslation();
    const { showConfirm } = useUI();
    const session = useTeacherSession(caseData);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showQrModal, setShowQrModal] = useState(false);

    // Keyboard navigation (clicker remote support: PageUp/PageDown, Left/Right arrows, Tab for sidebar)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }
            if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                e.preventDefault();
                session.nextSlide();
            } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                e.preventDefault();
                session.prevSlide();
            } else if (e.key === 'Escape') {
                if (showQrModal) {
                    setShowQrModal(false);
                }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                setIsSidebarOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [session, showQrModal]);

    if (!session.roomId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-800 text-white">
                <h1 className="text-4xl font-bold mb-4">{caseData.meta.title}</h1>
                <p className="mb-8 text-gray-300">{t('teacher.slidesReady', { count: caseData.slides.length })}</p>
                {session.error && (
                    <div className="mb-6 bg-red-500/20 border border-red-500 text-red-200 px-6 py-3 rounded-xl max-w-md text-center">
                        {session.error}
                    </div>
                )}
                <button
                    onClick={session.createRoom}
                    className="bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-4 px-10 rounded-full shadow-lg transform transition hover:scale-105"
                >
                    {t('teacher.openRoom')}
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden relative">

            {/* LEFT: Projector (This is what students see) */}
            <div className="flex-1 p-4 flex flex-col min-h-0 relative">
                <div className="flex-1 relative min-h-0">
                    {session.currentSlide && (
                        <SlideRenderer
                            slide={session.currentSlide}
                            imageMap={images}
                            answers={session.answers}
                            isRevealed={session.isCurrentSlideRevealed}
                            onToggleReveal={session.toggleOpenTextReveal}
                        />
                    )}
                </div>
            </div>

            {/* Top-right floating pills when sidebar is hidden */}
            {!isSidebarOpen && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
                    <button
                        onClick={() => setShowQrModal(true)}
                        className="flex items-center gap-2.5 bg-gray-800/90 hover:bg-gray-800 backdrop-blur-md border border-gray-700/80 px-4 py-2 rounded-xl text-white shadow-xl transition-all group cursor-pointer"
                        title={t('teacher.roomCode')}
                    >
                        <QrCode size={18} className="text-blue-400 group-hover:scale-110 transition-transform" />
                        <span className="font-mono font-bold tracking-widest text-lg">{session.roomId}</span>
                        <span className="flex items-center gap-1.5 text-xs bg-green-500/20 text-green-300 font-semibold px-2 py-0.5 rounded-full border border-green-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            {session.studentCount}
                        </span>
                    </button>

                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="flex items-center gap-2 bg-gray-800/90 hover:bg-gray-800 backdrop-blur-md border border-gray-700/80 px-4 py-2 rounded-xl text-white shadow-xl transition-all cursor-pointer"
                        title={t('teacher.showSidebar')}
                    >
                        <PanelRightOpen size={18} />
                        <span className="text-sm font-semibold">{t('teacher.controls')}</span>
                    </button>
                </div>
            )}

            {/* Bottom floating control bar when sidebar is hidden */}
            {!isSidebarOpen && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-gray-900/90 backdrop-blur-md border border-gray-700/80 px-5 py-3 rounded-2xl shadow-2xl">
                    <button
                        onClick={session.prevSlide}
                        disabled={session.currentIndex === 0}
                        className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
                        title={t('teacher.prev')}
                    >
                        <ChevronLeft size={22} />
                    </button>

                    <span className="text-sm font-bold text-gray-300 px-2 select-none font-mono">
                        {session.currentIndex + 1} / {session.totalSlides}
                    </span>

                    <button
                        onClick={session.nextSlide}
                        disabled={session.currentIndex === session.totalSlides - 1}
                        className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
                        title={t('teacher.next')}
                    >
                        <ChevronRight size={22} />
                    </button>

                    {session.currentSlide?.type === 'OPEN_TEXT' ? (
                        <button
                            onClick={session.toggleOpenTextReveal}
                            className={`px-4 py-2 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition-colors cursor-pointer ${
                                session.isOpenTextRevealed
                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                        >
                            {session.isOpenTextRevealed ? <EyeOff size={18} /> : <Eye size={18} />}
                            <span>{session.isOpenTextRevealed ? t('teacher.hideAnswers') : t('teacher.revealAnswersOnly')}</span>
                        </button>
                    ) : session.slideState !== 'REVEALED' && session.currentSlide?.type !== 'INFO' ? (
                        <button
                            onClick={session.revealAnswer}
                            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl font-bold text-sm text-white shadow-md transition-colors cursor-pointer"
                        >
                            {t('teacher.revealAnswer')}
                        </button>
                    ) : session.currentSlide?.type !== 'INFO' ? (
                        <span className="text-xs font-bold text-gray-400 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
                            {t('teacher.answersVisible')}
                        </span>
                    ) : null}

                    {session.answers.length > 0 && (
                        <span className="text-xs bg-gray-800 border border-gray-700 text-gray-300 font-semibold px-3 py-1.5 rounded-xl">
                            {t('teacher.answersCount', { count: session.answers.length })}
                        </span>
                    )}
                </div>
            )}

            {/* RIGHT: Control Panel (Teacher only) */}
            {isSidebarOpen && (
                <div className="w-80 bg-gray-800 p-6 flex flex-col border-l border-gray-700 z-10 transition-all">

                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs uppercase font-extrabold tracking-widest text-gray-400">{t('teacher.controls')}</span>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                            title={t('teacher.hideSidebar')}
                        >
                            <PanelRightClose size={20} />
                        </button>
                    </div>

                    <div className="bg-gray-700 p-4 rounded-lg mb-6 text-center">
                        <div className="text-sm text-gray-400 uppercase font-bold">{t('teacher.roomCode')}</div>
                        <div className="text-5xl font-mono font-bold text-white tracking-widest my-2">{session.roomId}</div>

                        <div className="flex justify-center my-4 bg-white p-2 rounded w-fit mx-auto cursor-pointer" onClick={() => setShowQrModal(true)} title={t('teacher.roomCode')}>
                            <QRCodeSVG value={`${window.location.origin}${import.meta.env.BASE_URL}?room=${session.roomId}`} size={128} />
                        </div>

                        <div className="text-green-400 font-bold">{t('teacher.studentsOnline', { count: session.studentCount })}</div>
                    </div>

                    <div className="flex-1 overflow-y-auto mb-4">
                        <div className="text-sm text-gray-400">
                            {t('teacher.answersCount', { count: session.answers.length })}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-auto">
                        {/* MAIN BUTTON */}
                        {session.currentSlide?.type === 'OPEN_TEXT' ? (
                            <button
                                onClick={session.toggleOpenTextReveal}
                                className={`py-4 rounded font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                                    session.isOpenTextRevealed
                                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                                }`}
                            >
                                {session.isOpenTextRevealed ? (
                                    <>
                                        <EyeOff size={22} />
                                        {t('teacher.hideAnswers')}
                                    </>
                                ) : (
                                    <>
                                        <Eye size={22} />
                                        {t('teacher.revealAnswersOnly')}
                                    </>
                                )}
                            </button>
                        ) : session.slideState !== 'REVEALED' && session.currentSlide?.type !== 'INFO' ? (
                            <button
                                onClick={session.revealAnswer}
                                className="bg-blue-600 hover:bg-blue-500 py-4 rounded font-bold text-lg shadow-lg cursor-pointer"
                            >
                                {t('teacher.revealAnswer')}
                            </button>
                        ) : session.currentSlide?.type !== 'INFO' ? (
                            <div className="bg-gray-700 py-4 rounded text-center text-gray-400 font-bold">
                                {t('teacher.answersVisible')}
                            </div>
                        ) : null}

                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={session.prevSlide}
                                disabled={session.currentIndex === 0}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded disabled:opacity-50 cursor-pointer"
                            >
                                {t('teacher.prev')}
                            </button>
                            <button
                                onClick={session.nextSlide}
                                disabled={session.currentIndex === session.totalSlides - 1}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded disabled:opacity-50 cursor-pointer"
                            >
                                {t('teacher.next')}
                            </button>
                        </div>

                        <button
                            onClick={async () => {
                                const confirmed = await showConfirm({
                                    title: t('teacher.endSessionTitle'),
                                    message: t('teacher.endSessionMsg'),
                                    confirmText: t('teacher.endSession'),
                                    variant: 'destructive'
                                });
                                if (confirmed) {
                                    session.endSession();
                                    onExit();
                                }
                            }}
                            className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 py-3 rounded mt-6 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            {t('teacher.endSession')}
                        </button>
                    </div>
                </div>
            )}

            {/* QR Modal */}
            {showQrModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowQrModal(false)}
                >
                    <div
                        className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowQrModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                            title={t('common.close')}
                        >
                            <X size={20} />
                        </button>

                        <div className="text-sm text-gray-400 uppercase font-bold tracking-wider mb-1">{t('teacher.roomCode')}</div>
                        <div className="text-5xl font-mono font-bold text-white tracking-widest mb-6">{session.roomId}</div>

                        <div className="flex justify-center mb-6 bg-white p-4 rounded-xl shadow-lg w-fit mx-auto">
                            <QRCodeSVG value={`${window.location.origin}${import.meta.env.BASE_URL}?room=${session.roomId}`} size={200} />
                        </div>

                        <div className="text-green-400 font-bold text-lg mb-2">{t('teacher.studentsOnline', { count: session.studentCount })}</div>
                        <p className="text-xs text-gray-400 break-all">{`${window.location.origin}${import.meta.env.BASE_URL}?room=${session.roomId}`}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
