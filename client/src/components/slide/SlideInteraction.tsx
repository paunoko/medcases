import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import type { CaseSlide, Option } from '../../types';
import { OptionCard } from './OptionCard';
import { SlideNotes } from './SlideNotes';

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
        <div className="grid grid-cols-2 gap-5 w-full">
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

            return (
              <OptionCard
                key={opt.id || i}
                id={opt.id}
                index={i}
                text={opt.text}
                isCorrect={isCorrect}
                mode={mode}
                slideType={slide.type as 'MULTIPLE_CHOICE' | 'TRUE_FALSE'}
                allowMultiple={!!(slide as any).allowMultiple}
                percent={percent}
                isRevealed={isRevealed}
                onTextChange={newText => {
                  const opts = [...(slide as any).options];
                  opts[i].text = newText;
                  onUpdate?.('options', opts);
                }}
                onCorrectChange={checked => {
                  if (!(slide as any).allowMultiple) {
                    const opts = (slide as any).options.map((o: Option, idx: number) => ({
                      ...o,
                      isCorrect: idx === i
                    }));
                    onUpdate?.('options', opts);
                  } else {
                    const opts = [...(slide as any).options];
                    opts[i].isCorrect = checked;
                    onUpdate?.('options', opts);
                  }
                }}
                onDelete={() => {
                  const opts = (slide as any).options.filter((_: any, idx: number) => idx !== i);
                  onUpdate?.('options', opts);
                }}
              />
            );
          })}

          {/* Add Option Button (Edit Only) */}
          {isEdit && slide.type === 'MULTIPLE_CHOICE' && (
            <button
              onClick={() => onUpdate?.('options', [...(slide.options || []), { id: Math.random().toString(), text: '', isCorrect: false }])}
              className="p-5 border-2 sm:border-3 border-dashed border-gray-300 rounded-2xl w-full min-h-[104px] text-gray-500 font-bold text-xl hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 bg-gray-50/70 hover:bg-blue-50 cursor-pointer"
            >
              <Plus size={20} />
              <span>{t('editor.addOption')}</span>
            </button>
          )}

          {/* True/False Specific Edit (Correct Answer Toggle) */}
          {isEdit && slide.type === 'TRUE_FALSE' && (
            <div className="col-span-2 flex items-center gap-6 p-6 border-2 sm:border-3 border-gray-200 rounded-2xl bg-gray-50 w-full hover:border-blue-300 transition-colors">
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

          {/* Notes (Edit and View modes) */}
          <div className="col-span-2">
            <SlideNotes
              value={(slide as any).explanation}
              mode={mode}
              isRevealed={isRevealed}
              onChange={val => onUpdate?.('explanation', val)}
            />
          </div>
        </div>
      )}

      {/* OPEN TEXT */}
      {slide.type === 'OPEN_TEXT' && (
        <div className="space-y-4">
          <SlideNotes
            value={slide.modelAnswer ?? (slide as any).explanation}
            mode={mode}
            isRevealed={isRevealed}
            onChange={val => {
              onUpdate?.('modelAnswer', val);
              onUpdate?.('explanation', val);
            }}
          />

          {!isEdit && (
            <>
              {answers.length > 0 && (
                <div className="text-xl font-bold text-gray-400 mb-1">
                  {t('teacher.answersCount', { count: answers.length })}
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
                {!isRevealed && answers.length === 0 && (
                  <div className="text-2xl text-gray-400 italic py-2">{t('editor.waitingForAnswers')}</div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
