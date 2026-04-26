import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Stethoscope } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useUI } from '../context/UIContext';
import { loadCaseFromZip } from '../utils/fileHelpers';
import { SlideRenderer } from '../components/SlideRenderer';
import { useTeacherSession } from '../hooks/useTeacherSession';
import type { PatientCase } from '../types';

export const TeacherView = () => {
    const { t } = useTranslation();
    const { showAlert } = useUI();
    const navigate = useNavigate();
    // State for loaded data
    const [caseData, setCaseData] = useState<PatientCase | null>(null);
    const [images, setImages] = useState<Record<string, string>>({});

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
                                        const result = await loadCaseFromZip(e.target.files[0]);
                                        setImages(result.images);
                                        setCaseData(result.caseData);
                                    } catch (err) {
                                        showAlert({
                                            title: t('teacher.uploadFailed'),
                                            message: t('teacher.uploadFailedMsg'),
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

    return <Dashboard caseData={caseData} images={images} onExit={() => setCaseData(null)} />;
};

// Actual session
const Dashboard = ({ caseData, images, onExit }: { caseData: PatientCase, images: Record<string, string>, onExit: () => void }) => {
    const { t } = useTranslation();
    const { showConfirm } = useUI();
    const session = useTeacherSession(caseData);

    if (!session.roomId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-800 text-white">
                <h1 className="text-4xl font-bold mb-4">{caseData.meta.title}</h1>
                <p className="mb-8 text-gray-300">{t('teacher.slidesReady', { count: caseData.slides.length })}</p>
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
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden">

            {/* LEFT: Projector (This is what students see) */}
            <div className="flex-1 p-4 flex flex-col min-h-0">
                <div className="flex-1 relative min-h-0">
                    {session.currentSlide && (
                        <SlideRenderer
                            slide={session.currentSlide}
                            imageMap={images}
                            answers={session.answers}
                            isRevealed={session.slideState === 'REVEALED'}
                        />
                    )}
                </div>
            </div>

            {/* RIGHT: Control Panel (Teacher only) */}
            <div className="w-80 bg-gray-800 p-6 flex flex-col border-l border-gray-700">

                <div className="bg-gray-700 p-4 rounded-lg mb-6 text-center">
                    <div className="text-sm text-gray-400 uppercase font-bold">{t('teacher.roomCode')}</div>
                    <div className="text-5xl font-mono font-bold text-white tracking-widest my-2">{session.roomId}</div>

                    <div className="flex justify-center my-4 bg-white p-2 rounded w-fit mx-auto">
                        <QRCodeSVG value={`${window.location.origin}${import.meta.env.BASE_URL}?room=${session.roomId}`} size={128} />
                    </div>

                    <div className="text-green-400 font-bold">{t('teacher.studentsOnline', { count: session.studentCount })}</div>
                </div>

                <div className="flex-1 overflow-y-auto mb-4">
                    {/* Teacher notes */}
                    {session.currentSlide?.teacherNotes && (
                        <div className="bg-yellow-900/50 border border-yellow-600 p-3 rounded text-yellow-100 text-sm mb-4">
                            <strong>Note:</strong> {session.currentSlide.teacherNotes}
                        </div>
                    )}

                    <div className="text-sm text-gray-400">
                        {t('teacher.answersCount', { count: session.answers.length })}
                    </div>
                </div>

                <div className="flex flex-col gap-3 mt-auto">
                    {/* MAIN BUTTON */}
                    {session.slideState !== 'REVEALED' && session.currentSlide?.type !== 'INFO' ? (
                        <button
                            onClick={session.revealAnswer}
                            className="bg-blue-600 hover:bg-blue-500 py-4 rounded font-bold text-lg shadow-lg"
                        >
                            {session.currentSlide?.type === 'OPEN_TEXT' ? t('teacher.revealAnswersOnly') : t('teacher.revealAnswer')}
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
                            className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded disabled:opacity-50"
                        >
                            {t('teacher.prev')}
                        </button>
                        <button
                            onClick={session.nextSlide}
                            disabled={session.currentIndex === session.totalSlides - 1}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded disabled:opacity-50"
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
                        className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 py-3 rounded mt-6 text-sm font-bold uppercase tracking-wider transition-colors"
                    >
                        {t('teacher.endSession')}
                    </button>
                </div>
            </div>
        </div>
    );
};