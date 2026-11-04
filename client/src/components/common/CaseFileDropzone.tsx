import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUp, FolderOpen } from 'lucide-react';

interface CaseFileDropzoneProps {
    onFileSelected: (file: File) => void;
    variant?: 'emerald' | 'blue' | 'purple';
    className?: string;
}

export const CaseFileDropzone: React.FC<CaseFileDropzoneProps> = ({
    onFileSelected,
    variant = 'emerald',
    className = ''
}) => {
    const { t } = useTranslation();
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isEmerald = variant === 'emerald';
    const isPurple = variant === 'purple';

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            onFileSelected(file);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelected(file);
            e.target.value = '';
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 cursor-pointer select-none ${
                isDragging
                    ? isEmerald
                        ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
                        : isPurple
                        ? 'border-purple-500 bg-purple-50/80 scale-[1.01]'
                        : 'border-blue-500 bg-blue-50/80 scale-[1.01]'
                    : isEmerald
                    ? 'border-emerald-200 hover:border-emerald-500 bg-slate-50/80 hover:bg-emerald-50/30'
                    : isPurple
                    ? 'border-purple-200 hover:border-purple-500 bg-slate-50/80 hover:bg-purple-50/30'
                    : 'border-blue-200 hover:border-blue-500 bg-slate-50/80 hover:bg-blue-50/30'
            } ${className}`}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".phron,.medcase"
                className="hidden"
                onChange={handleFileInputChange}
            />

            <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                    isEmerald
                        ? 'bg-emerald-100 text-emerald-700'
                        : isPurple
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                }`}
            >
                {isDragging ? <FolderOpen size={28} /> : <FileUp size={28} />}
            </div>

            <p className="font-extrabold text-gray-900 text-base leading-snug">
                {t('teacher.dragFileHere', { defaultValue: 'Raahaa .phron-tiedosto tähän' })}
            </p>

            <div className="flex items-center gap-2.5 w-full max-w-[160px] my-0.5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-semibold text-gray-400 lowercase tracking-wide">
                    {t('common.or', { defaultValue: 'tai' })}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
                type="button"
                className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition-all active:scale-[0.98] pointer-events-none ${
                    isEmerald
                        ? 'bg-emerald-600 shadow-emerald-600/25'
                        : isPurple
                        ? 'bg-purple-600 shadow-purple-600/25'
                        : 'bg-blue-600 shadow-blue-600/25'
                }`}
            >
                {t('teacher.selectFile', { defaultValue: 'Valitse tiedosto koneelta' })}
            </button>
        </div>
    );
};
