import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, X } from 'lucide-react';

export interface OptionCardProps {
  id: string;
  index: number;
  text: string;
  isCorrect?: boolean;
  mode: 'view' | 'edit';
  slideType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  allowMultiple?: boolean;
  percent?: number;
  isRevealed?: boolean;
  onTextChange?: (text: string) => void;
  onCorrectChange?: (isCorrect: boolean) => void;
  onDelete?: () => void;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  index,
  text,
  isCorrect = false,
  mode,
  slideType,
  allowMultiple = false,
  percent = 0,
  isRevealed = false,
  onTextChange,
  onCorrectChange,
  onDelete
}) => {
  const { t } = useTranslation();
  const isEdit = mode === 'edit';

  return (
    <div
      className={`relative flex flex-col justify-between border-2 sm:border-3 w-full min-h-[104px] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${
        isEdit
          ? isCorrect
            ? 'border-emerald-500 bg-emerald-50/70'
            : 'border-gray-200 bg-white hover:border-gray-300 focus-within:border-blue-500'
          : isRevealed && isCorrect
            ? 'border-emerald-600 bg-emerald-50/90 shadow-md ring-2 ring-emerald-500/20'
            : isRevealed
              ? 'border-gray-200 bg-gray-50/80'
              : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Top Content Area */}
      <div className="p-5 flex items-start gap-4 flex-1">
        {/* Letter Badge (A, B, C...) */}
        {slideType === 'MULTIPLE_CHOICE' && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-2xl shrink-0 transition-colors shadow-sm select-none ${
              isEdit
                ? 'bg-gray-100 border border-gray-200 text-gray-700'
                : isRevealed && isCorrect
                  ? 'bg-emerald-600 text-white'
                  : isRevealed
                    ? 'bg-gray-200 text-gray-600 border border-gray-300'
                    : 'bg-blue-50 border border-blue-100 text-blue-950'
            }`}
          >
            {String.fromCharCode(65 + index)}
          </div>
        )}

        {/* Text Area / Text Display */}
        <div className="flex-1 min-w-0">
          {isEdit ? (
            <textarea
              rows={2}
              className="font-bold text-2xl flex-1 bg-transparent focus:outline-none w-full resize-none leading-tight text-gray-900 placeholder:text-gray-400"
              placeholder={t('editor.optionPlaceholder')}
              value={text}
              onChange={e => onTextChange?.(e.target.value)}
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              {isRevealed && isCorrect && (
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 border border-emerald-300/80 px-2.5 py-0.5 rounded-md w-fit">
                  <CheckCircle2 size={14} className="stroke-[2.5]" />
                  {t('teacher.correctAnswerBadge')}
                </span>
              )}
              <span
                className={`text-2xl break-words whitespace-pre-wrap leading-snug tracking-tight font-bold ${
                  isRevealed && isCorrect ? 'text-emerald-950' : 'text-gray-900'
                }`}
              >
                {text}
              </span>
            </div>
          )}
        </div>

        {/* Right slot: Edit controls OR Percentage badge */}
        {isEdit ? (
          <div className="flex items-center gap-2 shrink-0 pt-1">
            {!allowMultiple && slideType === 'MULTIPLE_CHOICE' ? (
              <input
                type="radio"
                name={`correct-opt`}
                className="w-7 h-7 accent-emerald-600 cursor-pointer"
                checked={!!isCorrect}
                onChange={() => onCorrectChange?.(true)}
                title={t('editor.markAsCorrect')}
              />
            ) : (
              <input
                type="checkbox"
                className="w-7 h-7 rounded accent-emerald-600 cursor-pointer"
                checked={!!isCorrect}
                onChange={e => onCorrectChange?.(e.target.checked)}
                title={t('editor.markAsCorrect')}
              />
            )}
            {onDelete && (
              <button
                type="button"
                className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                onClick={onDelete}
                title={t('common.delete')}
              >
                <X size={20} />
              </button>
            )}
          </div>
        ) : (
          <div className="shrink-0 flex items-center justify-end font-mono">
            <span
              className={`text-2xl font-black px-3.5 py-1.5 rounded-xl border shadow-sm transition-opacity duration-500 ${
                !isRevealed
                  ? 'opacity-0 select-none pointer-events-none'
                  : isCorrect
                    ? 'opacity-100 bg-emerald-600 text-white border-emerald-700'
                    : 'opacity-100 bg-blue-50 text-blue-950 border-blue-200'
              }`}
            >
              {percent}%
            </span>
          </div>
        )}
      </div>

      {/* Option B: Bottom Progress Track (Presentation mode only) */}
      {!isEdit && (
        <div className="w-full h-3 bg-gray-100 overflow-hidden mt-auto">
          <div
            className={`h-full transition-all duration-1000 ease-out rounded-r-full ${
              isRevealed && isCorrect
                ? 'bg-emerald-500'
                : isRevealed
                  ? 'bg-blue-500'
                  : 'w-0'
            }`}
            style={{ width: isRevealed ? `${percent}%` : '0%' }}
          />
        </div>
      )}
    </div>
  );
};
