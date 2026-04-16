import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { StudentView } from './StudentView';
import { GraduationCap, Stethoscope, MonitorPlay, Sparkles, Pencil } from 'lucide-react';

export const LandingView = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
    const [inSession, setInSession] = useState(false);

    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
            // Clear state so refresh doesn't keep it? Optional.
        }
    }, [location.state]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            {/* Tabs - Piilotetaan jos oppilas on istunnossa */}
            {!inSession && (
                <div className="flex space-x-4 mt-8 mb-4 z-10">
                    <button
                        onClick={() => setActiveTab('student')}
                        className={`px-6 py-3 rounded-full font-bold text-lg transition-all ${activeTab === 'student'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <span className="flex items-center gap-2">Olen opiskelija <GraduationCap size={24} /></span>
                    </button>
                    <button
                        onClick={() => setActiveTab('teacher')}
                        className={`px-6 py-3 rounded-full font-bold text-lg transition-all ${activeTab === 'teacher'
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <span className="flex items-center gap-2">Olen opettaja <Stethoscope size={24} /></span>
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="w-full flex-1 flex flex-col items-center">
                {activeTab === 'student' ? (
                    <div className="w-full flex-1">
                        {/* StudentView has its own layout, so we just render it. 
                            It might overlap with tabs if not careful, but StudentView is min-h-screen.
                            We might need to adjust StudentView later if layout is weird.
                        */}
                        <StudentView onSessionChange={setInSession} />
                    </div>
                ) : (
                    <div className="w-full max-w-md p-4 mt-8">
                        <div className="bg-white p-8 rounded-xl shadow-xl space-y-4">
                            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Opettajan toiminnot</h2>

                            <button
                                onClick={() => navigate('/teacher')}
                                className="w-full p-4 bg-green-100 text-green-800 rounded-lg font-bold text-lg hover:bg-green-200 transition-colors text-left flex items-center gap-3"
                            >
                                <MonitorPlay size={28} /> Esitä potilastapaus
                            </button>

                            <button
                                onClick={() => navigate('/editor')}
                                className="w-full p-4 bg-blue-100 text-blue-800 rounded-lg font-bold text-lg hover:bg-blue-200 transition-colors text-left flex items-center gap-3"
                            >
                                <Sparkles size={28} /> Luo uusi tapaus
                            </button>

                            <button
                                onClick={() => navigate('/editor?mode=edit')}
                                className="w-full p-4 bg-yellow-100 text-yellow-800 rounded-lg font-bold text-lg hover:bg-yellow-200 transition-colors text-left flex items-center gap-3"
                            >
                                <Pencil size={28} /> Muokkaa tapausta
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
