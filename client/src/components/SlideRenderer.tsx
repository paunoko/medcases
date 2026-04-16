import React, { useRef } from 'react';
import type { CaseSlide } from '../types';
import { useResizeText } from '../hooks/useResizeText';

interface Props {
    slide: CaseSlide;
    imageMap?: Record<string, string>; // Tiedostonimi -> Blob URL
    answers?: any[]; // Opiskelijoiden vastaukset (vain opettajan näkymässä)
    isRevealed?: boolean;
}

export const SlideRenderer: React.FC<Props> = ({ slide, imageMap, answers = [], isRevealed = false }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    useResizeText(contentRef, [slide.content, slide.imageFileName]);

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
        <div className="flex flex-col h-full w-full bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 text-left text-gray-900 p-8 gap-6">

            {/* Otsikko */}
            {slide.title && (
                <h2 className="text-5xl font-bold text-gray-800 shrink-0">{slide.title}</h2>
            )}

            {/* Keskiosa: Teksti ja Kuva (50/50) */}
            <div className={`flex flex-row gap-6 flex-1 min-h-0 ${(slide.content || imageUrl) ? '' : 'hidden'}`}>
                {/* Sisältöteksti */}
                {slide.content && (
                    <div ref={contentRef} className="flex-1 min-h-0 overflow-y-auto prose max-w-none text-3xl leading-snug text-gray-700 whitespace-pre-wrap custom-scrollbar pr-4">
                        {slide.content}
                    </div>
                )}

                {/* Kuva - venyy tilan mukaan */}
                {imageUrl && (
                    <div className="flex-1 min-h-0 flex justify-center items-center bg-black/5 rounded-lg overflow-hidden border border-gray-200">
                        <img
                            src={imageUrl}
                            alt="Case attachment"
                            className="w-full h-full object-contain"
                        />
                    </div>
                )}
            </div>

            {/* Interaktio (Kysymykset) */}
            <div className={`shrink-0 flex flex-col gap-6 ${!imageUrl ? 'mt-auto' : ''}`}>

                {(slide.type === 'MULTIPLE_CHOICE' || slide.type === 'TRUE_FALSE' || slide.type === 'OPEN_TEXT') && slide.question && (
                    <h3 className="text-4xl font-semibold text-blue-900">
                        {slide.question}
                    </h3>
                )}

                {/* Monivalinta / True-False vaihtoehdot */}
                {(slide.type === 'MULTIPLE_CHOICE' || slide.type === 'TRUE_FALSE') && (
                    <div className="flex flex-wrap gap-4">
                        {(slide.type === 'TRUE_FALSE'
                            ? [{ id: 'true', text: 'Kyllä / Tosi', isCorrect: slide.correctAnswer }, { id: 'false', text: 'Ei / Epätosi', isCorrect: !slide.correctAnswer }]
                            : slide.options
                        )?.map((opt: any) => {
                            const percent = getPercentage(opt.id);
                            const isCorrect = slide.type === 'TRUE_FALSE' ? opt.isCorrect : opt.isCorrect;

                            return (
                                <div key={opt.id} className={`relative p-6 border-4 flex-1 min-w-[200px] basis-full lg:basis-[calc(50%-1rem)] 2xl:basis-[calc(25%-1rem)] rounded-2xl flex items-center shadow-sm transition-all ${isRevealed && isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
                                    {/* Tulos-palkki taustalla */}
                                    {isRevealed && (
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-100 opacity-30 transition-all duration-1000 rounded-xl"
                                            style={{ width: `${percent}%` }}
                                        />
                                    )}

                                    <div className="relative z-10 flex w-full justify-between items-center gap-4">
                                        <span className="font-bold text-2xl flex-1 break-words whitespace-pre-wrap leading-tight">{opt.text}</span>
                                        {isRevealed && <span className="text-xl shrink-0 font-bold bg-white text-blue-900 px-3 py-1 rounded-lg border border-blue-200 shadow-sm">{percent}%</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Vapaa teksti */}
                {slide.type === 'OPEN_TEXT' && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-3 max-h-60 overflow-y-auto p-2">
                            {answers.map((a, idx) => (
                                <div key={idx} className="px-6 py-3 bg-gray-100 rounded-full border border-gray-300 text-2xl font-medium animate-pulse-once">
                                    {Array.isArray(a.answer) ? a.answer.join(', ') : a.answer}
                                </div>
                            ))}
                            {answers.length === 0 && <div className="text-2xl text-gray-400 italic">Odotetaan vastauksia...</div>}
                        </div>

                        {/* Mallivastaus */}
                        {isRevealed && (
                            <div className="mt-4 p-6 bg-yellow-50 border-2 border-yellow-300 rounded-2xl">
                                <h4 className="font-bold text-2xl text-yellow-800 mb-2">Mallivastaus / Huomioita:</h4>
                                <p className="text-2xl">{slide.modelAnswer || "Ei mallivastausta määritelty."}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};