import React from 'react';
import type { CaseSlide } from '../types';

interface Props {
    slide: CaseSlide;
    imageMap?: Record<string, string>; // Tiedostonimi -> Blob URL
    answers?: any[]; // Opiskelijoiden vastaukset (vain opettajan näkymässä)
    isRevealed?: boolean;
}

export const SlideRenderer: React.FC<Props> = ({ slide, imageMap, answers = [], isRevealed = false }) => {

    // Kuvan URLin haku
    const imageUrl = slide.imageFileName && imageMap ? imageMap[slide.imageFileName] : null;

    // Lasketaan vastausjakauma (vain jos vastauksia on annettu)
    const getPercentage = (optionId: string) => {
        if (answers.length === 0) return 0;
        const count = answers.filter(a => {
            if (Array.isArray(a.answer)) {
                return a.answer.includes(optionId);
            }
            return a.answer === optionId;
        }).length;
        return Math.round((count / answers.length) * 100);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 text-left text-gray-900">

            {/* --- YLÄOSA: Otsikko ja Kuva --- */}
            <div className="bg-gray-50 p-6 border-b">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">{slide.title}</h2>

                {imageUrl && (
                    <div className="flex justify-center bg-black rounded-lg overflow-hidden">
                        <img
                            src={imageUrl}
                            alt="Case attachment"
                            className="w-full h-full max-h-[50vh] object-contain"
                        />
                    </div>
                )}

                {/* Sisältöteksti */}
                <div className="mt-6 prose max-w-none text-lg text-gray-700 whitespace-pre-wrap">
                    {slide.content}
                </div>
            </div>

            {/* --- ALAOSA: Interaktio (Kysymykset) --- */}
            <div className="p-6 bg-white flex-1">

                {/* Kysymysteksti */}
                {(slide.type === 'MULTIPLE_CHOICE' || slide.type === 'TRUE_FALSE' || slide.type === 'OPEN_TEXT') && (
                    <h3 className="text-2xl font-semibold text-blue-900 mb-6">
                        {slide.question}
                    </h3>
                )}

                {/* Monivalinta / True-False vaihtoehdot */}
                {(slide.type === 'MULTIPLE_CHOICE' || slide.type === 'TRUE_FALSE') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Jos True/False, luodaan optiot lennosta */}
                        {(slide.type === 'TRUE_FALSE'
                            ? [{ id: 'true', text: 'Kyllä', isCorrect: slide.correctAnswer }, { id: 'false', text: 'Ei', isCorrect: !slide.correctAnswer }]
                            : slide.options
                        ).map((opt: any) => {
                            const percent = getPercentage(opt.id);
                            const isCorrect = slide.type === 'TRUE_FALSE' ? opt.isCorrect : opt.isCorrect;

                            return (
                                <div key={opt.id} className={`relative p-4 border-2 rounded-lg ${isRevealed && isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                                    {/* Tulos-palkki taustalla */}
                                    {isRevealed && (
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-100 opacity-50 transition-all duration-1000"
                                            style={{ width: `${percent}%` }}
                                        />
                                    )}

                                    <div className="relative z-10 flex justify-between items-center">
                                        <span className="font-bold text-lg">{opt.text}</span>
                                        {isRevealed && <span className="text-sm font-bold bg-white px-2 py-1 rounded shadow">{percent}%</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Vapaa teksti */}
                {slide.type === 'OPEN_TEXT' && (
                    <div className="space-y-4">
                        {/* Oppilaiden vastaukset (Live) */}
                        <div className="space-y-2">
                            {answers.map((a, idx) => (
                                <div key={idx} className="p-4 bg-gray-100 rounded-lg border border-gray-200 text-lg animate-pulse-once">
                                    {Array.isArray(a.answer) ? a.answer.join(', ') : a.answer}
                                </div>
                            ))}
                        </div>

                        {/* Mallivastaus (Vain kun paljastettu) */}
                        {isRevealed && (
                            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
                                <h4 className="font-bold text-yellow-800">Mallivastaus / Huomioita:</h4>
                                <p>{slide.modelAnswer || "Ei mallivastausta määritelty."}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};