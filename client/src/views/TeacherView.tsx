import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useTeacherSession } from '../hooks/useTeacherSession';
import { SlideRenderer } from '../components/SlideRenderer';
import { loadCaseFromZip } from '../utils/fileHelpers';
import type { PatientCase } from '../types';

export const TeacherView = () => {
    const navigate = useNavigate();
    // Tila ladatulle datalle
    const [caseData, setCaseData] = useState<PatientCase | null>(null);
    const [images, setImages] = useState<Record<string, string>>({});

    // Jos dataa ei ole, näytä latausruutu
    if (!caseData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 relative">
                <button
                    onClick={() => navigate('/', { state: { tab: 'teacher' } })}
                    className="absolute top-4 left-4 bg-white p-2 rounded-full shadow hover:bg-gray-50 text-2xl"
                    title="Takaisin etusivulle"
                >
                    🏠
                </button>
                <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold mb-2">Opettajan näkymä 👨‍⚕️</h1>
                    <p className="text-gray-500 mb-6">Aloita lataamalla .medcase tiedosto</p>

                    <label className="block w-full border-2 border-dashed border-blue-300 rounded-lg p-8 cursor-pointer hover:bg-blue-50 transition-colors">
                        <span className="text-blue-600 font-bold">Valitse tiedosto koneelta</span>
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
                                        alert("Virhe tiedostossa");
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

// Varsinainen istunto
const Dashboard = ({ caseData, images, onExit }: { caseData: PatientCase, images: Record<string, string>, onExit: () => void }) => {
    const session = useTeacherSession(caseData);

    if (!session.roomId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-800 text-white">
                <h1 className="text-4xl font-bold mb-4">{caseData.meta.title}</h1>
                <p className="mb-8 text-gray-300">{caseData.slides.length} diaa valmiina.</p>
                <button
                    onClick={session.createRoom}
                    className="bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-4 px-10 rounded-full shadow-lg transform transition hover:scale-105"
                >
                    AVAA LUOKKAHUONE
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden">

            {/* VASEN: Projektori (Tämä näkyy oppilaille) */}
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

            {/* OIKEA: Kontrollipaneeli (Vain opettajalle) */}
            <div className="w-80 bg-gray-800 p-6 flex flex-col border-l border-gray-700">

                <div className="bg-gray-700 p-4 rounded-lg mb-6 text-center">
                    <div className="text-sm text-gray-400 uppercase font-bold">Huonekoodi</div>
                    <div className="text-5xl font-mono font-bold text-white tracking-widest my-2">{session.roomId}</div>

                    <div className="flex justify-center my-4 bg-white p-2 rounded w-fit mx-auto">
                        <QRCodeSVG value={`${window.location.origin}${import.meta.env.BASE_URL}?room=${session.roomId}`} size={128} />
                    </div>

                    <div className="text-green-400 font-bold">{session.studentCount} oppilasta linjoilla</div>
                </div>

                <div className="flex-1 overflow-y-auto mb-4">
                    {/* Opettajan muistiinpanot */}
                    {session.currentSlide?.teacherNotes && (
                        <div className="bg-yellow-900/50 border border-yellow-600 p-3 rounded text-yellow-100 text-sm mb-4">
                            <strong>Note:</strong> {session.currentSlide.teacherNotes}
                        </div>
                    )}

                    <div className="text-sm text-gray-400">
                        Vastauksia: <span className="text-white font-bold">{session.answers.length}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3 mt-auto">
                    {/* PÄÄNAPPI */}
                    {session.slideState !== 'REVEALED' && session.currentSlide?.type !== 'INFO' ? (
                        <button
                            onClick={session.revealAnswer}
                            className="bg-blue-600 hover:bg-blue-500 py-4 rounded font-bold text-lg shadow-lg"
                        >
                            LUKITSE & PALJASTA
                        </button>
                    ) : (
                        <div className="bg-gray-700 py-4 rounded text-center text-gray-400 font-bold">
                            Vastaukset näkyvissä
                        </div>
                    )}

                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={session.prevSlide}
                            disabled={session.currentIndex === 0}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded disabled:opacity-50"
                        >
                            ← Edellinen
                        </button>
                        <button
                            onClick={session.nextSlide}
                            disabled={session.currentIndex === session.totalSlides - 1}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded disabled:opacity-50"
                        >
                            Seuraava →
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            if (confirm('Haluatko varmasti lopettaa istunnon? Kaikki oppilaat poistetaan.')) {
                                session.endSession();
                                onExit();
                            }
                        }}
                        className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 py-3 rounded mt-6 text-sm font-bold uppercase tracking-wider transition-colors"
                    >
                        Lopeta istunto
                    </button>
                </div>
            </div>
        </div>
    );
};