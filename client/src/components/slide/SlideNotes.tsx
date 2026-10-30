import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lightbulb, Eye, Plus, X } from 'lucide-react';

export interface SlideNotesProps {
  value?: string;
  mode: 'view' | 'edit';
  isRevealed?: boolean;
  onChange?: (val?: string) => void;
  className?: string;
}

export const SlideNotes: React.FC<SlideNotesProps> = ({
  value,
  mode,
  isRevealed = false,
  onChange,
  className = ''
}) => {
  const { t } = useTranslation();
  const isEdit = mode === 'edit';

  if (isEdit) {
    const isOpen = value !== undefined;

    if (!isOpen) {
      return (
        <div className={`w-full ${className}`}>
          <button
            type="button"
            onClick={() => onChange?.('')}
            className="w-full py-2.5 px-4 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600 text-gray-500 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 transition-colors bg-gray-50/60 hover:bg-blue-50/60 cursor-pointer"
          >
            <Plus size={18} />
            <span>{t('editor.addNotes')}</span>
          </button>
        </div>
      );
    }

    return (
      <div className={`w-full p-5 bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-2xl flex flex-col gap-2 relative transition-all ${className}`}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 border border-amber-300/80 px-2.5 py-1 rounded-md">
            <Eye size={14} />
            {t('editor.notesHint')}
          </span>
          <button
            type="button"
            onClick={() => onChange?.(undefined)}
            className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
            title={t('editor.removeNotes')}
          >
            <X size={18} />
          </button>
        </div>

        <label className="font-bold text-xl text-amber-950">
          {t('editor.notesLabel')}
        </label>

        <textarea
          rows={3}
          className="w-full bg-transparent text-xl font-medium text-gray-900 focus:outline-none placeholder-amber-700/40 resize-y leading-relaxed"
          placeholder={t('editor.notesPlaceholder')}
          value={value || ''}
          onChange={e => onChange?.(e.target.value)}
        />
      </div>
    );
  }

  // View / Presentation mode
  if (!isRevealed || !value || !value.trim()) {
    return null;
  }

  return (
    <div className={`w-full p-5 bg-amber-50/90 border-2 border-amber-300 rounded-2xl shadow-sm animate-fade-in flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-2 text-amber-950 font-black text-xl">
        <Lightbulb size={20} className="text-amber-600 stroke-[2.5]" />
        <span>{t('editor.notesTitle')}</span>
      </div>
      <p className="text-xl text-gray-900 font-medium leading-relaxed whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
};
