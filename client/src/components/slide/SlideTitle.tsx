import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  value: string;
  mode: 'view' | 'edit';
  onChange?: (val: string) => void;
  placeholder?: string;
}

export const SlideTitle: React.FC<Props> = ({ value, mode, onChange, placeholder }) => {
  const { t } = useTranslation();
  const effectivePlaceholder = placeholder || t('editor.slideTitlePlaceholder');
  if (mode === 'edit') {
    return (
      <input
        className="text-5xl font-bold text-gray-800 shrink-0 w-full bg-transparent border-b-2 border-dashed border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:outline-none transition-colors pb-2"
        placeholder={effectivePlaceholder}
        value={value}
        onChange={e => onChange?.(e.target.value)}
      />
    );
  }

  if (!value) return null;

  return (
    <h2 className="text-5xl font-bold text-gray-800 shrink-0">{value}</h2>
  );
};
