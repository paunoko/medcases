import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
    Eye, 
    EyeOff, 
    PanelRightOpen, 
    QrCode,
    ChevronLeft, 
    ChevronRight, 
    Maximize, 
    Minimize, 
    WifiOff, 
    FolderOpen
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useUI } from '../context/UIContext';
import { Modal } from '../components/common/Modal';
import { FilePickerView } from '../components/common/FilePickerView';
import { CaseFileDropzone } from '../components/common/CaseFileDropzone';
import { TeacherSidebar } from '../components/teacher/TeacherSidebar';
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
        } catch {
            /* ignore storage error */
        }
        revokeImageUrls(imagesRef.current);
        setImages({});
        setCaseData(null);
        navigate('/', { state: { tab: 'teacher' } });
    };

    // If no data, show upload screen
    if (!caseData) {
        return (
            <FilePickerView
                title={t('teacher.selectFirstCase', { defaultValue: 'Valitse ensimmäinen potilastapaus' })}
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
    const { showAlert } = useUI();
    const [images, setImages] = useState<Record<string, string>>(initialImages);
    const imagesRef = useRef<Record<string, string>>(initialImages);
    useEffect(() => {
        imagesRef.current = images;
    }, [images]);

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
            <TeacherSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
                session={session}
                onOpenQrModal={() => setShowQrModal(true)}
                onOpenSwitchCaseModal={() => setShowSwitchCaseModal(true)}
                onExit={onExit}
            />

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
                                {t('teacher.selectNextCase', { defaultValue: 'Valitse seuraava potilastapaus' })}
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
