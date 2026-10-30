import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
    Eye, 
    EyeOff, 
    PanelRightClose, 
    PanelRightOpen, 
    QrCode,
    ChevronLeft, 
    ChevronRight, 
    Maximize, 
    Minimize, 
    WifiOff, 
    LogOut,
    FolderOpen,
    MonitorPlay
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useUI } from '../context/UIContext';
import { Modal } from '../components/common/Modal';
import { FilePickerView } from '../components/common/FilePickerView';
import { CaseFileDropzone } from '../components/common/CaseFileDropzone';
import { loadCaseFromZip, revokeImageUrls, CaseValidationError } from '../utils/fileHelpers';
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
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }
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
            <FilePickerView
                title={t('landing.presentCase', { defaultValue: 'Esitä potilastapaus' })}
                subtitle={t('landing.presentCaseDesc', { defaultValue: 'Avaa .medcase-tiedosto ja heijasta se valkokankaalle.' })}
                onFileSelected={async (file) => {
                    try {
                        revokeImageUrls(imagesRef.current);
                        const result = await loadCaseFromZip(file);
                        setImages(result.images);
                        setCaseData(result.caseData);
                    } catch (e) {
                        console.error("Load failed", e);
                        const message = e instanceof CaseValidationError
                            ? String(t(`errors.${e.code}`, e.params || { defaultValue: e.message }))
                            : (e instanceof Error ? e.message : t('teacher.uploadFailedMsg'));
                        showAlert({
                            title: t('teacher.uploadFailed'),
                            message,
                            variant: 'destructive'
                        });
                    }
                }}
                onBack={() => navigate('/', { state: { tab: 'teacher' } })}
                variant="emerald"
                badgeIcon={
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
                        <MonitorPlay size={28} />
                    </div>
                }
            />
        );
    }

    return <Dashboard initialCaseData={caseData} initialImages={images} onExit={handleExit} />;
};

