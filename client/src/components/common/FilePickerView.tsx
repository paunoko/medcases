import React from 'react';
import { useTranslation } from 'react-i18next';
import { CaseFileDropzone } from './CaseFileDropzone';
import { AppHeader } from './AppHeader';

interface FilePickerViewProps {
    title: string;
    subtitle?: string;
    onFileSelected: (file: File) => void;
    onBack: () => void;
    variant?: 'emerald' | 'blue';
    badgeIcon?: React.ReactNode;
}

export const FilePickerView: React.FC<FilePickerViewProps> = ({
    title,
    subtitle,
    onFileSelected,
    onBack,
    variant = 'emerald',
    badgeIcon
}) => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/20 to-slate-100/60 flex flex-col relative overflow-hidden">
            {/* Ambient background glow decoration */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[540px] h-[540px] bg-blue-100/35 rounded-full blur-3xl pointer-events-none -z-0" />

            {/* TOP HEADER */}
            <AppHeader showAboutButton={false} />

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full relative z-10">
                <div className="w-full max-w-lg bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/60 border border-gray-100 flex flex-col items-center text-center animate-fade-in">
                    {badgeIcon && (
                        <div className="mb-4">
                            {badgeIcon}
                        </div>
                    )}

                    <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-snug">
                        {title}
                    </h2>

                    {subtitle && (
                        <p className="text-sm font-medium text-gray-500 mt-1.5 mb-2 max-w-md">
                            {subtitle}
                        </p>
                    )}

                    <CaseFileDropzone
                        onFileSelected={onFileSelected}
                        variant={variant}
                        className="my-5"
                    />

                    <button
                        type="button"
                        onClick={onBack}
                        className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer py-1"
                    >
                        {t('common.cancel', { defaultValue: 'Peruuta' })}
                    </button>
                </div>
            </main>
        </div>
    );
};
