import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import type { CaseSlide, Option } from '../../types';

interface Props {
  slide: CaseSlide;
  mode: 'view' | 'edit';
  answers?: any[];
  isRevealed?: boolean;
  onUpdate?: (field: string, value: any) => void;
}

export const SlideInteraction: React.FC<Props> = ({
  slide,
  mode,
  answers = [],
  isRevealed = false,
  onUpdate
}) => {
  const { t } = useTranslation();
  const isEdit = mode === 'edit';

  // Calculate answer distribution (only if answers provided)
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

  if (slide.type === 'INFO' && !isEdit) return null;

  return (
    <div className={`shrink-0 flex flex-col gap-6 ${(!slide.imageFileName && !isEdit) ? 'mt-auto' : ''}`}>

      {/* QUESTION AREA */}
      {slide.type !== 'INFO' && (
        isEdit ? (
          <input
            className="text-4xl font-semibold text-blue-900 w-full bg-transparent border-b-2 border-dashed border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors pb-2"
            placeholder={t('editor.questionPlaceholder')}
            value={slide.question || ''}
            onChange={e => onUpdate?.('question', e.target.value)}
          />
        ) : (
          slide.question && (
            <h3 className="text-4xl font-semibold text-blue-900">
              {slide.question}
            </h3>
          )
        )
      )}

      {/* INTERACTION ELEMENTS */}
      {(slide.type === 'MULTIPLE_CHOICE' || slide.type === 'TRUE_FALSE') && (
        <div className="flex flex-wrap gap-4">
          {/* Options List */}
          {(slide.type === 'TRUE_FALSE' && !isEdit
            ? [
              { id: 'true', text: t('editor.yesTrue'), isCorrect: slide.correctAnswer },
              { id: 'false', text: t('editor.noFalse'), isCorrect: !slide.correctAnswer }
            ]
            : (slide.type === 'MULTIPLE_CHOICE' || slide.type === 'TRUE_FALSE' ? (slide as any).options : [])
          )?.map((opt: Option, i: number) => {
            const percent = getPercentage(opt.id);
            const isCorrect = opt.isCorrect;

            if (isEdit) {
              return (
                <div key={i} className={`relative p-6 border-4 flex-1 min-w-[200px] basis-full lg:basis-[calc(50%-1rem)] 2xl:basis-[calc(25%-1rem)] rounded-2xl flex items-center shadow-sm transition-all focus-within:border-blue-500 ${opt.isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className="flex w-full items-start gap-4">
                    <input
                      type="checkbox"
                      className="w-8 h-8 mt-1 rounded shrink-0 accent-green-600 cursor-pointer"
                      checked={opt.isCorrect}
                      onChange={e => {
                        const opts = [...(slide as any).options];
                        opts[i].isCorrect = e.target.checked;
                        onUpdate?.('options', opts);
                      }}
                      title={t('editor.markAsCorrect')}
                    />
                    <textarea
                      rows={2}
                      className="font-bold text-2xl flex-1 bg-transparent focus:outline-none w-full resize-none leading-tight"
                      placeholder={t('editor.optionPlaceholder')}
                      value={opt.text}
                      onChange={e => {
                        const opts = [...(slide as any).options];
                        opts[i].text = e.target.value;
                        onUpdate?.('options', opts);
                      }}
                    />
                    <button
                      className="text-gray-400 hover:text-red-500 shrink-0 p-2"
                      onClick={() => {
                        const opts = (slide as any).options.filter((_: any, idx: number) => idx !== i);
                        onUpdate?.('options', opts);
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={opt.id} className={`relative p-6 border-4 flex-1 min-w-[200px] basis-full lg:basis-[calc(50%-1rem)] 2xl:basis-[calc(25%-1rem)] rounded-2xl flex items-center shadow-sm transition-all ${isRevealed && isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
                {/* Result bar in background */}
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

          {/* Add Option Button (Edit Only) */}
          {isEdit && slide.type === 'MULTIPLE_CHOICE' && (
            <button
              onClick={() => onUpdate?.('options', [...(slide.options || []), { id: Math.random().toString(), text: '', isCorrect: false }])}
              className="p-6 border-4 border-dashed border-gray-300 rounded-2xl flex-1 min-w-[250px] text-gray-500 font-bold text-2xl hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center bg-gray-50 hover:bg-blue-50"
            >
              {t('editor.addOption')}
            </button>
          )}

          {/* True/False Specific Edit (Correct Answer Toggle) */}
          {isEdit && slide.type === 'TRUE_FALSE' && (
            <div className="flex items-center gap-6 p-6 border-4 border-gray-200 rounded-2xl bg-gray-50 flex-1 hover:border-blue-300 transition-colors">
              <span className="font-bold text-2xl text-gray-700 uppercase tracking-wider">{t('editor.correctAnswer')}</span>
              <select
                className="flex-1 text-2xl font-bold bg-white border-2 border-gray-300 rounded-xl p-3 focus:border-blue-500 focus:outline-none shadow-sm cursor-pointer"
                value={slide.correctAnswer ? 'true' : 'false'}
                onChange={e => onUpdate?.('correctAnswer', e.target.value === 'true')}
              >
                <option value="true">{t('editor.yesTrue')}</option>
                <option value="false">{t('editor.noFalse')}</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* OPEN TEXT */}
      {slide.type === 'OPEN_TEXT' && (
        <div className="space-y-4">
          {isEdit ? (
            <div className="mt-4 p-6 bg-yellow-50 border-4 border-dashed border-yellow-300 rounded-2xl flex flex-col gap-2 hover:border-yellow-400 transition-colors focus-within:border-yellow-500">
              <label className="font-bold text-xl text-yellow-800 uppercase tracking-wider">{t('editor.modelAnswerLabel')}</label>
              <input
                className="w-full bg-transparent text-2xl text-gray-800 focus:outline-none placeholder-yellow-600/50"
                placeholder={t('editor.modelAnswerPlaceholder')}
                value={slide.modelAnswer || ''}
                onChange={e => onUpdate?.('modelAnswer', e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-3 max-h-60 overflow-y-auto p-2">
                {answers.map((a, idx) => (
                  <div 
                    key={idx} 
                    className={`px-6 py-3 bg-gray-100 rounded-full border border-gray-300 text-2xl font-medium animate-pulse-once transition-all duration-500 ${!isRevealed ? 'filter blur-md select-none opacity-50' : ''}`}
                  >
                    {Array.isArray(a.answer) ? a.answer.join(', ') : a.answer}
                  </div>
                ))}
                {answers.length === 0 && <div className="text-2xl text-gray-400 italic">{t('editor.waitingForAnswers')}</div>}
              </div>

              {/* Model answer */}
              {isRevealed && (
                <div className="mt-4 p-6 bg-yellow-50 border-2 border-yellow-300 rounded-2xl">
                  <h4 className="font-bold text-2xl text-yellow-800 mb-2">{t('editor.modelAnswerTitle')}</h4>
                  <p className="text-2xl">{slide.modelAnswer || t('editor.noModelAnswer')}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