// Actual session
const Dashboard = ({ 
    initialCaseData, 
    initialImages, 
    onExit 
}: { 
    initialCaseData: PatientCase; 
    initialImages: Record<string, string>; 
    onExit: () => void; 
}) => {
    const { t } = useTranslation();
    const { showConfirm, showAlert } = useUI();
    const [images, setImages] = useState<Record<string, string>>(initialImages);
    const imagesRef = useRef<Record<string, string>>(initialImages);
    imagesRef.current = images;

    const session = useTeacherSession(initialCaseData);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showQrModal, setShowQrModal] = useState(false);
    const [showSwitchCaseModal, setShowSwitchCaseModal] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

    // Clean up all object URLs when dashboard unmounts
    useEffect(() => {
        return () => {
            revokeImageUrls(imagesRef.current);
        };
    }, []);

    const handleSwitchCaseFile = async (file: File) => {
        try {
            const result = await loadCaseFromZip(file);
            revokeImageUrls(imagesRef.current);
            setImages(result.images);
            imagesRef.current = result.images;
            session.switchCase(result.caseData);
            setShowSwitchCaseModal(false);
        } catch (e) {
            console.error("Load failed", e);
            const message = e instanceof CaseValidationError
                ? String(t(`errors.${e.code}`, e.params || { defaultValue: e.message }))
                : (e instanceof Error ? e.message : t('teacher.uploadFailedMsg'));
            showAlert({
                title: t('teacher.uploadFailed'),
                message,
                variant: 'destructive'
            });
        }
    };

    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
        };
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    };

    // Keyboard navigation (clicker remote support: PageUp/PageDown, Left/Right arrows, Tab for sidebar, Space/Enter for reveal, F for fullscreen)
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
                } else if (showSwitchCaseModal) {
                    setShowSwitchCaseModal(false);
                }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                setIsSidebarOpen(prev => !prev);
            } else if (e.key === ' ' || e.key === 'Enter') {
                if (session.slideState === 'ANSWERING' && session.currentSlide?.type !== 'INFO') {
                    e.preventDefault();
                    if (session.currentSlide?.type === 'OPEN_TEXT') {
                        session.toggleOpenTextReveal();
                    } else {
                        session.revealAnswer();
                    }
                }
            } else if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                toggleFullscreen();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [session, showQrModal, showSwitchCaseModal]);

    return (
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden relative">
            {!session.isConnected && session.roomId && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white text-center py-2 px-4 text-sm font-bold shadow-md flex items-center justify-center gap-2 animate-pulse">
                    <WifiOff size={18} />
                    <span>{t('student.reconnecting')}</span>
                </div>
            )}

            {/* LEFT: Projector (This is what students see) */}
            <div className="flex-1 min-w-0 p-4 flex flex-col min-h-0 relative overflow-hidden">
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

            {/* Top-right floating controls when sidebar is hidden */}
            {!isSidebarOpen && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-gray-900/90 backdrop-blur-md border border-gray-700/80 p-2 rounded-2xl shadow-2xl">
                    {/* Action button: Reveal answer (placed on left so slide navigation position stays constant) */}
                    {session.currentSlide?.type === 'OPEN_TEXT' ? (
                        <button
                            onClick={session.toggleOpenTextReveal}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                                session.isOpenTextRevealed
                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                        >
                            {session.isOpenTextRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                            <span>{session.isOpenTextRevealed ? t('teacher.hideAnswers') : t('teacher.revealAnswersOnly')}</span>
                        </button>
                    ) : session.slideState !== 'REVEALED' && session.currentSlide?.type !== 'INFO' ? (
                        <button
                            onClick={session.revealAnswer}
                            className="bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 rounded-xl font-bold text-xs text-white shadow-md transition-colors cursor-pointer"
                        >
                            {t('teacher.revealAnswer')}
                        </button>
                    ) : session.currentSlide?.type !== 'INFO' ? (
                        <span className="text-xs font-bold text-gray-400 bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-700">
                            {t('teacher.answersVisible')}
                        </span>
                    ) : null}

                    {/* Answers count */}
                    {session.answers.length > 0 && (
                        <span className="text-xs bg-gray-800 border border-gray-700 text-gray-300 font-semibold px-2.5 py-1 rounded-lg">
                            {session.answers.length} {t('teacher.answersCount', { count: session.answers.length }).toLowerCase()}
                        </span>
                    )}

                    {(session.currentSlide?.type !== 'INFO' || session.answers.length > 0) && (
                        <div className="w-px h-6 bg-gray-700 mx-1" />
                    )}

                    {/* Slide Navigation: fixed coordinates relative to right-anchored bar */}
                    <button
                        onClick={session.prevSlide}
                        disabled={session.currentIndex === 0}
                        className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-white transition-colors cursor-pointer"
                        title={t('teacher.prev')}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <span className="text-sm font-bold text-gray-300 min-w-[3.5rem] text-center select-none font-mono">
                        {session.currentIndex + 1} / {session.totalSlides}
                    </span>

                    <button
                        onClick={session.nextSlide}
                        disabled={session.currentIndex === session.totalSlides - 1}
                        className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-white transition-colors cursor-pointer"
                        title={t('teacher.next')}
                    >
                        <ChevronRight size={20} />
                    </button>

                    <div className="w-px h-6 bg-gray-700 mx-1" />

                    {/* Room code & QR trigger */}
                    <button
                        onClick={() => setShowQrModal(true)}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 px-3 py-1.5 rounded-xl text-white transition-all group cursor-pointer"
                        title={t('teacher.roomCode')}
                    >
                        <QrCode size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
                        <span className="font-mono font-bold tracking-wider text-sm">{session.roomId}</span>
                        <span className="flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 font-semibold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {session.studentCount}
                        </span>
                    </button>

                    {/* Fullscreen button */}
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
                        title={isFullscreen ? t('teacher.exitFullscreen') : t('teacher.fullscreen')}
                    >
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </button>

                    {/* Open sidebar button */}
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
                        title={t('teacher.showSidebar')}
                    >
                        <PanelRightOpen size={18} />
                    </button>
                </div>
            )}

            {/* RIGHT: Control Panel (Teacher only) */}
            {isSidebarOpen && (
                <div className="w-80 shrink-0 bg-gray-800 p-6 flex flex-col border-l border-gray-700 z-10 transition-all">

                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs uppercase font-extrabold tracking-widest text-gray-400">{t('teacher.controls')}</span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={toggleFullscreen}
                                className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                                title={isFullscreen ? t('teacher.exitFullscreen') : t('teacher.fullscreen')}
                            >
                                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                            </button>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                                title={t('teacher.hideSidebar')}
                            >
                                <PanelRightClose size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-900/60 p-4 rounded-2xl border border-gray-700/80 mb-6 text-center shadow-inner">
                        <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('teacher.roomCode')}</div>
                        {session.roomId ? (
                            <>
                                <div className="text-5xl font-mono font-bold text-white tracking-widest my-2">{session.roomId}</div>

                                <div className="flex justify-center my-3 bg-white p-2.5 rounded-xl shadow-md w-fit mx-auto cursor-pointer hover:scale-105 transition-transform" onClick={() => setShowQrModal(true)} title={t('teacher.roomCode')}>
                                    <QRCodeSVG value={`${window.location.origin}${import.meta.env.BASE_URL}?room=${session.roomId}`} size={128} />
                                </div>

                                <div className="text-emerald-400 font-bold text-sm">{t('teacher.studentsOnline', { count: session.studentCount })}</div>
                            </>
                        ) : (
                            <div className="py-6 flex flex-col items-center justify-center gap-2.5">
                                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs text-gray-400 font-medium animate-pulse">{t('teacher.openingRoom', { defaultValue: 'Avataan huonetta...' })}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto mb-4">
                        <div className="text-sm font-semibold text-gray-400">
                            {t('teacher.answersCount', { count: session.answers.length })}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-auto">
                        {/* MAIN BUTTON */}
                        {session.currentSlide?.type === 'OPEN_TEXT' ? (
                            <button
                                onClick={session.toggleOpenTextReveal}
                                className={`py-3.5 px-4 rounded-xl font-bold text-base shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer ${
                                    session.isOpenTextRevealed
                                        ? 'bg-gray-700 hover:bg-gray-650 text-gray-200 shadow-gray-950/20'
                                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25'
                                }`}
                            >
                                {session.isOpenTextRevealed ? (
                                    <>
                                        <EyeOff size={20} />
                                        <span>{t('teacher.hideAnswers')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Eye size={20} />
                                        <span>{t('teacher.revealAnswersOnly')}</span>
                                    </>
                                )}
                            </button>
                        ) : session.slideState !== 'REVEALED' && session.currentSlide?.type !== 'INFO' ? (
                            <button
                                onClick={session.revealAnswer}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 px-4 rounded-xl font-bold text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                            >
                                <Eye size={20} />
                                <span>{t('teacher.revealAnswer')}</span>
                            </button>
                        ) : session.currentSlide?.type !== 'INFO' ? (
                            <div className="bg-emerald-600/15 border border-emerald-500/30 text-emerald-300 py-3 px-4 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2">
                                <Eye size={18} />
                                <span>{t('teacher.answersVisible')}</span>
                            </div>
                        ) : null}

                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <button
                                onClick={session.prevSlide}
                                disabled={session.currentIndex === 0}
                                className="py-3 px-3 rounded-xl font-bold text-sm bg-gray-700 hover:bg-gray-650 text-gray-200 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                            >
                                <ChevronLeft size={18} />
                                <span>{t('teacher.prev')}</span>
                            </button>
                            <button
                                onClick={session.nextSlide}
                                disabled={session.currentIndex === session.totalSlides - 1}
                                className="py-3 px-3 rounded-xl font-bold text-sm bg-gray-700 hover:bg-gray-650 text-gray-200 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                            >
                                <span>{t('teacher.next')}</span>
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {session.currentIndex === session.totalSlides - 1 && (
                            <div className="bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 py-2 px-3 rounded-xl text-center text-xs font-bold mt-2 animate-fade-in">
                                {t('teacher.lastSlideHint', { defaultValue: 'Tapauksen viimeinen dia' })}
                            </div>
                        )}

                        {/* Switch case button */}
                        <button
                            type="button"
                            onClick={() => setShowSwitchCaseModal(true)}
                            className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-gray-750 hover:bg-gray-700 text-gray-200 hover:text-white border border-gray-650 transition-all cursor-pointer shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                        >
                            <FolderOpen size={16} className="text-emerald-400" />
                            <span>{t('teacher.switchCase', { defaultValue: 'Vaihda seuraava tapaus' })}</span>
                        </button>

                        <button
                            onClick={async () => {
                                const confirmed = await showConfirm({
                                    title: t('teacher.endSessionTitle'),
                                    message: t('teacher.endSessionMsg'),
                                    confirmText: t('teacher.endSession'),
                                    variant: 'destructive'
                                });
                                if (confirmed) {
                                    if (document.fullscreenElement) {
                                        document.exitFullscreen().catch(() => {});
                                    }
                                    session.endSession();
                                    onExit();
                                }
                            }}
                            className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-100 border border-red-900/50 hover:border-red-700/60 transition-all cursor-pointer shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                        >
                            <LogOut size={16} />
                            <span>{t('teacher.endSession')}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* QR Modal */}
            <Modal
                isOpen={showQrModal}
                onClose={() => setShowQrModal(false)}
                maxWidth="sm"
                showCloseButton
                theme="dark"
            >
                <div className="p-8 text-center">
                    <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">{t('teacher.roomCode')}</div>
                    <div className="text-5xl font-mono font-bold text-white tracking-widest mb-6">{session.roomId}</div>

                    <div className="flex justify-center mb-6 bg-white p-4 rounded-2xl shadow-xl w-fit mx-auto">
                        <QRCodeSVG value={`${window.location.origin}${import.meta.env.BASE_URL}?room=${session.roomId}`} size={200} />
                    </div>

                    <div className="text-emerald-400 font-bold text-lg mb-2">{t('teacher.studentsOnline', { count: session.studentCount })}</div>
                    <p className="text-xs text-gray-400 break-all select-all font-mono bg-gray-950/60 p-2.5 rounded-xl border border-gray-800">
                        {`${window.location.origin}${import.meta.env.BASE_URL}?room=${session.roomId}`}
                    </p>
                </div>
            </Modal>

            {/* Switch Case Modal */}
            <Modal
                isOpen={showSwitchCaseModal}
                onClose={() => setShowSwitchCaseModal(false)}
                maxWidth="md"
                showCloseButton
                theme="dark"
            >
                <div className="p-6 sm:p-7">
                    <div className="flex items-center gap-3.5 mb-5">
                        <div className="w-11 h-11 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                            <FolderOpen size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white leading-tight">
                                {t('teacher.switchCaseTitle', { defaultValue: 'Vaihda esitettävä tapaus' })}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1 font-medium">
                                {t('teacher.switchCaseDesc', { defaultValue: 'Huonekoodi ja liittyneet opiskelijat säilyvät ennallaan.' })}
                            </p>
                        </div>
                    </div>

                    <CaseFileDropzone
                        variant="emerald"
                        onFileSelected={handleSwitchCaseFile}
                    />

                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setShowSwitchCaseModal(false)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
