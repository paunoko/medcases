import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import type { CaseSlide, Option } from '../../types';

interface Props {
  slide: CaseSlide;
  mode: 'view' | 'edit';
  answers?: any[];
  isRevealed?: boolean;
  onUpdate?: (field: string, value: any) => void;
  onToggleReveal?: () => void;
}

export const SlideInteraction: React.FC<Props> = ({
  slide,
  mode,
  answers = [],
  isRevealed = false,
  onUpdate,
  onToggleReveal
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

  if (slide.type === 'INFO') return null;

  return (
    <div className={`shrink-0 flex flex-col gap-6 ${(!slide.imageFileName && !isEdit) ? 'mt-auto' : ''}`}>

      {/* QUESTION AREA */}
      {isEdit ? (
        <input
          className="text-4xl font-bold text-blue-950 w-full bg-transparent border-b-2 border-dashed border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors pb-2"
          placeholder={t('editor.questionPlaceholder')}
          value={slide.question || ''}
          onChange={e => onUpdate?.('question', e.target.value)}
        />
      ) : (
        slide.question && (
          <div className="flex flex-col gap-2">
            {slide.type === 'MULTIPLE_CHOICE' && (slide as any).allowMultiple && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-base font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 w-fit">
                {t('student.multipleChoiceHint')}
              </div>
            )}
            {slide.type === 'OPEN_TEXT' && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-base font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 w-fit">
                {t('student.openTextHint')}
              </div>
            )}
            <h3 className="text-4xl font-bold text-blue-950 tracking-tight">
              {slide.question}
            </h3>
          </div>
        )
      )}

      {/* MULTIPLE CHOICE SETTINGS (Edit Only) */}
      {isEdit && slide.type === 'MULTIPLE_CHOICE' && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl w-fit">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-6 h-6 rounded accent-blue-600 cursor-pointer"
              checked={!!(slide as any).allowMultiple}
              onChange={e => {
                const allowMultiple = e.target.checked;
                let opts = (slide as any).options || [];
                if (!allowMultiple) {
                  let foundFirst = false;
                  opts = opts.map((opt: Option) => {
                    if (opt.isCorrect && !foundFirst) {
                      foundFirst = true;
                      return opt;
                    }
                    return { ...opt, isCorrect: false };
                  });
                }
                onUpdate?.('allowMultiple', allowMultiple);
                onUpdate?.('options', opts);
              }}
            />
            <span className="font-bold text-xl text-gray-700">{t('editor.allowMultiple')}</span>
          </label>
        </div>
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
                <div key={i} className={`relative p-6 border-4 flex-1 min-w-[200px] min-h-[96px] basis-full lg:basis-[calc(50%-1rem)] 2xl:basis-[calc(25%-1rem)] rounded-2xl flex items-center shadow-sm transition-all focus-within:border-blue-500 ${opt.isCorrect ? 'border-emerald-500 bg-emerald-50/70' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className="flex w-full items-start gap-4">
                    {slide.type === 'MULTIPLE_CHOICE' && (
                      <span className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 font-bold text-gray-700 flex items-center justify-center text-sm shrink-0 mt-1 select-none shadow-sm">
                        {String.fromCharCode(65 + i)}
                      </span>
                    )}
                    {!(slide as any).allowMultiple && slide.type === 'MULTIPLE_CHOICE' ? (
                      <input
                        type="radio"
                        name={`correct-opt-${slide.id}`}
                        className="w-8 h-8 mt-1 shrink-0 accent-emerald-600 cursor-pointer"
                        checked={!!opt.isCorrect}
                        onChange={() => {
                          const opts = (slide as any).options.map((o: Option, idx: number) => ({
                            ...o,
                            isCorrect: idx === i
                          }));
                          onUpdate?.('options', opts);
                        }}
                        title={t('editor.markAsCorrect')}
                      />
                    ) : (
                      <input
                        type="checkbox"
                        className="w-8 h-8 mt-1 rounded shrink-0 accent-emerald-600 cursor-pointer"
                        checked={opt.isCorrect}
                        onChange={e => {
                          const opts = [...(slide as any).options];
                          opts[i].isCorrect = e.target.checked;
                          onUpdate?.('options', opts);
                        }}
                        title={t('editor.markAsCorrect')}
                      />
                    )}
                    <textarea
                      rows={2}
                      className="font-bold text-2xl flex-1 bg-transparent focus:outline-none w-full resize-none leading-tight text-gray-900"
                      placeholder={t('editor.optionPlaceholder')}
                      value={opt.text}
                      onChange={e => {
                        const opts = [...(slide as any).options];
                        opts[i].text = e.target.value;
                        onUpdate?.('options', opts);
                      }}
                    />
                    {opt.isCorrect && (
                      <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300 uppercase tracking-wider shrink-0 mt-1">
                        <CheckCircle2 size={14} className="stroke-[2.5]" />
                        {t('teacher.correctAnswerBadge')}
                      </span>
                    )}
                    <button
                      className="text-gray-400 hover:text-red-500 shrink-0 p-2 cursor-pointer transition-colors"
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
              <div 
                key={opt.id} 
                className={`relative p-6 border-4 flex-1 min-w-[200px] min-h-[96px] basis-full lg:basis-[calc(50%-1rem)] 2xl:basis-[calc(25%-1rem)] rounded-2xl flex items-center shadow-sm overflow-visible transition-colors duration-300 ${
                  isRevealed && isCorrect 
                    ? 'border-emerald-600 bg-emerald-50/90 ring-4 ring-emerald-500/20 shadow-md' 
                    : isRevealed 
                      ? 'border-gray-200 bg-gray-50/60' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Result bar in background with smooth animated width and crisp edge */}
                <div
                  className={`absolute inset-0 h-full transition-all duration-1000 ease-out rounded-xl overflow-hidden pointer-events-none ${
                    isRevealed && isCorrect 
                      ? 'bg-emerald-200/80 border-r-4 border-emerald-600' 
                      : isRevealed 
                        ? 'bg-blue-100/90 border-r-4 border-blue-500' 
                        : 'w-0'
                  }`}
                  style={{ width: isRevealed ? `${percent}%` : '0%' }}
                />

                {/* Floating "Oikea vastaus" ribbon badge on top border (does not shift text width or card height) */}
                {isRevealed && isCorrect && (
                  <div className="absolute -top-3.5 left-6 z-20 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-600 text-white font-black text-xs uppercase tracking-wider shadow-md">
                    <CheckCircle2 size={14} className="stroke-[3]" />
                    <span>{t('teacher.correctAnswerBadge')}</span>
                  </div>
                )}

                <div className="relative z-10 flex w-full justify-between items-center gap-4">
                  {/* Option letter badge A, B, C, D... for MULTIPLE_CHOICE */}
                  {slide.type === 'MULTIPLE_CHOICE' && (
                    <div className={`w-11 h-11 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center font-black text-xl lg:text-2xl shrink-0 transition-colors shadow-sm select-none ${
                      isRevealed && isCorrect
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border-2 border-gray-200 text-blue-950'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  )}

                  {/* Option text: constant font-bold and width so text NEVER re-wraps when revealed */}
                  <span className={`text-2xl lg:text-3xl flex-1 break-words whitespace-pre-wrap leading-snug tracking-tight font-bold ${
                    isRevealed && isCorrect ? 'text-emerald-950' : 'text-gray-900'
                  }`}>
                    {opt.text}
                  </span>

                  {/* Dedicated percentage badge slot: reserved fixed width so text column width NEVER changes */}
                  <div className="w-24 lg:w-28 shrink-0 flex items-center justify-end">
                    <span className={`text-2xl lg:text-3xl font-black px-3.5 py-1.5 rounded-xl border-2 shadow-sm font-mono transition-opacity duration-500 ${
                      !isRevealed 
                        ? 'opacity-0 select-none pointer-events-none' 
                        : isCorrect
                          ? 'opacity-100 bg-emerald-600 text-white border-emerald-700'
                          : 'opacity-100 bg-white text-blue-950 border-blue-200'
                    }`}>
                      {percent}%
                    </span>
                  </div>
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
              <textarea
                rows={3}
                className="w-full bg-transparent text-2xl text-gray-800 focus:outline-none placeholder-yellow-600/50 resize-y"
                placeholder={t('editor.modelAnswerPlaceholder')}
                value={slide.modelAnswer || ''}
                onChange={e => onUpdate?.('modelAnswer', e.target.value)}
              />
            </div>
          ) : (
            <>
              {onToggleReveal && (
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xl font-bold text-gray-400">
                    {answers.length > 0 ? t('teacher.answersCount', { count: answers.length }) : ''}
                  </div>
                  <button
                    onClick={onToggleReveal}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors cursor-pointer shadow-sm border border-gray-300"
                    title={isRevealed ? t('teacher.hideAnswers') : t('teacher.revealAnswers')}
                  >
                    {isRevealed ? <EyeOff size={22} className="text-gray-600" /> : <Eye size={22} className="text-blue-600" />}
                    <span className="text-lg">{isRevealed ? t('teacher.hideAnswers') : t('teacher.revealAnswers')}</span>
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-3 max-h-60 overflow-y-auto p-2">
                {answers.map((a, idx) => (
                  <div 
                    key={idx} 
                    className="px-6 py-3 bg-white rounded-full border-2 border-gray-300 text-2xl font-bold text-gray-900 shadow-sm animate-pulse-once flex items-center"
                  >
                    <span className={`transition-all duration-500 pointer-events-none ${!isRevealed ? 'filter blur-[6px] select-none opacity-80' : ''}`}>
                      {Array.isArray(a.answer) ? a.answer.join(', ') : a.answer}
                    </span>
                  </div>
                ))}
                {answers.length === 0 && <div className="text-2xl text-gray-400 italic py-2">{t('editor.waitingForAnswers')}</div>}
              </div>

              {/* Model answer */}
              {isRevealed && (
                <div className="mt-4 p-6 bg-amber-50/90 border-2 border-amber-400 rounded-2xl shadow-sm">
                  <h4 className="font-extrabold text-2xl text-amber-950 mb-2">{t('editor.modelAnswerTitle')}</h4>
                  <p className="text-2xl text-gray-900 font-medium leading-relaxed whitespace-pre-wrap">{slide.modelAnswer || t('editor.noModelAnswer')}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
