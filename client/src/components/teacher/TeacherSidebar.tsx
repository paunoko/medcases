import React from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { 
    ChevronLeft, 
    ChevronRight, 
    Maximize, 
    Minimize, 
    LogOut, 
    FolderOpen, 
    Eye, 
    EyeOff, 
    PanelRightClose 
} from 'lucide-react';
import { useUI } from '../../context/UIContext';
import type { useTeacherSession } from '../../hooks/useTeacherSession';

interface TeacherSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    session: ReturnType<typeof useTeacherSession>;
    onOpenQrModal: () => void;
    onOpenSwitchCaseModal: () => void;
    onExit: () => void;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
    isOpen,
    onClose,
    isFullscreen,
    onToggleFullscreen,
    session,
    onOpenQrModal,
    onOpenSwitchCaseModal,
    onExit
}) => {
    const { t } = useTranslation();
    const { showConfirm } = useUI();

    if (!isOpen) return null;

    return (
        <aside className="w-80 bg-gray-800 border-l border-gray-700/80 p-6 flex flex-col justify-between shrink-0 z-30 shadow-2xl animate-fade-in">
            {/* Header & Controls */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400">
                        {t('teacher.controls')}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={onToggleFullscreen}
                            className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                            title={isFullscreen ? t('teacher.exitFullscreen') : t('teacher.fullscreen')}
                        >
                            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                            title={t('teacher.hideSidebar')}
                        >
                            <PanelRightClose size={20} />
                        </button>
                    </div>
                </div>

                {/* Room Code Card */}
                <div className="bg-gray-900/60 p-4 rounded-2xl border border-gray-700/80 mb-6 text-center shadow-inner">
                    <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('teacher.roomCode')}</div>
                    {session.roomId ? (
                        <>
                            <div className="text-5xl font-mono font-bold text-white tracking-widest my-2">{session.roomId}</div>

                            <div 
                                className="flex justify-center my-3 bg-white p-2.5 rounded-xl shadow-md w-fit mx-auto cursor-pointer hover:scale-105 transition-transform" 
                                onClick={onOpenQrModal} 
                                title={t('teacher.roomCode')}
                            >
                                <QRCodeSVG value={`${window.location.origin}${import.meta.env.BASE_URL}?room=${session.roomId}`} size={128} />
                            </div>

                            <div className="text-emerald-400 font-bold text-sm">
                                {t('teacher.studentsOnline', { count: session.studentCount })}
                            </div>
                        </>
                    ) : (
                        <div className="py-6 flex flex-col items-center justify-center gap-2.5">
                            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-gray-400 font-medium animate-pulse">
                                {t('teacher.openingRoom', { defaultValue: 'Avataan huonetta...' })}
                            </span>
                        </div>
                    )}
                </div>

                {/* Answers Count */}
                <div className="overflow-y-auto mb-4">
                    <div className="text-sm font-semibold text-gray-400">
                        {t('teacher.answersCount', { count: session.answers.length })}
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col gap-3 mt-auto">
                {/* Reveal Answer Button */}
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

                {/* Slide Navigation (Prev / Next) */}
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

                {/* Switch Case Button */}
                <button
                    type="button"
                    onClick={onOpenSwitchCaseModal}
                    className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-gray-750 hover:bg-gray-700 text-gray-200 hover:text-white border border-gray-650 transition-all cursor-pointer shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                >
                    <FolderOpen size={16} className="text-emerald-400" />
                    <span>{t('teacher.selectNextCase', { defaultValue: 'Valitse seuraava potilastapaus' })}</span>
                </button>

                {/* End Session Button */}
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
        </aside>
    );
};
